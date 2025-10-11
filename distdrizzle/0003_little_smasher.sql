CREATE TABLE "course_module" (
	"id" serial PRIMARY KEY NOT NULL,
	"course_id" integer NOT NULL,
	"module_id" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "module" RENAME COLUMN "name" TO "title";--> statement-breakpoint
ALTER TABLE "module" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "module" ADD COLUMN "courses_count" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "module" ADD COLUMN "dtc" varchar(30) DEFAULT 'NOW()' NOT NULL;--> statement-breakpoint
ALTER TABLE "module" ADD COLUMN "dtm" varchar(30) DEFAULT 'NOW()' NOT NULL;--> statement-breakpoint
ALTER TABLE "course_module" ADD CONSTRAINT "course_module_course_id_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_module" ADD CONSTRAINT "course_module_module_id_module_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."module"("id") ON DELETE cascade ON UPDATE no action;