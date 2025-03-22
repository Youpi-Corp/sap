-- Create the initial schema

-- User table (No dependencies)
CREATE TABLE IF NOT EXISTS "user" (
  "id" SERIAL PRIMARY KEY,
  "pseudo" VARCHAR(100),
  "email" VARCHAR(100),
  "password_hash" TEXT,
  "role" VARCHAR(4)
);

-- Chat table (No dependencies)
CREATE TABLE IF NOT EXISTS "chat" (
  "id" SERIAL PRIMARY KEY,
  "content" TEXT
);

-- Module table (Depends on user)
CREATE TABLE IF NOT EXISTS "module" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(255),
  "content" TEXT,
  "user_id" INTEGER REFERENCES "user"("id")
);

-- Asset table (Depends on user and chat)
CREATE TABLE IF NOT EXISTS "asset" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(255),
  "content" TEXT,
  "documentation" TEXT,
  "likes" INTEGER,
  "views" INTEGER,
  "public" BOOLEAN,
  "user_id" INTEGER REFERENCES "user"("id"),
  "chat_id" INTEGER REFERENCES "chat"("id")
);

-- Course table (Depends on module and chat)
CREATE TABLE IF NOT EXISTS "course" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(255),
  "content" TEXT,
  "module_id" INTEGER REFERENCES "module"("id"),
  "level" INTEGER,
  "likes" INTEGER,
  "views" INTEGER,
  "public" BOOLEAN,
  "chat_id" INTEGER REFERENCES "chat"("id")
);

-- Subscription table (Depends on user and course)
CREATE TABLE IF NOT EXISTS "subscription" (
  "id" SERIAL PRIMARY KEY,
  "progress" INTEGER,
  "time_spent" INTEGER,
  "favorite" BOOLEAN,
  "liked" BOOLEAN,
  "user_id" INTEGER REFERENCES "user"("id"),
  "course_id" INTEGER REFERENCES "course"("id")
);

-- Info table (No dependencies)
CREATE TABLE IF NOT EXISTS "info" (
  "cgu" TEXT NOT NULL,
  "legal_mentions" TEXT
);

-- Refresh token table (No dependencies)
CREATE TABLE IF NOT EXISTS "refresh_token" (
  "id" SERIAL PRIMARY KEY,
  "token" VARCHAR(255) NOT NULL,
  "user_id" VARCHAR(255) NOT NULL,
  "expires_at" VARCHAR(255) NOT NULL,
  "created_at" VARCHAR(255) NOT NULL
);

-- Insert default info row if it doesn't exist
INSERT INTO "info" ("cgu", "legal_mentions")
SELECT 'Default Terms and Conditions', 'Default Legal Mentions'
WHERE NOT EXISTS (SELECT 1 FROM "info");