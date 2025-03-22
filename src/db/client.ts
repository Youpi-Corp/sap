import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Read database connection string from environment
const connectionString = process.env.DATABASE_URL || "";

// Single connection instance for the entire app
const queryClient = postgres(connectionString, {
  max: 10, // Connection pool size
  idle_timeout: 30,
  connect_timeout: 10,
});

// Export a configured drizzle client with our schema
export const db = drizzle(queryClient, { schema });
