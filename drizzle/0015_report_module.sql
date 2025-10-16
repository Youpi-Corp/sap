-- Create module_report table
CREATE TABLE IF NOT EXISTS "module_report" (
  "id" serial PRIMARY KEY,
  "module_id" integer NOT NULL REFERENCES "module" (id) ON DELETE CASCADE,
  "reporter_id" integer REFERENCES "user" (id) ON DELETE SET NULL,
  "reason" varchar(255) NOT NULL,
  "details" text,
  "created_at" text NOT NULL DEFAULT 'NOW()'
);

-- statement-breakpoint
