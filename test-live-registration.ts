// Test the live registration endpoint
async function testLiveRegistrationEndpoint() {
  try {
    console.log("🔍 Testing live registration endpoint...");
    
    const testUserData = {
      pseudo: "testuser" + Date.now(),
      email: "test" + Date.now() + "@example.com",
      password: "testpassword123"
    };

    console.log("📤 Sending registration request to live server...");
    console.log("Test user data:", testUserData);
    
    const response = await fetch("https://dev.brain-forest.works/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testUserData),
    });

    console.log("📥 Response status:", response.status);
    
    let result;
    try {
      const text = await response.text();
      console.log("📥 Raw response:", text);
      
      if (text) {
        result = JSON.parse(text);
        console.log("📥 Parsed registration response:", result);
      } else {
        console.log("📥 Empty response body");
        return;
      }
    } catch (err) {
      console.error("❌ Failed to parse response:", err);
      return;
    }

    if (response.ok && result.data) {
      const userId = result.data.id;
      console.log("✅ User created with ID:", userId);
      
      // Now check the user's roles using the service directly
      console.log("🔍 Checking user roles via service...");
      const { roleService } = await import("./src/services/role");
      const userRoles = await roleService.getUserRoles(userId);
      console.log("👤 User roles:", userRoles.map(r => ({ id: r.id, name: r.name })));
      
      if (userRoles.length === 0) {
        console.log("❌ User has NO roles assigned via registration endpoint!");
        
        // Let's try to manually assign default roles to see if that works
        console.log("🔧 Attempting to manually assign default roles...");
        const { getDefaultRoles } = await import("./src/utils/roles");
        
        try {
          const defaultRoles = getDefaultRoles();
          console.log("Default roles to assign:", defaultRoles);
          
          for (const roleName of defaultRoles) {
            try {
              const role = await roleService.getRoleByName(roleName);
              await roleService.assignRoleToUser(userId, role.id);
              console.log(`✅ Assigned role: ${roleName}`);
            } catch (err) {
              console.error(`❌ Failed to assign role ${roleName}:`, err);
            }
          }
          
          // Check roles again
          const newUserRoles = await roleService.getUserRoles(userId);
          console.log("👤 User roles after manual assignment:", newUserRoles.map(r => ({ id: r.id, name: r.name })));
        } catch (err) {
          console.error("❌ Error in manual role assignment:", err);
        }
      } else {
        console.log("✅ User has roles assigned via registration:", userRoles.map(r => r.name).join(", "));
      }
      
      // Clean up
      console.log("🧹 Cleaning up test user...");
      const { userService } = await import("./src/services/user");
      await userService.deleteUser(userId);
      console.log("✅ Test user deleted");
    } else {
      console.error("❌ Registration failed:", result);
    }
  } catch (error) {
    console.error("❌ Error testing registration:", error);
  }
}

testLiveRegistrationEndpoint().then(() => {
  console.log("\n✨ Test completed");
  process.exit(0);
}).catch(err => {
  console.error("💥 Test failed:", err);
  process.exit(1);
});
