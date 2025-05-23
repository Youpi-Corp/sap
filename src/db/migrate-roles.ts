import { db } from "./client";
import { users } from "./schema";
import { eq } from "drizzle-orm";
import { ROLES } from "../utils/roles";

/**
 * Migrates the existing numeric roles to the new string-based role system
 * This script should be run once when deploying the new role system
 */
export async function migrateRoles() {
    console.log("🔄 Starting role migration...");

    // Get all users
    const allUsers = await db.select().from(users);
    console.log(`Found ${allUsers.length} users to migrate`);

    // Migration counter
    let migrated = 0;

    // Process each user
    for (const user of allUsers) {
        let newRole: string;

        // Convert old numeric roles to new string roles
        if (!user.role) {
            newRole = ROLES.USER;
        } else {
            // In the old system:
            // 0: Learner (now USER)
            // 1: Teacher 
            // 2: Conceptor
            // 3: Admin (now ADMIN)
            switch (user.role) {
                case "3":
                case "3000": // Admin role
                    newRole = ROLES.ADMIN;
                    break;
                default:
                    newRole = ROLES.USER; // All other roles become regular users
                    break;
            }
        }

        // Only update if the role needs to change
        if (user.role !== newRole) {
            await db
                .update(users)
                .set({ role: newRole })
                .where(eq(users.id, user.id));

            migrated++;
            console.log(`Migrated user ${user.id} from role '${user.role}' to '${newRole}'`);
        }
    }

    console.log(`✅ Role migration complete. Migrated ${migrated} users.`);
}

// If this file is run directly, execute the migration
if (require.main === module) {
    migrateRoles()
        .then(() => process.exit(0))
        .catch((err) => {
            console.error("Error during role migration:", err);
            process.exit(1);
        });
}
