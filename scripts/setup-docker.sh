#!/bin/bash

echo "🔧 Setting up Docker permissions and building sandbox images..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker daemon is running
if ! docker info &> /dev/null; then
    echo "⚠️  Docker daemon is not running or you don't have permission."
    echo ""
    echo "To fix Docker permissions, run:"
    echo "  sudo usermod -aG docker $USER"
    echo "  newgrp docker"
    echo ""
    echo "Or run this script with sudo (not recommended for production):"
    echo "  sudo $0"
    exit 1
fi

echo "✅ Docker is available"

# Navigate to project root
cd "$(dirname "$0")/.." || exit 1

echo ""
echo "🔨 Building sandbox Docker images..."
echo "This may take several minutes..."
echo ""

# Build Python sandbox
echo "📦 Building Python sandbox..."
docker build -t lightexec-python:3.11 sandbox-images/python/ || {
    echo "❌ Failed to build Python sandbox"
    exit 1
}
echo "✅ Python sandbox built"

# Build Node.js sandbox
echo "📦 Building Node.js sandbox..."
docker build -t lightexec-node:20 sandbox-images/node/ || {
    echo "❌ Failed to build Node.js sandbox"
    exit 1
}
echo "✅ Node.js sandbox built"

# Build C++ sandbox (also used for C)
echo "📦 Building C++ sandbox..."
docker build -t lightexec-cpp:gcc13 sandbox-images/cpp/ || {
    echo "❌ Failed to build C++ sandbox"
    exit 1
}
docker tag lightexec-cpp:gcc13 lightexec-c:gcc13
echo "✅ C++ sandbox built"

# Build Java sandbox
echo "📦 Building Java sandbox..."
docker build -t lightexec-java:21 sandbox-images/java/ || {
    echo "❌ Failed to build Java sandbox"
    exit 1
}
echo "✅ Java sandbox built"

echo ""
echo "✅ All sandbox images built successfully!"
echo ""
echo "Built images:"
docker images | grep lightexec

echo ""
echo "🚀 You can now start the development servers with: npm run dev"
