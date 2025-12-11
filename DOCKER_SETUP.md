# Docker Setup Instructions

## Issue: Docker Permission Denied

The backend requires Docker to create isolated sandbox containers for code execution. If you see the error:
```
❌ Docker permission denied
```

This means your user doesn't have permission to access the Docker daemon.

## Solution

### Option 1: Add your user to the Docker group (Recommended)

Run these commands:

```bash
# Add your user to the docker group
sudo usermod -aG docker $USER

# Apply the group changes (choose one):
# Option A: Log out and log back in
# Option B: Run this command in the same terminal
newgrp docker

# Option C: Reboot your system
```

After this, restart the development servers:
```bash
npm run dev
```

### Option 2: Use the automated setup script

```bash
./scripts/setup-docker.sh
```

This script will:
1. Check if Docker is installed and running
2. Guide you through fixing permissions if needed
3. Build all required sandbox Docker images

### Option 3: Build images manually with sudo (Not recommended for development)

If you need a quick test:
```bash
# Build the sandbox images
sudo docker build -t lightexec-python:3.11 sandbox-images/python/
sudo docker build -t lightexec-node:20 sandbox-images/node/
sudo docker build -t lightexec-cpp:gcc13 sandbox-images/cpp/
sudo docker build -t lightexec-java:21 sandbox-images/java/
sudo docker tag lightexec-cpp:gcc13 lightexec-c:gcc13

# Then run the backend with sudo (TEMPORARY ONLY)
sudo npm run dev:backend
```

⚠️ **Note:** Running npm with sudo is not recommended for development!

## Verify Docker is Working

After setting up permissions, verify Docker works:

```bash
# This should work without sudo
docker ps

# Check if images are built
docker images | grep lightexec
```

## Current Status

✅ **Frontend**: Running on http://localhost:3000  
✅ **Backend**: Running on http://localhost:3001  
⚠️ **Docker**: Needs permission setup and images need to be built  

## Next Steps

1. Fix Docker permissions using Option 1 above
2. Run `./scripts/setup-docker.sh` to build sandbox images
3. Restart the dev servers: `npm run dev`
4. Test code execution in the frontend!
