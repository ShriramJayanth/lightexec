#!/bin/bash

# LightExec Startup Script
# This script handles the complete startup sequence after a reboot

set -e

echo "🚀 Starting LightExec..."

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Docker is running
echo -e "${YELLOW}[1/5] Checking Docker...${NC}"
if ! docker info > /dev/null 2>&1; then
    echo -e "${YELLOW}Docker is not running. Starting Docker...${NC}"
    sudo systemctl start docker
    sleep 3
fi
echo -e "${GREEN}✓ Docker is running${NC}"

# Stop any existing containers/processes
echo -e "${YELLOW}[2/5] Cleaning up existing processes...${NC}"
docker-compose down > /dev/null 2>&1 || true
pkill -f "npm run dev" > /dev/null 2>&1 || true
lsof -ti:3000 | xargs kill -9 > /dev/null 2>&1 || true
lsof -ti:3001 | xargs kill -9 > /dev/null 2>&1 || true
sleep 2
echo -e "${GREEN}✓ Cleanup complete${NC}"

# Start PostgreSQL
echo -e "${YELLOW}[3/5] Starting PostgreSQL database...${NC}"
docker-compose up -d postgres
echo "Waiting for database to be ready..."
sleep 8

# Check database health
until docker-compose exec -T postgres pg_isready -U lightexec > /dev/null 2>&1; do
    echo "Waiting for database..."
    sleep 2
done
echo -e "${GREEN}✓ Database is ready${NC}"

# Run database migrations
echo -e "${YELLOW}[4/5] Running database migrations...${NC}"
cd backend
npx prisma generate > /dev/null 2>&1
npx prisma migrate deploy > /dev/null 2>&1 || npx prisma db push > /dev/null 2>&1
cd ..
echo -e "${GREEN}✓ Database migrations complete${NC}"

# Start backend and frontend
echo -e "${YELLOW}[5/5] Starting backend and frontend servers...${NC}"
cd backend
npm run dev > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to fully start
echo "Waiting for backend to start..."
sleep 8

cd frontend
npm run dev > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait for frontend to start
echo "Waiting for frontend to start..."
sleep 8

# Check if servers are running
if ps -p $BACKEND_PID > /dev/null && ps -p $FRONTEND_PID > /dev/null; then
    echo -e "${GREEN}✓ All services started successfully!${NC}"
    echo ""
    echo "═══════════════════════════════════════════"
    echo -e "${GREEN}🎉 LightExec is ready!${NC}"
    echo "═══════════════════════════════════════════"
    echo -e "📱 Frontend:  ${GREEN}http://localhost:3000${NC}"
    echo -e "🔧 Backend:   ${GREEN}http://localhost:3001${NC}"
    echo -e "🗄️  Database:  ${GREEN}localhost:5432${NC}"
    echo ""
    echo -e "${YELLOW}View logs:${NC}"
    echo "  Backend:  tail -f /tmp/backend.log"
    echo "  Frontend: tail -f /tmp/frontend.log"
    echo ""
    echo -e "${YELLOW}Stop services:${NC} pkill -f 'npm run dev' && docker-compose down"
    echo "═══════════════════════════════════════════"
else
    echo -e "${RED}✗ Failed to start services${NC}"
    echo "Check logs:"
    echo "  tail -f /tmp/backend.log"
    echo "  tail -f /tmp/frontend.log"
    exit 1
fi
