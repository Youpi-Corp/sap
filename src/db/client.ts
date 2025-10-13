import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Read database connection string from environment
const connectionString = process.env.DATABASE_URL || "";

// Single connection instance for the entire app
const queryClient = postgres(connectionString, {
  max: 10, // Connection pool size
  idle_timeout: 20, // Close idle connections after 20 seconds (prevents stale connections)
  connect_timeout: 10, // Connection timeout in seconds
  max_lifetime: 60 * 30, // Max lifetime of a connection in seconds (30 minutes - prevents negative timeout bug)
  onnotice: () => {}, // Suppress PostgreSQL notices
});

// Export a configured drizzle client with our schema
export const db = drizzle(queryClient, { schema });
