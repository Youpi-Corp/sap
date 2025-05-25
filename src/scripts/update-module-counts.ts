import { db } from "../db/client";
import { modules, courses } from "../db/schema";
import { eq, count } from "drizzle-orm";

/**
 * This script updates the courses_count for all modules
 * Run with: bun run src/scripts/update-module-counts.ts
 */
async function updateAllModuleCounts() {
    console.log("Updating courses count for all modules...");

    // Get all modules
    const allModules = await db.select().from(modules);

    for (const module of allModules) {
        // Count courses for this module
        const countResult = await db
            .select({ value: count() })
            .from(courses)
            .where(eq(courses.module_id, module.id));

        const coursesCount = countResult[0]?.value || 0;

        // Update the module
        await db
            .update(modules)
            .set({ courses_count: coursesCount })
            .where(eq(modules.id, module.id));

        console.log(`Module ${module.id} (${module.title}): ${coursesCount} courses`);
    }

    console.log("Courses count update completed!");
}

// Run the function
updateAllModuleCounts()
    .then(() => {
        console.log("Done!");
        process.exit(0);
    })
    .catch((err) => {
        console.error("Error:", err);
        process.exit(1);
    });
