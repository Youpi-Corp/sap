/**
 * Script to fix 'NOW()' string timestamps in the database
 * Replaces literal 'NOW()' strings with actual ISO timestamps
 */

import { db } from "../db/client";
import { users, courses } from "../db/schema";
import { eq, sql } from "drizzle-orm";

async function fixTimestamps() {
  console.log("Starting timestamp fix...");
  
  const now = new Date().toISOString();
  
  try {
    // Fix users table
    console.log("\nFixing users table...");
    const usersResult = await db
      .update(users)
      .set({
        created_at: now,
        updated_at: now
      })
      .where(sql`${users.created_at} = 'NOW()' OR ${users.updated_at} = 'NOW()'`)
      .returning();
    
    console.log(`✓ Fixed ${usersResult.length} users`);
    
    // Fix courses table
    console.log("\nFixing courses table...");
    const coursesResult = await db
      .update(courses)
      .set({
        created_at: now,
        updated_at: now
      })
      .where(sql`${courses.created_at} = 'NOW()' OR ${courses.updated_at} = 'NOW()'`)
      .returning();
    
    console.log(`✓ Fixed ${coursesResult.length} courses`);
    
    console.log("\n✅ Timestamp fix completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error fixing timestamps:", error);
    process.exit(1);
  }
}

// Run the script
fixTimestamps();
