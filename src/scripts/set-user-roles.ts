import { db } from "../db/client";
import { users, userRoles } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { roleService } from "../services/role";
import { ROLES, isValidRole } from "../utils/roles";

/**
 * Script to set roles for a user
 * Run with: bun run src/scripts/set-user-roles.ts <user_identifier> <role1> [role2] [role3] ...
 * 
 * user_identifier can be:
 * - User ID (number)
 * - Email address (string with @)
 * 
 * Examples:
 * bun run src/scripts/set-user-roles.ts 1 admin teacher
 * bun run src/scripts/set-user-roles.ts user@example.com user moderator
 * bun run src/scripts/set-user-roles.ts 5 content_creator
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

async function clearUserRoles(userId: number): Promise<void> {
    await db.delete(userRoles).where(eq(userRoles.user_id, userId));
}

async function setUserRoles(userIdentifier: string, roleNames: string[]): Promise<void> {
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

    // Get role IDs
    const roles = [];
    for (const roleName of roleNames) {
        try {
            const role = await roleService.getRoleByName(roleName);
            roles.push(role);
            console.log(`✅ Role found: ${role.name} [ID: ${role.id}]`);
        } catch (error) {
            throw new Error(`Role not found in database: ${roleName}. Make sure to run 'bun run src/scripts/init-roles.ts' first.`);
        }
    }

    // Get current user roles
    const currentRoles = await roleService.getUserRoles(user.id);
    console.log(`📋 Current roles: ${currentRoles.map(r => r.name).join(', ') || 'None'}`);

    // Clear existing roles
    console.log(`🧹 Clearing existing roles...`);
    await clearUserRoles(user.id);

    // Assign new roles
    console.log(`🔧 Assigning new roles...`);
    for (const role of roles) {
        await roleService.assignRoleToUser(user.id, role.id);
        console.log(`✅ Assigned role: ${role.name}`);
    }

    // Verify the assignment
    const newRoles = await roleService.getUserRoles(user.id);
    console.log(`🎉 User roles updated successfully!`);
    console.log(`📋 New roles: ${newRoles.map(r => r.name).join(', ')}`);

    // Show permissions
    const permissions = await roleService.getUserRoleNames(user.id);
    console.log(`🔐 User now has roles: ${permissions.join(', ')}`);
}

async function showUsage(): Promise<void> {
    console.log(`
📖 Usage: bun run src/scripts/set-user-roles.ts <user_identifier> <role1> [role2] [role3] ...

🔍 User identifier can be:
   - User ID (number): e.g., 1, 5, 123
   - Email address: e.g., user@example.com

🎭 Available roles:
   - ${Object.values(ROLES).join('\n   - ')}

📝 Examples:
   bun run src/scripts/set-user-roles.ts 1 admin teacher
   bun run src/scripts/set-user-roles.ts user@example.com user moderator
   bun run src/scripts/set-user-roles.ts 5 content_creator
   bun run src/scripts/set-user-roles.ts admin@example.com admin

⚠️  Note: This will replace ALL existing roles for the user with the specified roles.
`);
}

async function main(): Promise<void> {
    const args = process.argv.slice(2);

    if (args.length < 2) {
        await showUsage();
        process.exit(1);
    }

    const userIdentifier = args[0];
    const roleNames = args.slice(1);

    try {
        await setUserRoles(userIdentifier, roleNames);
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

export { setUserRoles, findUser };
