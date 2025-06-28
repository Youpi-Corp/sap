#!/bin/sh

# Production entrypoint script for backend
set -e

echo "🚀 Starting Brainforest API in PRODUCTION mode..."
echo "Environment: ${NODE_ENV:-production}"
echo "Port: ${PORT:-8080}"

# Wait for database to be ready with timeout
echo "🔍 Waiting for database to be ready..."
DB_HOST="${DB_HOST:-db}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-postgres}"

TIMEOUT=60
COUNTER=0

until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -q; do
  echo "Database is unavailable - sleeping (${COUNTER}/${TIMEOUT})"
  sleep 2
  COUNTER=$((COUNTER + 2))
  
  if [ $COUNTER -ge $TIMEOUT ]; then
    echo "❌ Database connection timeout after ${TIMEOUT} seconds"
    exit 1
  fi
done

echo "📦 Database is ready!"

# Run database migrations
echo "🔧 Generating database migrations..."
if ! bun run drizzle-kit generate; then
  echo "❌ Migration generation failed"
  exit 1
fi

echo "🗄️ Running database migrations..."
if ! bun run drizzle-kit migrate; then
  echo "❌ Migration failed"
  exit 1
fi

echo "✅ Database migrations completed successfully"

# Initialize default data if needed
if [ "${INIT_DEFAULT_DATA:-true}" = "true" ]; then
  echo "📊 Initializing default data..."
  bun run src/scripts/init-default-data.ts || echo "⚠️ Default data initialization failed, continuing..."
fi

# Start the application
echo "🚀 Starting Brainforest API server..."
echo "🌐 Server will be available at http://localhost:${PORT:-8080}"
echo "📚 API documentation at http://localhost:${PORT:-8080}/swagger"

exec bun run src/index.ts
