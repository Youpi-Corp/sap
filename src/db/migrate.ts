import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import * as dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load environment variables
dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL environment variable is not set");
  process.exit(1);
}

// Get custom migrations path from command line argument or use default
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const defaultMigrationsPath = path.resolve(__dirname, "..", "drizzle");
const customPath = process.argv[2];
const migrationsPath = customPath
  ? path.resolve(process.cwd(), customPath)
  : defaultMigrationsPath;

console.log(
  `Using migrations path: ${path.relative(process.cwd(), migrationsPath)}`
);

// Create a dedicated connection for migrations
async function runMigrations() {
  console.log("Running migrations...");

  const migrationClient = postgres(connectionString as string, { max: 1 });
  const db = drizzle(migrationClient);

  try {
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
