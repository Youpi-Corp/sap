import { db } from "../db/client";
import { users } from "../db/schema";
import { roleService } from "../services/role";
import { getDefaultRoles } from "../utils/roles";

/**
 * Script to update existing users with new default roles
 * This adds the TEACHER role to all users who currently only have the USER role
 * 
 * Run with: bun run src/scripts/update-default-roles.ts
 */

async function updateDefaultRoles(): Promise<void> {
    console.log("🔄 Starting default roles update...");
    
    try {
        // Get all users
        const allUsers = await db.select().from(users);
        console.log(`📊 Found ${allUsers.length} users to check`);

        // Get the default roles
        const defaultRoles = getDefaultRoles();
        console.log(`📋 Default roles: ${defaultRoles.join(', ')}`);

        let updatedUserCount = 0;
        let skippedUserCount = 0;

        for (const user of allUsers) {
            try {
                // Get current user roles
                const currentRoles = await roleService.getUserRoles(user.id);
                const currentRoleNames = currentRoles.map(r => r.name);

                console.log(`👤 Processing user: ${user.pseudo || 'No pseudo'} (${user.email}) [ID: ${user.id}]`);
                console.log(`   Current roles: ${currentRoleNames.join(', ') || 'None'}`);

                // Check which default roles the user is missing
                const missingDefaultRoles = defaultRoles.filter(roleName => !currentRoleNames.includes(roleName));

                if (missingDefaultRoles.length === 0) {
                    console.log(`   ✅ User already has all default roles`);
                    skippedUserCount++;
                    continue;
                }

                // Assign missing default roles
                for (const roleName of missingDefaultRoles) {
                    try {
                        const role = await roleService.getRoleByName(roleName);
                        const assigned = await roleService.assignRoleToUser(user.id, role.id);
                        
                        if (assigned) {
                            console.log(`   ✅ Added default role: ${roleName}`);
                        } else {
                            console.log(`   ⚠️  Role ${roleName} was already assigned`);
                        }
                    } catch (error) {
                        console.error(`   ❌ Failed to assign role ${roleName}:`, error);
                    }
                }

                // Verify final roles
                const finalRoles = await roleService.getUserRoles(user.id);
                const finalRoleNames = finalRoles.map(r => r.name);
                console.log(`   📋 Final roles: ${finalRoleNames.join(', ')}`);
                
                updatedUserCount++;
            } catch (error) {
                console.error(`❌ Error processing user ${user.id}:`, error);
            }
        }

        console.log(`\n🎉 Default roles update completed!`);
        console.log(`📊 Summary:`);
        console.log(`   - Users updated: ${updatedUserCount}`);
        console.log(`   - Users skipped: ${skippedUserCount}`);
        console.log(`   - Total users: ${allUsers.length}`);

    } catch (error) {
        console.error("❌ Error during default roles update:", error);
        throw error;
    }
}

// Execute update if this script is run directly
if (require.main === module) {
    updateDefaultRoles()
        .then(() => {
            console.log("✅ Default roles update script completed successfully");
            process.exit(0);
        })
        .catch((error) => {
            console.error("❌ Default roles update script failed:", error);
            process.exit(1);
        });
}

export { updateDefaultRoles };
