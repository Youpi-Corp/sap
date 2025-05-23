import { userService } from "../services/user";
import { ROLES } from "../utils/roles";
import { db } from "../db/client";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";

/**
 * Create or promote a user to admin
 * @param email Email of the user to make admin
 * @param password Password (only used for new users)
 */
async function createAdmin(email: string, password?: string) {
    console.log(`Creating/promoting admin user: ${email}`);

    try {
        // Check if user exists
        const existingUsers = await db
            .select()
            .from(users)
            .where(eq(users.email, email)); if (existingUsers.length > 0) {
                // Update existing user to admin
                const user = existingUsers[0];

                // Check if user already has the admin role in the role system
                const { roleService } = await import("../services/role");
                const hasAdminRole = await roleService.userHasRole(user.id, ROLES.ADMIN);

                if (!hasAdminRole) {
                    try {
                        // Get the admin role and assign it
                        const adminRole = await roleService.getRoleByName(ROLES.ADMIN);
                        await roleService.assignRoleToUser(user.id, adminRole.id);
                        console.log(`✅ Existing user ${email} promoted to ${ROLES.ADMIN}`);
                    } catch (error) {
                        console.error("❌ Error assigning admin role:", error);
                        process.exit(1);
                    }
                } else {
                    console.log(`ℹ️ User ${email} is already an ${ROLES.ADMIN}`);
                }
            } else if (password) {                // Create new admin user
                await userService.createUser(
                    {
                        email,
                        password,
                        roles: [ROLES.ADMIN],
                        pseudo: 'System Administrator'
                    },
                    true // isAdmin=true to allow setting the admin role
                );

                console.log(`✅ Created new ${ROLES.ADMIN} user: ${email}`);
            } else {
            console.error("❌ User doesn't exist and no password provided for creation");
            process.exit(1);
        }
    } catch (error) {
        console.error("❌ Failed to create/promote admin:", error);
        process.exit(1);
    }
}

// Handle command line arguments
if (require.main === module) {
    const args = process.argv.slice(2);

    if (args.length < 1) {
        console.log("Usage: bun run create-admin.ts <email> [password]");
        console.log("  - If the user doesn't exist, password is required");
        console.log("  - If the user exists, they will be promoted to admin");
        process.exit(1);
    }

    const email = args[0];
    const password = args[1];

    createAdmin(email, password)
        .then(() => process.exit(0))
        .catch(err => {
            console.error("Error:", err);
            process.exit(1);
        });
}
