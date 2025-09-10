import { db } from "./src/db/client";
import { users } from "./src/db/schema";
import { roleService } from "./src/services/role";

async function checkExistingUsers() {
  try {
    console.log("🔍 Checking existing users and their roles...");
    
    // Get all users
    const allUsers = await db.select().from(users);
    console.log(`📊 Found ${allUsers.length} users in database`);
    
    if (allUsers.length > 0) {
      console.log("\n👥 Users and their roles:");
      
      for (const user of allUsers.slice(-5)) { // Check last 5 users
        console.log(`\n👤 User: ${user.pseudo || 'N/A'} (${user.email}) - ID: ${user.id}`);
        
        try {
          const userRoles = await roleService.getUserRoles(user.id);
          if (userRoles.length > 0) {
            console.log(`  🔐 Roles: ${userRoles.map(r => r.name).join(", ")}`);
          } else {
            console.log(`  ❌ NO ROLES ASSIGNED`);
          }
        } catch (err) {
          console.error(`  ❌ Error getting roles:`, err);
        }
      }
    }
    
    // Check if there are users without roles
    console.log("\n🔍 Checking for users without roles...");
    let usersWithoutRoles = 0;
    
    for (const user of allUsers) {
      try {
        const userRoles = await roleService.getUserRoles(user.id);
        if (userRoles.length === 0) {
          usersWithoutRoles++;
          console.log(`❌ User without roles: ${user.pseudo || 'N/A'} (${user.email}) - ID: ${user.id}`);
        }
      } catch (err) {
        console.error(`Error checking user ${user.id}:`, err);
      }
    }
    
    console.log(`\n📊 Summary: ${usersWithoutRoles} out of ${allUsers.length} users have no roles assigned`);
    
  } catch (error) {
    console.error("❌ Error checking users:", error);
  }
}

checkExistingUsers().then(() => {
  console.log("\n✨ Check completed");
  process.exit(0);
}).catch(err => {
  console.error("💥 Check failed:", err);
  process.exit(1);
});
