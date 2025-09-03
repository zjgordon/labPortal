#!/bin/bash

echo "Setting up Lab Portal..."

# Create .env.local if it doesn't exist
if [ ! -f .env.local ]; then
    echo "Creating .env.local file..."
    cat > .env.local << EOL
# Database
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"

# Admin Authentication
ADMIN_PASSWORD="admin123"
EOL
    echo "✅ Created .env.local with generated secret and admin password"
else
    echo "⚠️  .env.local already exists, skipping..."
fi

# Install dependencies
echo "Installing dependencies..."
npm install

# Generate Prisma client
echo "Generating Prisma client..."
npm run prisma:generate

# Run database migrations
echo "Running database migrations..."
npm run prisma:migrate

# Seed the database
echo "Seeding database..."
npm run prisma:seed

echo "🎉 Setup complete! Run 'npm run dev' to start the development server."
