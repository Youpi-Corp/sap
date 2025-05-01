import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL environment variable is not set");
  process.exit(1);
}

// Use the relative path from the project root (where the script is expected to run)
const migrationsPath = "./drizzle";
console.log(`Using relative migrations path: ${migrationsPath}`); // Log the path being used

// Create a dedicated connection for migrations
async function runMigrations() {
  console.log("Running migrations...");

  const migrationClient = postgres(connectionString as string, { max: 1 });
  const db = drizzle(migrationClient);

  try {
    // Use the relative path for migrationsFolder
    await migrate(db, { migrationsFolder: migrationsPath });
    console.log("Migrations completed successfully");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    await migrationClient.end();
  }
}

runMigrations();
