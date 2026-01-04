#!/bin/bash

# LightExec - Database Setup Script
# This script initializes the PostgreSQL database and runs migrations

set -e

echo "🚀 LightExec Database Setup"
echo "============================"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker is installed"
echo ""

# Create .env file if it doesn't exist
if [ ! -f backend/.env ]; then
    echo "📝 Creating backend/.env file..."
    cp backend/.env.example backend/.env
    echo "✅ Created backend/.env file"
    echo "⚠️  Please update JWT_SECRET and database credentials in production!"
    echo ""
fi

# Start PostgreSQL container
echo "🐘 Starting PostgreSQL database..."
docker-compose up -d postgres
echo "✅ PostgreSQL is starting..."
echo ""

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for database to be ready..."
sleep 5

MAX_RETRIES=30
RETRY_COUNT=0

until docker-compose exec -T postgres pg_isready -U lightexec &> /dev/null || [ $RETRY_COUNT -eq $MAX_RETRIES ]; do
    echo "   Waiting for database... ($RETRY_COUNT/$MAX_RETRIES)"
    sleep 2
    RETRY_COUNT=$((RETRY_COUNT + 1))
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo "❌ Database failed to start after $MAX_RETRIES attempts"
    exit 1
fi

echo "✅ Database is ready!"
echo ""

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
echo "✅ Dependencies installed"
echo ""

# Generate Prisma Client
echo "🔧 Generating Prisma Client..."
npx prisma generate
echo "✅ Prisma Client generated"
echo ""

# Run database migrations
echo "🔄 Running database migrations..."
npx prisma migrate dev --name init
echo "✅ Database migrations completed"
echo ""

# Return to root directory
cd ..

echo ""
echo "✅ Setup Complete!"
echo "=================="
echo ""
echo "Next steps:"
echo "1. Start the backend: npm run dev:backend"
echo "2. Start the frontend: npm run dev:frontend"
echo "3. Login with default admin credentials:"
echo "   Email: admin@lightexec.com"
echo "   Password: admin123"
echo ""
echo "⚠️  IMPORTANT: Change the admin password after first login!"
echo ""
