import { roleService } from "../services/role";

/**
 * Initialize default roles in the database
 */
async function initializeRoles() {
    console.log("✨ Initializing default roles...");

    try {
        await roleService.initializeDefaultRoles();
        console.log("✅ Default roles initialized successfully");
    } catch (error) {
        console.error("❌ Error initializing default roles:", error);
        process.exit(1);
    }
}

// Execute if run directly
if (require.main === module) {
    initializeRoles()
        .then(() => process.exit(0))
        .catch(err => {
            console.error("Error:", err);
            process.exit(1);
        });
}
