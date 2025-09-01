#!/bin/sh

# Exit on any error
set -e

echo "🚀 Starting Lab Portal..."

# Wait for database to be ready (if using external database)
if [ -n "$DATABASE_URL" ]; then
    echo "📊 Waiting for database connection..."
    
    # Simple database connection test
    npx prisma db execute --stdin <<< "SELECT 1" > /dev/null 2>&1 || {
        echo "❌ Database connection failed. Retrying in 5 seconds..."
        sleep 5
        npx prisma db execute --stdin <<< "SELECT 1" > /dev/null 2>&1 || {
            echo "❌ Database connection failed after retry. Exiting."
            exit 1
        }
    }
    
    echo "✅ Database connection established"
fi

# Run Prisma migrations
echo "🔄 Running database migrations..."
npx prisma migrate deploy

echo "✅ Database migrations completed"

# Generate Prisma client (in case it's needed)
echo "🔧 Generating Prisma client..."
npx prisma generate

echo "🚀 Starting application..."
exec node server.js
