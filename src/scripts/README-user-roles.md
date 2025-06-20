# User Role Management Scripts

This directory contains scripts for managing user roles in the SAP application.

## Available Scripts

### 1. `set-user-roles.ts` - Set/Replace User Roles

Replaces ALL existing roles for a user with the specified roles.

```bash
# Usage
bun run src/scripts/set-user-roles.ts <user_identifier> <role1> [role2] [role3] ...

# Examples
bun run src/scripts/set-user-roles.ts 1 admin teacher
bun run src/scripts/set-user-roles.ts user@example.com user moderator
bun run src/scripts/set-user-roles.ts 5 content_creator
```

### 2. `manage-user-roles.ts` - Add/Remove Individual Roles

Add or remove specific roles without affecting other existing roles.

```bash
# Usage
bun run src/scripts/manage-user-roles.ts <action> <user_identifier> <role1> [role2] [role3] ...

# Examples - Adding roles
bun run src/scripts/manage-user-roles.ts add 1 teacher moderator
bun run src/scripts/manage-user-roles.ts add user@example.com content_creator

# Examples - Removing roles
bun run src/scripts/manage-user-roles.ts remove 1 admin
bun run src/scripts/manage-user-roles.ts remove user@example.com moderator teacher
```

### 3. `view-user-roles.ts` - View User Roles

View roles for a specific user or list all users with their roles.

```bash
# Usage
bun run src/scripts/view-user-roles.ts [user_identifier]

# Examples
bun run src/scripts/view-user-roles.ts                    # List all users
bun run src/scripts/view-user-roles.ts 1                  # View roles for user ID 1
bun run src/scripts/view-user-roles.ts user@example.com   # View roles for email
```

### 4. `init-roles.ts` - Initialize Default Roles

Creates the default roles in the database (should be run first).

```bash
bun run src/scripts/init-roles.ts
```

## User Identification

All scripts support identifying users by:

- **User ID** (number): e.g., `1`, `5`, `123`
- **Email address**: e.g., `user@example.com`

## Available Roles

The system supports these predefined roles:

- **`user`** - Standard user with basic permissions
- **`admin`** - Administrator with full system access
- **`teacher`** - Teacher with course management capabilities
- **`content_creator`** - Can create and manage premium content
- **`moderator`** - Can moderate user content and comments

## Prerequisites

1. **Initialize roles first** - Run the role initialization script:

   ```bash
   bun run src/scripts/init-roles.ts
   ```

2. **Database connection** - Ensure your database is running and properly configured.

## Workflow Examples

### Setting up a new teacher

```bash
# View current roles
bun run src/scripts/view-user-roles.ts teacher@school.com

# Set as teacher (replaces all existing roles)
bun run src/scripts/set-user-roles.ts teacher@school.com teacher

# Or add teacher role (keeps existing roles)
bun run src/scripts/manage-user-roles.ts add teacher@school.com teacher
```

### Making a user an admin

```bash
# Add admin role to existing user
bun run src/scripts/manage-user-roles.ts add 1 admin

# Or replace all roles with admin
bun run src/scripts/set-user-roles.ts 1 admin
```

### Managing content creator permissions

```bash
# Give user both content creator and moderator roles
bun run src/scripts/set-user-roles.ts creator@example.com content_creator moderator

# Later, remove moderator role but keep content creator
bun run src/scripts/manage-user-roles.ts remove creator@example.com moderator
```

### Auditing user roles

```bash
# List all users and their roles
bun run src/scripts/view-user-roles.ts

# Check specific user
bun run src/scripts/view-user-roles.ts suspicious@user.com
```

## Notes

- ⚠️ **`set-user-roles.ts` replaces ALL roles** - Use this when you want to completely reset a user's roles
- ✅ **`manage-user-roles.ts` is additive/subtractive** - Use this for incremental changes
- 📋 **Always verify changes** with `view-user-roles.ts` after making modifications
- 🔒 **Role validation** - All scripts validate role names and user existence before making changes
- 🎯 **Error handling** - Scripts provide clear error messages and usage instructions
