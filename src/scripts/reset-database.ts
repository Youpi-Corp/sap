#!/usr/bin/env bun
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

console.log("⚠️  WARNING: This will completely delete your database!");
console.log(`Database: ${dbName}`);
console.log("This action cannot be undone.");

// In a real script, you might want to add a confirmation prompt
// For now, we'll just show the commands

console.log("\n🔧 To delete the database, run these commands:");
console.log("\n1. Stop your application:");
console.log("   pm2 stop brainforest-api");

console.log("\n2. Drop the database:");
console.log(`   psql "${baseUrl}" -c "DROP DATABASE IF EXISTS ${dbName};"`);

console.log("\n3. Recreate the database:");
console.log(`   psql "${baseUrl}" -c "CREATE DATABASE ${dbName};"`);

console.log("\n4. Run migrations:");
console.log("   bun run db:migrate");

console.log("\n5. Initialize roles:");
console.log("   bun run init:roles");

console.log("\n6. Restart application:");
console.log("   pm2 start brainforest-api");

console.log("\n💡 Or run this one-liner:");
console.log(`pm2 stop brainforest-api && psql "${baseUrl}" -c "DROP DATABASE IF EXISTS ${dbName};" && psql "${baseUrl}" -c "CREATE DATABASE ${dbName};" && bun run db:migrate && bun run init:roles && pm2 start brainforest-api`);
