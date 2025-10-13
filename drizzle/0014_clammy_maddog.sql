ALTER TABLE "course" ADD COLUMN "created_at" text DEFAULT 'NOW()' NOT NULL;--> statement-breakpoint
ALTER TABLE "course" ADD COLUMN "updated_at" text DEFAULT 'NOW()' NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "created_at" text DEFAULT 'NOW()' NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "updated_at" text DEFAULT 'NOW()' NOT NULL;