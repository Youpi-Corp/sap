import { userService } from "./src/services/user";
import { roleService } from "./src/services/role";

async function testUserCreation() {
  try {
    console.log("🔍 Testing user creation with default roles...");
    
    // First, let's check if roles exist
    console.log("\n📋 Checking existing roles:");
    try {
      const allRoles = await roleService.getAllRoles();
      console.log("Available roles:", allRoles.map(r => ({ id: r.id, name: r.name })));
    } catch (err) {
      console.error("Error getting roles:", err);
    }

    // Create a test user
    const testUserData = {
      pseudo: "testuser" + Date.now(),
      email: "test" + Date.now() + "@example.com",
      password: "testpassword123"
    };

    console.log("\n👤 Creating test user:", testUserData.email);
    const newUser = await userService.createUser(testUserData, false);
    console.log("✅ User created:", { id: newUser.id, pseudo: newUser.pseudo, email: newUser.email });

    // Check if the user has roles
    console.log("\n🔐 Checking user roles:");
    try {
      const userRoles = await roleService.getUserRoles(newUser.id);
      console.log("User roles:", userRoles.map(r => ({ id: r.id, name: r.name })));
      
      if (userRoles.length === 0) {
        console.log("❌ User has NO roles assigned!");
      } else {
        console.log("✅ User has roles assigned:", userRoles.map(r => r.name).join(", "));
      }
    } catch (err) {
      console.error("❌ Error checking user roles:", err);
    }

    // Clean up - delete the test user
    console.log("\n🧹 Cleaning up test user...");
    await userService.deleteUser(newUser.id);
    console.log("✅ Test user deleted");

  } catch (error) {
    console.error("❌ Error in test:", error);
  }
}

testUserCreation().then(() => {
  console.log("\n✨ Test completed");
  process.exit(0);
}).catch(err => {
  console.error("💥 Test failed:", err);
  process.exit(1);
});
