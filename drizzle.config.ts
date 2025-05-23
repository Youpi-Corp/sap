import type { Config } from "drizzle-kit";

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  driver: "pglite",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "http://localhost:5432",
  },
} as Config;
