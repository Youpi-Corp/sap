import { db } from "../db/client";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import { roleService } from "../services/role";
import { ROLES, isValidRole } from "../utils/roles";

/**
 * Script to add or remove individual roles for a user
 * Run with: bun run src/scripts/manage-user-roles.ts <action> <user_identifier> <role1> [role2] [role3] ...
 * 
 * Actions:
 * - add: Add roles to user (keeps existing roles)
 * - remove: Remove roles from user (keeps other roles)
 * 
 * user_identifier can be:
 * - User ID (number)
 * - Email address (string with @)
 * 
 * Examples:
 * bun run src/scripts/manage-user-roles.ts add 1 teacher moderator
 * bun run src/scripts/manage-user-roles.ts remove user@example.com admin
 * bun run src/scripts/manage-user-roles.ts add 5 content_creator
 */

interface UserInfo {
    id: number;
    pseudo: string | null;
    email: string | null;
}

async function findUser(identifier: string): Promise<UserInfo | null> {
    // Check if identifier is a number (user ID)
    const userId = parseInt(identifier);
    if (!isNaN(userId)) {
        const result = await db
            .select({ id: users.id, pseudo: users.pseudo, email: users.email })
            .from(users)
            .where(eq(users.id, userId));
        return result[0] || null;
    }

    // Otherwise treat as email
    const result = await db
        .select({ id: users.id, pseudo: users.pseudo, email: users.email })
        .from(users)
        .where(eq(users.email, identifier));
    return result[0] || null;
}

async function addRolesToUser(userIdentifier: string, roleNames: string[]): Promise<void> {
    console.log(`🔍 Looking for user: ${userIdentifier}`);

    // Find the user
    const user = await findUser(userIdentifier);
    if (!user) {
        throw new Error(`User not found: ${userIdentifier}`);
    }

    console.log(`✅ Found user: ${user.pseudo || 'No pseudo'} (${user.email}) [ID: ${user.id}]`);

    // Validate all role names
    console.log(`🔍 Validating roles: ${roleNames.join(', ')}`);
    for (const roleName of roleNames) {
        if (!isValidRole(roleName)) {
            throw new Error(`Invalid role: ${roleName}. Valid roles are: ${Object.values(ROLES).join(', ')}`);
        }
    }

    // Get current user roles
    const currentRoles = await roleService.getUserRoles(user.id);
    const currentRoleNames = currentRoles.map(r => r.name);
    console.log(`📋 Current roles: ${currentRoleNames.join(', ') || 'None'}`);

    // Add each role
    const addedRoles: string[] = [];
    const skippedRoles: string[] = [];

    for (const roleName of roleNames) {
        try {
            const role = await roleService.getRoleByName(roleName);

            if (currentRoleNames.includes(roleName)) {
                console.log(`⚠️  User already has role: ${roleName}`);
                skippedRoles.push(roleName);
            } else {
                const success = await roleService.assignRoleToUser(user.id, role.id);
                if (success) {
                    console.log(`✅ Added role: ${roleName}`);
                    addedRoles.push(roleName);
                } else {
                    console.log(`⚠️  Failed to add role: ${roleName} (already assigned)`);
                    skippedRoles.push(roleName);
                }
            }
        } catch (error) {
            throw new Error(`Role not found in database: ${roleName}. Make sure to run 'bun run src/scripts/init-roles.ts' first.`);
        }
    }

    // Show summary
    if (addedRoles.length > 0) {
        console.log(`🎉 Successfully added ${addedRoles.length} role(s): ${addedRoles.join(', ')}`);
    }
    if (skippedRoles.length > 0) {
        console.log(`⏭️  Skipped ${skippedRoles.length} role(s): ${skippedRoles.join(', ')}`);
    }

    // Show final roles
    const finalRoles = await roleService.getUserRoles(user.id);
    console.log(`📋 Final roles: ${finalRoles.map(r => r.name).join(', ')}`);
}

