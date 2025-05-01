-- First drop existing foreign key constraints
ALTER TABLE "user_role" DROP CONSTRAINT IF EXISTS "user_role_user_id_user_id_fk";
ALTER TABLE "user_role" DROP CONSTRAINT IF EXISTS "user_role_role_id_role_id_fk";
ALTER TABLE "role_permission" DROP CONSTRAINT IF EXISTS "role_permission_role_id_role_id_fk";
ALTER TABLE "role_permission" DROP CONSTRAINT IF EXISTS "role_permission_permission_id_permission_id_fk";
ALTER TABLE "module" DROP CONSTRAINT IF EXISTS "module_user_id_user_id_fk";
ALTER TABLE "asset" DROP CONSTRAINT IF EXISTS "asset_user_id_user_id_fk";
ALTER TABLE "asset" DROP CONSTRAINT IF EXISTS "asset_chat_id_chat_id_fk";
ALTER TABLE "course" DROP CONSTRAINT IF EXISTS "course_module_id_module_id_fk";
ALTER TABLE "course" DROP CONSTRAINT IF EXISTS "course_chat_id_chat_id_fk";
ALTER TABLE "subscription" DROP CONSTRAINT IF EXISTS "subscription_user_id_user_id_fk";
ALTER TABLE "subscription" DROP CONSTRAINT IF EXISTS "subscription_course_id_course_id_fk";

-- Add new foreign key constraints with proper delete behaviors
ALTER TABLE "user_role" ADD CONSTRAINT "user_role_user_id_user_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;
ALTER TABLE "user_role" ADD CONSTRAINT "user_role_role_id_role_id_fk"
    FOREIGN KEY ("role_id") REFERENCES "role"("id") ON DELETE CASCADE;

ALTER TABLE "role_permission" ADD CONSTRAINT "role_permission_role_id_role_id_fk"
    FOREIGN KEY ("role_id") REFERENCES "role"("id") ON DELETE CASCADE;
ALTER TABLE "role_permission" ADD CONSTRAINT "role_permission_permission_id_permission_id_fk"
    FOREIGN KEY ("permission_id") REFERENCES "permission"("id") ON DELETE CASCADE;

ALTER TABLE "module" ADD CONSTRAINT "module_user_id_user_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL;

ALTER TABLE "asset" ADD CONSTRAINT "asset_user_id_user_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL;
ALTER TABLE "asset" ADD CONSTRAINT "asset_chat_id_chat_id_fk"
    FOREIGN KEY ("chat_id") REFERENCES "chat"("id") ON DELETE SET NULL;

ALTER TABLE "course" ADD CONSTRAINT "course_module_id_module_id_fk"
    FOREIGN KEY ("module_id") REFERENCES "module"("id") ON DELETE SET NULL;
ALTER TABLE "course" ADD CONSTRAINT "course_chat_id_chat_id_fk"
    FOREIGN KEY ("chat_id") REFERENCES "chat"("id") ON DELETE SET NULL;

ALTER TABLE "subscription" ADD CONSTRAINT "subscription_user_id_user_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_course_id_course_id_fk"
    FOREIGN KEY ("course_id") REFERENCES "course"("id") ON DELETE CASCADE;