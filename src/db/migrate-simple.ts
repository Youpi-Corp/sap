#!/usr/bin/env bun
import { execSync } from "child_process";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Verify DATABASE_URL is set
if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL environment variable is not set");
    process.exit(1);
}

console.log("🔄 Running database migrations with drizzle-kit...");

try {
    // Run drizzle-kit migrate
    execSync("bun run db:migrate", {
        stdio: "inherit",
        env: process.env
    });

    console.log("✅ Database migrations completed successfully");
} catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
}
