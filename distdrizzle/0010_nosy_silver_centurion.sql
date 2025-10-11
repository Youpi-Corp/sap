CREATE TABLE "course_completion" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"course_id" integer NOT NULL,
	"completed_at" text DEFAULT 'NOW()' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "course_completion" ADD CONSTRAINT "course_completion_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_completion" ADD CONSTRAINT "course_completion_course_id_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE cascade ON UPDATE no action;