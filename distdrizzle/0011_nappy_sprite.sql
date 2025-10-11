CREATE TABLE "module_comment" (
	"id" serial PRIMARY KEY NOT NULL,
	"content" text NOT NULL,
	"user_id" integer NOT NULL,
	"module_id" integer NOT NULL,
	"created_at" text DEFAULT 'NOW()' NOT NULL,
	"updated_at" text DEFAULT 'NOW()' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "module_comment" ADD CONSTRAINT "module_comment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "module_comment" ADD CONSTRAINT "module_comment_module_id_module_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."module"("id") ON DELETE cascade ON UPDATE no action;