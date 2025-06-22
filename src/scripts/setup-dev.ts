#!/usr/bin/env bun
import { execSync } from "child_process";
import { existsSync } from "fs";

console.log("🚀 Setting up Brainforest API development environment...");

// Check if .env file exists
if (!existsSync(".env")) {
    console.log("⚠️  .env file not found. Please create one with DATABASE_URL and other required variables.");
    console.log("Example .env content:");
    console.log("DATABASE_URL=postgresql://user:password@localhost:5432/brainforest");
    console.log("JWT_SECRET=your-jwt-secret");
    console.log("PORT=8080");
    process.exit(1);
}

try {
    console.log("📦 Installing dependencies...");
    execSync("bun install", { stdio: "inherit" });

    console.log("🔍 Validating migration setup...");
    execSync("bun run db:validate", { stdio: "inherit" });

    console.log("🗄️  Running database migrations...");
    execSync("bun run db:migrate", { stdio: "inherit" });

    console.log("👤 Initializing roles...");
    execSync("bun run init:roles", { stdio: "inherit" });

    console.log("✅ Development environment setup complete!");
    console.log("");
    console.log("Next steps:");
    console.log("- Run 'bun run dev' to start development server");
    console.log("- Run 'bun run db:studio' to open database studio");
    console.log("- Run 'bun run create:admin' to create an admin user");

} catch (error) {
    console.error("❌ Setup failed:", error);
    process.exit(1);
}
