#!/bin/bash

set -e

echo "🚀 LightExec Setup Script"
echo "=========================="
echo ""

# Check prerequisites
echo "📋 Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ required. Current version: $(node -v)"
    exit 1
fi
echo "✅ Node.js $(node -v)"

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed"
    exit 1
fi
echo "✅ npm $(npm -v)"

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi
echo "✅ Docker $(docker --version)"

# Check Docker daemon
if ! docker ps &> /dev/null; then
    echo "❌ Docker daemon is not running. Please start Docker."
    exit 1
fi
echo "✅ Docker daemon is running"

echo ""
echo "📦 Installing dependencies..."

# Install root dependencies
echo "Installing root dependencies..."
npm install

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend
npm install
cd ..

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd frontend
npm install
cd ..

echo ""
echo "🔧 Setting up environment files..."

# Backend .env
if [ ! -f backend/.env ]; then
    echo "Creating backend/.env from example..."
    cp backend/.env.example backend/.env
    echo "✅ Created backend/.env (please review and adjust if needed)"
else
    echo "⚠️  backend/.env already exists, skipping"
fi

# Frontend .env.local
if [ ! -f frontend/.env.local ]; then
    echo "Creating frontend/.env.local..."
    cat > frontend/.env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001
EOF
    echo "✅ Created frontend/.env.local"
else
    echo "⚠️  frontend/.env.local already exists, skipping"
fi

echo ""
echo "🐳 Building sandbox Docker images..."
echo "This may take several minutes..."

chmod +x scripts/build-sandboxes.sh
./scripts/build-sandboxes.sh

echo ""
echo "✅ Setup complete!"
echo ""
echo "🎉 You're all set! To start development:"
echo ""
echo "   npm run dev           # Start both backend and frontend"
echo ""
echo "Or separately:"
echo "   npm run dev:backend   # Backend on http://localhost:3001"
echo "   npm run dev:frontend  # Frontend on http://localhost:3000"
echo ""
echo "📚 Read README.md for more information"
echo ""
