CREATE TABLE IF NOT EXISTS "asset" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255),
	"content" text,
	"documentation" text,
	"likes" integer,
	"views" integer,
	"public" boolean,
	"user_id" integer,
	"chat_id" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "chat" (
	"id" serial PRIMARY KEY NOT NULL,
	"content" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "course" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255),
	"content" text,
	"module_id" integer,
	"level" integer,
	"likes" integer,
	"views" integer,
	"public" boolean,
	"chat_id" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "info" (
	"cgu" text NOT NULL,
	"legal_mentions" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "module" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255),
	"content" text,
	"user_id" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "refresh_token" (
	"id" serial PRIMARY KEY NOT NULL,
	"token" varchar(255) NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"expires_at" varchar(255) NOT NULL,
	"created_at" varchar(255) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "subscription" (
	"id" serial PRIMARY KEY NOT NULL,
	"progress" integer,
	"time_spent" integer,
	"favorite" boolean,
	"liked" boolean,
	"user_id" integer,
	"course_id" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user" (
	"id" serial PRIMARY KEY NOT NULL,
	"pseudo" varchar(100),
	"email" varchar(100),
	"password_hash" text,
	"role" varchar(4)
);
