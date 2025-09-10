// Import the API to start the server
import "./src/api";

console.log("🚀 Server should be starting...");

// Let's test the registration endpoint directly
async function testRegistrationEndpoint() {
  // Wait a bit for server to start
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  try {
    console.log("🔍 Testing registration endpoint...");
    
    const testUserData = {
      pseudo: "testuser" + Date.now(),
      email: "test" + Date.now() + "@example.com",
      password: "testpassword123"
    };

    console.log("📤 Sending registration request...");
    const response = await fetch("http://localhost:8080/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testUserData),
    });

    const result = await response.json();
    console.log("📥 Registration response:", result);

    if (response.ok && result.data) {
      const userId = result.data.id;
      console.log("✅ User created with ID:", userId);
      
      // Now check the user's roles via API
      console.log("🔍 Checking user roles via API...");
      // Note: We'll need to implement a way to check roles or use direct DB access
      
      // For now, let's use the service directly
      const { roleService } = await import("./src/services/role");
      const userRoles = await roleService.getUserRoles(userId);
      console.log("👤 User roles:", userRoles.map(r => ({ id: r.id, name: r.name })));
      
      if (userRoles.length === 0) {
        console.log("❌ User has NO roles assigned via registration endpoint!");
      } else {
        console.log("✅ User has roles assigned via registration:", userRoles.map(r => r.name).join(", "));
      }
      
      // Clean up
      const { userService } = await import("./src/services/user");
      await userService.deleteUser(userId);
      console.log("🧹 Test user deleted");
    } else {
      console.error("❌ Registration failed:", result);
    }
  } catch (error) {
    console.error("❌ Error testing registration:", error);
  }
  
  process.exit(0);
}

// Start the test after a delay
setTimeout(testRegistrationEndpoint, 3000);