async function removeRolesFromUser(userIdentifier: string, roleNames: string[]): Promise<void> {
    console.log(`🔍 Looking for user: ${userIdentifier}`);

    // Find the user
    const user = await findUser(userIdentifier);
    if (!user) {
        throw new Error(`User not found: ${userIdentifier}`);
    }

    console.log(`✅ Found user: ${user.pseudo || 'No pseudo'} (${user.email}) [ID: ${user.id}]`);

    // Validate all role names
    console.log(`🔍 Validating roles: ${roleNames.join(', ')}`);
    for (const roleName of roleNames) {
        if (!isValidRole(roleName)) {
            throw new Error(`Invalid role: ${roleName}. Valid roles are: ${Object.values(ROLES).join(', ')}`);
        }
    }

    // Get current user roles
    const currentRoles = await roleService.getUserRoles(user.id);
    const currentRoleNames = currentRoles.map(r => r.name);
    console.log(`📋 Current roles: ${currentRoleNames.join(', ') || 'None'}`);

    // Remove each role
    const removedRoles: string[] = [];
    const skippedRoles: string[] = [];

    for (const roleName of roleNames) {
        try {
            const role = await roleService.getRoleByName(roleName);

            if (!currentRoleNames.includes(roleName)) {
                console.log(`⚠️  User doesn't have role: ${roleName}`);
                skippedRoles.push(roleName);
            } else {
                const success = await roleService.removeRoleFromUser(user.id, role.id);
                if (success) {
                    console.log(`✅ Removed role: ${roleName}`);
                    removedRoles.push(roleName);
                } else {
                    console.log(`⚠️  Failed to remove role: ${roleName}`);
                    skippedRoles.push(roleName);
                }
            }
        } catch (error) {
            throw new Error(`Role not found in database: ${roleName}. Make sure to run 'bun run src/scripts/init-roles.ts' first.`);
        }
    }

    // Show summary
    if (removedRoles.length > 0) {
        console.log(`🎉 Successfully removed ${removedRoles.length} role(s): ${removedRoles.join(', ')}`);
    }
    if (skippedRoles.length > 0) {
        console.log(`⏭️  Skipped ${skippedRoles.length} role(s): ${skippedRoles.join(', ')}`);
    }

    // Show final roles
    const finalRoles = await roleService.getUserRoles(user.id);
    console.log(`📋 Final roles: ${finalRoles.map(r => r.name).join(', ') || 'None'}`);
}

async function showUsage(): Promise<void> {
    console.log(`
📖 Usage: bun run src/scripts/manage-user-roles.ts <action> <user_identifier> <role1> [role2] [role3] ...

🎬 Actions:
   - add: Add roles to user (keeps existing roles)
   - remove: Remove roles from user (keeps other roles)

🔍 User identifier can be:
   - User ID (number): e.g., 1, 5, 123
   - Email address: e.g., user@example.com

🎭 Available roles:
   - ${Object.values(ROLES).join('\n   - ')}

📝 Examples:
   bun run src/scripts/manage-user-roles.ts add 1 teacher moderator
   bun run src/scripts/manage-user-roles.ts remove user@example.com admin
   bun run src/scripts/manage-user-roles.ts add 5 content_creator
   bun run src/scripts/manage-user-roles.ts remove admin@example.com moderator teacher

💡 Tips:
   - Use 'add' to grant additional roles without affecting existing ones
   - Use 'remove' to revoke specific roles while keeping others
   - Use 'set-user-roles.ts' to replace ALL roles at once
   - Use 'view-user-roles.ts' to check current roles
`);
}

async function main(): Promise<void> {
    const args = process.argv.slice(2);

    if (args.length < 3) {
        await showUsage();
        process.exit(1);
    }

    const action = args[0].toLowerCase();
    const userIdentifier = args[1];
    const roleNames = args.slice(2);

    if (!['add', 'remove'].includes(action)) {
        console.error(`❌ Invalid action: ${action}. Must be 'add' or 'remove'.`);
        await showUsage();
        process.exit(1);
    }

    try {
        if (action === 'add') {
            await addRolesToUser(userIdentifier, roleNames);
        } else if (action === 'remove') {
            await removeRolesFromUser(userIdentifier, roleNames);
        }
    } catch (error) {
        console.error(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        process.exit(1);
    }
}

// Execute if run directly
if (require.main === module) {
    main()
        .then(() => {
            console.log("✨ Done!");
            process.exit(0);
        })
        .catch(err => {
            console.error("❌ Fatal error:", err);
            process.exit(1);
        });
}

export { addRolesToUser, removeRolesFromUser, findUser };
