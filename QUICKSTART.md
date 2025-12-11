# 🚀 Quick Start Guide

Get LightExec running in 5 minutes!

## Option 1: Automated Setup (Recommended)

```bash
# 1. Clone repository
git clone <repository-url>
cd lightexec-project

# 2. Run setup script
chmod +x setup.sh
./setup.sh

# 3. Start development
npm run dev
```

Visit http://localhost:3000 to see the application!

## Option 2: Manual Setup

### Step 1: Install Dependencies

```bash
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

### Step 2: Configure Environment

**Backend** (`backend/.env`):
```env
PORT=3001
DOCKER_SOCKET_PATH=/var/run/docker.sock
MAX_CONCURRENT_CONTAINERS=10000
PREWARM_POOL_SIZE=50
LOG_LEVEL=info
```

**Frontend** (`frontend/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001
```

### Step 3: Build Sandbox Images

```bash
chmod +x scripts/build-sandboxes.sh
./scripts/build-sandboxes.sh
```

### Step 4: Start Services

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

## Option 3: Docker Deployment

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

## 🧪 Testing the Application

1. **Open** http://localhost:3000
2. **Select** a programming language (e.g., Python)
3. **Write** some code:
   ```python
   print("Hello from LightExec!")
   for i in range(5):
       print(f"Number: {i}")
   ```
4. **Click** "Run Code" button
5. **View** output in the right panel

## 📊 Key Features to Try

### 1. Multiple Languages
- Switch between Python, JavaScript, C++, Java, etc.
- Each language has its own isolated environment

### 2. Real-time Stats
- Check the stats panel on the right
- See active containers, success rates, execution times

### 3. Input/Output
- Use the "Input" tab to provide stdin to your program
- View detailed execution info in the "Info" tab

### 4. Code Examples
- Click on examples in the sidebar
- Load pre-built code samples for each language

### 5. Execution Metrics
- Execution time
- Memory usage
- Exit codes
- Compilation output (for compiled languages)

## 🔍 Troubleshooting

### Port 3000 already in use
```bash
# Change frontend port
cd frontend
# Edit package.json: "dev": "next dev -p 3002"
```

### Port 3001 already in use
```bash
# Change backend port
cd backend
# Edit .env: PORT=3002
# Update frontend/.env.local: NEXT_PUBLIC_API_URL=http://localhost:3002
```

### Docker permission denied
```bash
sudo usermod -aG docker $USER
newgrp docker
```

### Sandbox images not found
```bash
# Rebuild images
./scripts/build-sandboxes.sh
```

## 📱 API Usage Example

```bash
# Execute Python code
curl -X POST http://localhost:3001/api/execute \
  -H "Content-Type: application/json" \
  -d '{
    "code": "print(\"Hello World\")",
    "language": "python"
  }'

# Get supported languages
curl http://localhost:3001/api/languages

# Get system stats
curl http://localhost:3001/api/stats
```

## 🎯 What's Next?

- Read the full [README.md](./README.md)
- Explore the codebase
- Try different programming languages
- Check security features in action
- Monitor performance metrics

## 💡 Tips

1. **Ctrl+Enter** to run code (when editor is focused)
2. **Select language first** before writing code for proper syntax highlighting
3. **Use stdin tab** for programs that need input
4. **Check stats panel** to monitor system performance
5. **Review security warnings** in execution output

## 🆘 Need Help?

- Check [README.md](./README.md) for detailed documentation
- Open an issue on GitHub
- Review error messages in terminal/logs

---

Happy coding! 🎉
