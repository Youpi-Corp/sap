import { db } from "../db/client";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import { roleService } from "../services/role";

/**
 * Script to view roles for a user or list all users with their roles
 * Run with: bun run src/scripts/view-user-roles.ts [user_identifier]
 * 
 * user_identifier can be:
 * - User ID (number)
 * - Email address (string with @)
 * - Leave empty to list all users
 * 
 * Examples:
 * bun run src/scripts/view-user-roles.ts           # List all users
 * bun run src/scripts/view-user-roles.ts 1         # View roles for user ID 1
 * bun run src/scripts/view-user-roles.ts user@example.com  # View roles for email
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

async function viewUserRoles(userIdentifier: string): Promise<void> {
    console.log(`🔍 Looking for user: ${userIdentifier}`);

    // Find the user
    const user = await findUser(userIdentifier);
    if (!user) {
        throw new Error(`User not found: ${userIdentifier}`);
    }

    console.log(`\n👤 User Information:`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Pseudo: ${user.pseudo || 'No pseudo'}`);
    console.log(`   Email: ${user.email || 'No email'}`);

    // Get user roles
    const roles = await roleService.getUserRoles(user.id);

    console.log(`\n🎭 Roles (${roles.length}):`);
    if (roles.length === 0) {
        console.log(`   No roles assigned`);
    } else {
        for (const role of roles) {
            console.log(`   - ${role.name}${role.description ? `: ${role.description}` : ''}`);
        }
    }

    // Show permissions
    const roleNames = roles.map(r => r.name);
    if (roleNames.length > 0) {
        console.log(`\n🔐 Role Summary: ${roleNames.join(', ')}`);
    }
}

async function listAllUsers(): Promise<void> {
    console.log(`📋 Listing all users and their roles...\n`);

    // Get all users
    const allUsers = await db
        .select({ id: users.id, pseudo: users.pseudo, email: users.email })
        .from(users)
        .orderBy(users.id);

    if (allUsers.length === 0) {
        console.log(`No users found in the database.`);
        return;
    }

    for (const user of allUsers) {
        // Get roles for this user
        const roles = await roleService.getUserRoles(user.id);
        const roleNames = roles.map(r => r.name);

        console.log(`👤 User ID ${user.id}: ${user.pseudo || 'No pseudo'} (${user.email || 'No email'})`);
        console.log(`   🎭 Roles: ${roleNames.length > 0 ? roleNames.join(', ') : 'No roles assigned'}\n`);
    }

    console.log(`📊 Total users: ${allUsers.length}`);
}

async function showUsage(): Promise<void> {
    console.log(`
📖 Usage: bun run src/scripts/view-user-roles.ts [user_identifier]

🔍 User identifier can be:
   - User ID (number): e.g., 1, 5, 123
   - Email address: e.g., user@example.com
   - Leave empty to list all users with their roles

📝 Examples:
   bun run src/scripts/view-user-roles.ts                    # List all users
   bun run src/scripts/view-user-roles.ts 1                  # View roles for user ID 1
   bun run src/scripts/view-user-roles.ts user@example.com   # View roles for email
`);
}

async function main(): Promise<void> {
    const args = process.argv.slice(2);

    // If no arguments, list all users
    if (args.length === 0) {
        try {
            await listAllUsers();
        } catch (error) {
            console.error(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            process.exit(1);
        }
        return;
    }

    // Show help
    if (args[0] === '--help' || args[0] === '-h') {
        await showUsage();
        return;
    }

    // View specific user
    const userIdentifier = args[0];
    try {
        await viewUserRoles(userIdentifier);
    } catch (error) {
        console.error(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        process.exit(1);
    }
}

// Execute if run directly
if (require.main === module) {
    main()
        .then(() => {
            console.log("\n✨ Done!");
            process.exit(0);
        })
        .catch(err => {
            console.error("❌ Fatal error:", err);
            process.exit(1);
        });
}

export { viewUserRoles, listAllUsers, findUser };
