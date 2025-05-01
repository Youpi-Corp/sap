import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import * as dotenv from "dotenv";
import path from "path"; // Import path
import { fileURLToPath } from "url"; // Import url for ESM __dirname equivalent

// Load environment variables
dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL environment variable is not set");
  process.exit(1);
}

// Calculate absolute path to the drizzle folder
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Assumes migrate.ts is in src/db, adjusts path to go up two levels to the project root then into drizzle
const migrationsPath = path.resolve(__dirname, "..", "..", "drizzle");
console.log(`Looking for migrations in: ${migrationsPath}`); // Add log for debugging

// Create a dedicated connection for migrations
async function runMigrations() {
  console.log("Running migrations...");

  const migrationClient = postgres(connectionString as string, { max: 1 });
  const db = drizzle(migrationClient);

  try {
    // Use the absolute path for migrationsFolder
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
