# Database Migration Guide

## Overview

This project uses Drizzle Kit for database migrations. Migrations are generated during development and applied during deployment.

## Development Workflow

### 1. Generate Migrations

When you change the schema in `src/db/schema.ts`, generate new migrations:

```bash
bun run db:generate
```

This creates new migration files in the `drizzle/` folder.

### 2. Apply Migrations Locally

To apply migrations to your local database:

```bash
bun run db:migrate
```

### 3. Push Schema Changes (Development Only)

For rapid prototyping, you can push schema changes directly:

```bash
bun run db:push
```

⚠️ **Warning**: Only use `db:push` in development. Never in production.

## Production Deployment

### Migration Strategy

1. **Build Phase** (GitHub Actions):

   - Install dependencies
   - Generate migrations if schema changed
   - Build application
   - Archive artifacts including migration files

2. **Deploy Phase** (VM):
   - Install production dependencies (including drizzle-kit)
   - Run migrations with `bun run db:migrate`
   - Start/restart application

### Safety Features

- Migrations are generated during CI/CD, not on production server
- Only production dependencies are installed on the server
- Database URL validation before running migrations
- Proper error handling and rollback on failure

## Available Scripts

- `bun run db:generate` - Generate new migration files
- `bun run db:migrate` - Apply migrations to database
- `bun run db:push` - Push schema changes directly (dev only)
- `bun run db:studio` - Open Drizzle Studio for database inspection
- `bun run db:up` - Apply specific migration

## Environment Variables

Required for migrations:

- `DATABASE_URL` - PostgreSQL connection string

## Migration Files

Migration files are stored in the `drizzle/` directory:

- SQL migration files: `0001_migration_name.sql`
- Metadata: `meta/_journal.json`

## Best Practices

1. **Always generate migrations in development**
2. **Review migration files before committing**
3. **Test migrations on staging environment**
4. **Backup database before production migrations**
5. **Monitor logs during deployment**
