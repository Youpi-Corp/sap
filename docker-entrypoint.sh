#!/bin/sh

echo "🔍 Waiting for database to be ready..."

# Simple wait for database using a loop
until pg_isready -h db -p 5432 -U postgres; do
  echo "Database is unavailable - sleeping"
  sleep 2
done

echo "📦 Database is ready!"

echo "� Generating database migrations..."
bun run drizzle-kit generate || echo "❌ Migration generation failed, but continuing..."

echo "�️ Running database migrations..."
bun run drizzle-kit migrate || echo "❌ Migration failed, but continuing..."

echo "🚀 Starting application..."
exec bun run src/index.ts
