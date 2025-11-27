CREATE TYPE "public"."report_reason" AS ENUM('spam', 'harassment', 'hate', 'nudity', 'self_harm', 'misinformation', 'plagiarism', 'other');--> statement-breakpoint
CREATE TYPE "public"."report_status" AS ENUM('pending', 'dismissed', 'resolved');--> statement-breakpoint
CREATE TYPE "public"."report_target_type" AS ENUM('user', 'module', 'lesson', 'comment');--> statement-breakpoint
CREATE TABLE "report" (
	"id" serial PRIMARY KEY NOT NULL,
	"reporter_id" integer NOT NULL,
	"target_type" "report_target_type" NOT NULL,
	"target_id" integer NOT NULL,
	"reason" "report_reason" NOT NULL,
	"details" text,
	"status" "report_status" DEFAULT 'pending' NOT NULL,
	"created_at" text DEFAULT 'NOW()' NOT NULL,
	"updated_at" text DEFAULT 'NOW()' NOT NULL,
	"resolved_by" integer,
	"resolved_at" text
);
--> statement-breakpoint
ALTER TABLE "report" ADD CONSTRAINT "report_reporter_id_user_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report" ADD CONSTRAINT "report_resolved_by_user_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;