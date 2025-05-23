import { db } from "./client";
import { roles, userRoles, users } from "./schema";
import { eq } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { roleService } from "../services/role";
import { ROLES } from "../utils/roles";

/**
 * Migration script to create the new roles tables and
 * migrate existing user roles to the new system
 */
export async function migrateToMultiRoles() {
    console.log("🔄 Starting migration to multi-role system...");

    try {
        // 1. Create the roles and user_roles tables if they don't exist
        await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "role" (
        "id" serial PRIMARY KEY NOT NULL,
        "name" varchar(50) NOT NULL UNIQUE,
        "description" text
      );
      
      CREATE TABLE IF NOT EXISTS "user_role" (
        "id" serial PRIMARY KEY NOT NULL,
        "user_id" integer NOT NULL,
        "role_id" integer NOT NULL,
        FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade,
        FOREIGN KEY ("role_id") REFERENCES "public"."role"("id") ON DELETE cascade,
        UNIQUE("user_id", "role_id")
      );
    `);

        console.log("✅ Created roles tables");

        // 2. Initialize default roles
        await roleService.initializeDefaultRoles();
        console.log("✅ Initialized default roles");

        // 3. Migrate existing user roles
        const allUsers = await db.select().from(users);
        console.log(`Found ${allUsers.length} users to migrate`);

        let migratedUserCount = 0;

        for (const user of allUsers) {
            if (!user.role) {
                // User has no role, assign default user role
                try {
                    const userRole = await roleService.getRoleByName(ROLES.USER);
                    await roleService.assignRoleToUser(user.id, userRole.id);
                    migratedUserCount++;
                } catch (error) {
                    console.error(`Failed to assign default role to user ${user.id}:`, error);
                }
            } else {
                // Determine which role(s) to assign based on legacy role
                let rolesToAssign: string[] = [];

                switch (user.role) {
                    case "3":
                    case "3000":
                        rolesToAssign.push(ROLES.ADMIN);
                        break;
                    case "2":
                    case "2000":
                        rolesToAssign.push(ROLES.CONTENT_CREATOR);
                        break;
                    case "1":
                    case "1000":
                        rolesToAssign.push(ROLES.TEACHER);
                        break;
                    default:
                        rolesToAssign.push(ROLES.USER);
                }

                // Assign the roles
                for (const roleName of rolesToAssign) {
                    try {
                        const role = await roleService.getRoleByName(roleName);
                        await roleService.assignRoleToUser(user.id, role.id);
                    } catch (error) {
                        console.error(`Failed to assign role ${roleName} to user ${user.id}:`, error);
                    }
                }

                migratedUserCount++;
            }
        }

        console.log(`✅ Migrated ${migratedUserCount} users to the new role system`);

        return true;
    } catch (error) {
        console.error("❌ Error during multi-role migration:", error);
        throw error;
    }
}

// Execute migration if this script is run directly
if (require.main === module) {
    migrateToMultiRoles()
        .then(() => {
            console.log("✅ Multi-role migration completed successfully");
            process.exit(0);
        })
        .catch(error => {
            console.error("❌ Multi-role migration failed:", error);
            process.exit(1);
        });
}
