#!/usr/bin/env bun
import { execSync } from "child_process";
import { existsSync } from "fs";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

console.log("🔍 Pre-migration validation...");

// Check if DATABASE_URL is set
if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL environment variable is not set");
    process.exit(1);
}

// Check if drizzle folder exists
if (!existsSync("./drizzle")) {
    console.error("❌ Drizzle migrations folder not found");
    process.exit(1);
}

// Check if drizzle.config.ts exists
if (!existsSync("./drizzle.config.ts")) {
    console.error("❌ drizzle.config.ts not found");
    process.exit(1);
}

// Test database connection
try {
    console.log("🔗 Testing database connection...");
    execSync("bun -e \"import postgres from 'postgres'; const sql = postgres(process.env.DATABASE_URL); await sql.end();\"", {
        stdio: "pipe",
        env: process.env
    });
    console.log("✅ Database connection successful");
} catch (error) {
    console.error("❌ Database connection failed:", error);
    process.exit(1);
}

console.log("✅ Pre-migration validation passed");
console.log("🚀 Ready to run migrations");
