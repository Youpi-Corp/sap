-- Create role and permission tables first
CREATE TABLE IF NOT EXISTS "permission" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" varchar(50) NOT NULL,
  "description" text,
  CONSTRAINT "permission_name_unique" UNIQUE("name")
);

CREATE TABLE IF NOT EXISTS "role" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" varchar(50) NOT NULL,
  "description" text,
  CONSTRAINT "role_name_unique" UNIQUE("name")
);

CREATE TABLE IF NOT EXISTS "role_permission" (
  "role_id" integer NOT NULL,
  "permission_id" integer NOT NULL,
  CONSTRAINT "role_permission_role_id_permission_id_pk" PRIMARY KEY("role_id","permission_id")
);

CREATE TABLE IF NOT EXISTS "user_role" (
  "user_id" integer NOT NULL,
  "role_id" integer NOT NULL,
  CONSTRAINT "user_role_user_id_role_id_pk" PRIMARY KEY("user_id","role_id")
);

-- Add foreign key constraints
ALTER TABLE "role_permission" ADD CONSTRAINT "role_permission_role_id_role_id_fk" FOREIGN KEY ("role_id") REFERENCES "role"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "role_permission" ADD CONSTRAINT "role_permission_permission_id_permission_id_fk" FOREIGN KEY ("permission_id") REFERENCES "permission"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "user_role" ADD CONSTRAINT "user_role_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "user_role" ADD CONSTRAINT "user_role_role_id_role_id_fk" FOREIGN KEY ("role_id") REFERENCES "role"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Create default roles
INSERT INTO "role" (name, description) VALUES
('admin', 'Administrator with full system access'),
('teacher', 'Teacher who can create and manage courses'),
('conceptor', 'Content creator who can design modules'),
('learner', 'Standard user who can access learning content');

-- Create basic permissions
INSERT INTO "permission" (name, description) VALUES
('manage_users', 'Can create, update, and delete users'),
('manage_roles', 'Can assign and manage user roles'),
('create_module', 'Can create new modules'),
('edit_module', 'Can edit existing modules'),
('delete_module', 'Can delete modules'),
('create_course', 'Can create new courses'),
('edit_course', 'Can edit existing courses'),
('delete_course', 'Can delete courses'),
('view_content', 'Can view learning content'),
('edit_content', 'Can edit learning content');

-- Assign permissions to roles
-- Admin permissions (all)
INSERT INTO "role_permission" (role_id, permission_id)
SELECT r.id, p.id
FROM "role" r
CROSS JOIN "permission" p
WHERE r.name = 'admin';

-- Teacher permissions
INSERT INTO "role_permission" (role_id, permission_id)
SELECT r.id, p.id
FROM "role" r
CROSS JOIN "permission" p
WHERE r.name = 'teacher'
AND p.name IN ('create_course', 'edit_course', 'delete_course', 'view_content', 'edit_content');

-- Conceptor permissions
INSERT INTO "role_permission" (role_id, permission_id)
SELECT r.id, p.id
FROM "role" r
CROSS JOIN "permission" p
WHERE r.name = 'conceptor'
AND p.name IN ('create_module', 'edit_module', 'delete_module', 'view_content', 'edit_content');

-- Learner permissions
INSERT INTO "role_permission" (role_id, permission_id)
SELECT r.id, p.id
FROM "role" r
CROSS JOIN "permission" p
WHERE r.name = 'learner'
AND p.name IN ('view_content');

-- Migrate existing users to new role system
DO $$
BEGIN
  -- Map old role values to new role names
  INSERT INTO "user_role" (user_id, role_id)
  SELECT u.id, r.id
  FROM "user" u
  CROSS JOIN "role" r
  WHERE (
    (CAST(u.role AS TEXT) = '4000' AND r.name = 'admin') OR
    (CAST(u.role AS TEXT) = '3000' AND r.name = 'teacher') OR
    (CAST(u.role AS TEXT) = '2000' AND r.name = 'conceptor') OR
    (CAST(u.role AS TEXT) = '1000' AND r.name = 'learner')
  );
EXCEPTION
  WHEN undefined_column THEN
    -- If role column doesn't exist, give all existing users the learner role
    INSERT INTO "user_role" (user_id, role_id)
    SELECT u.id, r.id
    FROM "user" u
    CROSS JOIN "role" r
    WHERE r.name = 'learner';
END $$;

-- Finally, drop the old role column if it exists
DO $$
BEGIN
  ALTER TABLE "user" DROP COLUMN IF EXISTS "role";
EXCEPTION
  WHEN undefined_column THEN
    NULL;
END $$;
