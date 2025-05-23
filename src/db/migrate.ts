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

// Get migrations path from command line argument or use default
let migrationsPath: string;
const customMigrationsPath = process.argv[2]; // First argument after script name (e.g., bun src/db/migrate.ts ./custom-drizzle-folder)

if (customMigrationsPath) {
  migrationsPath = path.resolve(customMigrationsPath);
  console.log(`Using custom migrations path from argument: ${migrationsPath}`);
} else {
  // Calculate default path relative to the script's location (assuming script is in src/db)
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  // Default path: from src/db/migrate.ts up one level to src/ and then into drizzle/
  // This needs to be relative to the compiled output if you run the compiled script from dist/
  // For `bun run src/db/migrate.ts`, __dirname is src/db. So `../drizzle` means `src/drizzle`.
  // If your drizzle folder is at the root, it should be `path.resolve(__dirname, "..", "..", "drizzle")` if script is in src/db
  // Given the project structure, the drizzle folder is at the root, so from src/db it's two levels up.
  migrationsPath = path.resolve(__dirname, "..", "..", "drizzle");
  console.log(
    `Using default migrations path: ${path.relative(
      process.cwd(),
      migrationsPath
    )} (resolved from script location)`
  );
}

// Create a dedicated connection for migrations
async function runMigrations() {
  console.log("Running migrations...");

  const migrationClient = postgres(connectionString as string, { max: 1 });
  const db = drizzle(migrationClient);

  try {
    // Use the calculated absolute path for migrationsFolder
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
