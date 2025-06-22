#!/usr/bin/env bun
import { execSync } from "child_process";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
    console.error("❌ DATABASE_URL environment variable is not set");
    process.exit(1);
}

// Parse DATABASE_URL to extract components
const url = new URL(DATABASE_URL);
const dbName = url.pathname.slice(1); // Remove leading slash
const baseUrl = `${url.protocol}//${url.username}:${url.password}@${url.hostname}:${url.port}/postgres`;

console.log("🛑 Force resetting database with active connections...");
console.log(`Database: ${dbName}`);

try {
    console.log("1. Stopping application...");
    try {
        execSync("pm2 stop brainforest-api", { stdio: "inherit" });
    } catch {
        console.log("   (Application might already be stopped)");
    }

    console.log("2. Force disconnecting all database sessions...");
    const terminateQuery = `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${dbName}' AND pid <> pg_backend_pid();`;
    execSync(`psql "${baseUrl}" -c "${terminateQuery}"`, { stdio: "inherit" });

    console.log("3. Dropping database...");
    execSync(`psql "${baseUrl}" -c "DROP DATABASE IF EXISTS ${dbName};"`, { stdio: "inherit" });

    console.log("4. Creating new database...");
    execSync(`psql "${baseUrl}" -c "CREATE DATABASE ${dbName};"`, { stdio: "inherit" });

    console.log("5. Running migrations...");
    execSync("bun run db:migrate", { stdio: "inherit" });

    console.log("6. Initializing roles...");
    try {
        execSync("bun run init:roles", { stdio: "inherit" });
    } catch {
        console.log("   (Role initialization might have failed - this is often okay)");
    }

    console.log("7. Restarting application...");
    execSync("pm2 start brainforest-api", { stdio: "inherit" });

    console.log("✅ Database reset completed successfully!");

} catch (error) {
    console.error("❌ Reset failed:", error);
    console.log("\n📋 Manual commands to run:");
    console.log("pm2 stop brainforest-api");
    console.log(`psql "${baseUrl}" -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${dbName}' AND pid <> pg_backend_pid();"`);
    console.log(`psql "${baseUrl}" -c "DROP DATABASE IF EXISTS ${dbName};"`);
    console.log(`psql "${baseUrl}" -c "CREATE DATABASE ${dbName};"`);
    console.log("bun run db:migrate");
    console.log("bun run init:roles");
    console.log("pm2 start brainforest-api");
    process.exit(1);
}
