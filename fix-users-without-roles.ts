import { db } from "./src/db/client";
import { users } from "./src/db/schema";
import { roleService } from "./src/services/role";
import { getDefaultRoles } from "./src/utils/roles";

async function fixUsersWithoutRoles() {
  try {
    console.log("🔧 Fixing users without roles...");
    
    // Get all users
    const allUsers = await db.select().from(users);
    console.log(`📊 Found ${allUsers.length} users in database`);
    
    const defaultRoles = getDefaultRoles();
    console.log(`🔍 Default roles to assign: ${defaultRoles.join(", ")}`);
    
    let fixedUsers = 0;
    
    for (const user of allUsers) {
      try {
        // Check if user has any roles
        const userRoles = await roleService.getUserRoles(user.id);
        
        if (userRoles.length === 0) {
          console.log(`🔧 Fixing user: ${user.pseudo || 'N/A'} (${user.email}) - ID: ${user.id}`);
          
          // Assign default roles
          for (const roleName of defaultRoles) {
            try {
              const role = await roleService.getRoleByName(roleName);
              await roleService.assignRoleToUser(user.id, role.id);
              console.log(`  ✅ Assigned role: ${roleName}`);
            } catch (err) {
              console.error(`  ❌ Failed to assign role ${roleName}:`, err);
            }
          }
          
          fixedUsers++;
        } else {
          console.log(`✅ User ${user.pseudo || 'N/A'} already has roles: ${userRoles.map(r => r.name).join(", ")}`);
        }
      } catch (err) {
        console.error(`❌ Error processing user ${user.id}:`, err);
      }
    }
    
    console.log(`\n✨ Fixed ${fixedUsers} users`);
    
    // Verify the fix
    console.log("\n🔍 Verifying fix...");
    let usersWithoutRoles = 0;
    
    for (const user of allUsers) {
      try {
        const userRoles = await roleService.getUserRoles(user.id);
        if (userRoles.length === 0) {
          usersWithoutRoles++;
        }
      } catch (err) {
        console.error(`Error checking user ${user.id}:`, err);
      }
    }
    
    console.log(`📊 After fix: ${usersWithoutRoles} out of ${allUsers.length} users still have no roles`);
    
  } catch (error) {
    console.error("❌ Error fixing users:", error);
  }
}

fixUsersWithoutRoles().then(() => {
  console.log("\n✨ Fix completed");
  process.exit(0);
}).catch(err => {
  console.error("💥 Fix failed:", err);
  process.exit(1);
});
