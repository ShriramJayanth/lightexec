#!/bin/bash

# LightExec Kill Script
# Stops all services started by start.sh

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "🛑 Stopping LightExec..."

# Kill npm dev servers and their child processes
echo -e "${YELLOW}[1/3] Stopping frontend & backend servers...${NC}"
pkill -f "npm run dev"    > /dev/null 2>&1 || true
pkill -f "next-server"    > /dev/null 2>&1 || true
pkill -f "next dev"       > /dev/null 2>&1 || true
pkill -f "ts-node"        > /dev/null 2>&1 || true
pkill -f "nodemon"        > /dev/null 2>&1 || true

# Force-kill anything still holding ports 3000 / 3001
sleep 1
for PORT in 3000 3001; do
    PIDS=$(lsof -ti:$PORT 2>/dev/null)
    if [ -n "$PIDS" ]; then
        echo -e "${RED}Force-killing processes on port $PORT: $PIDS${NC}"
        echo "$PIDS" | xargs kill -9 > /dev/null 2>&1 || true
    fi
done
echo -e "${GREEN}✓ Dev servers stopped${NC}"

# Stop Docker containers
echo -e "${YELLOW}[2/3] Stopping Docker containers...${NC}"
docker-compose down > /dev/null 2>&1 || true
echo -e "${GREEN}✓ Docker containers stopped${NC}"

# Verify ports are free
echo -e "${YELLOW}[3/3] Verifying ports are free...${NC}"
for PORT in 3000 3001; do
    if lsof -ti:$PORT > /dev/null 2>&1; then
        echo -e "${RED}⚠️  Port $PORT is still in use!${NC}"
    else
        echo -e "${GREEN}✓ Port $PORT is free${NC}"
    fi
done

echo ""
echo "═══════════════════════════════════════════"
echo -e "${GREEN}✅ LightExec stopped.${NC}"
echo "═══════════════════════════════════════════"
