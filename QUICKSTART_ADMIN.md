# 🎯 Quick Start Guide - Admin & Participant System

This guide will help you quickly set up and use the new admin and participant features.

## 🚀 Initial Setup (5 minutes)

### 1. Install Dependencies

```bash
# Install all dependencies
npm install

# Or install individually
cd backend && npm install
cd ../frontend && npm install
```

### 2. Setup Database

```bash
# Make script executable
chmod +x scripts/setup-database.sh

# Run setup (starts PostgreSQL, runs migrations)
./scripts/setup-database.sh
```

This will:
- Start PostgreSQL container
- Run database migrations
- Create default admin account

### 3. Start the Application

```bash
# Terminal 1: Start backend
npm run dev:backend

# Terminal 2: Start frontend  
npm run dev:frontend

# Or use one command
npm run dev
```

## 🔐 Access the System

### Admin Portal
1. Open http://localhost:3000/login
2. Login with:
   - Email: `admin@lightexec.com`
   - Password: `admin123`
3. **⚠️ Change password immediately!**

### Participant Portal
1. Register at http://localhost:3000/register
2. Login with your credentials
3. Join sessions using access codes

## 📋 Admin Workflow

### Creating Questions

1. Go to Admin Dashboard → **New Question**
2. Fill in:
   - Title (e.g., "Two Sum Problem")
   - Description (problem statement)
   - Difficulty (easy/medium/hard)
   - Language (python, javascript, etc.)
   - Starter code (optional)
3. Add test cases:
   - Input: stdin for the program
   - Expected output
   - Points awarded
   - Hidden (visible to participants or not)

### Creating Sessions

1. Admin Dashboard → **New Session**
2. Fill in:
   - Session name (e.g., "Interview Round 1")
   - Description
   - Start/End time
   - Select questions to include
3. **Copy the access code** (e.g., `ABC123XY`)
4. Share code with participants

### Monitoring Sessions

- View live participant list
- See all submissions in real-time
- Check scores and performance
- Download results (coming soon)

## 👥 Participant Workflow

### Joining a Session

1. Login/Register
2. Click **Join Session**
3. Enter access code from admin
4. View available questions

### Solving Problems

1. Select a question
2. Read problem description
3. View test cases (non-hidden)
4. Write code in the editor
5. Test locally (optional)
6. **Submit solution**
7. View results:
   - Tests passed/failed
   - Score earned
   - Execution time
   - Memory used

## 🛠️ Development Tips

### Database Management

```bash
# View database in browser
cd backend
npx prisma studio
# Opens http://localhost:5555

# Create new migration
npx prisma migrate dev --name <name>

# Reset database (⚠️ dev only!)
npx prisma migrate reset
```

### Testing API Endpoints

```bash
# Test login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@lightexec.com","password":"admin123"}'

# Test with token
TOKEN="your-jwt-token"
curl http://localhost:3001/api/admin/questions \
  -H "Authorization: Bearer $TOKEN"
```

### Environment Variables

Copy `.env.example` to `.env` in backend folder:

```bash
cd backend
cp .env.example .env
```

Key variables:
- `DATABASE_URL`: PostgreSQL connection
- `JWT_SECRET`: Secret key for tokens (change in production!)
- `ADMIN_EMAIL` / `ADMIN_PASSWORD`: Default admin credentials

## 📊 Features Overview

### ✅ Implemented

- [x] User authentication (JWT)
- [x] Admin: Create/edit questions
- [x] Admin: Add test cases
- [x] Admin: Create sessions
- [x] Admin: Share access codes
- [x] Participant: Join sessions
- [x] Participant: Submit solutions
- [x] Automatic test case validation
- [x] Score calculation
- [x] Execution metrics

### 🚧 Coming Soon

- [ ] Real-time leaderboard
- [ ] Session analytics dashboard
- [ ] Export results (CSV/PDF)
- [ ] Code plagiarism detection
- [ ] Email notifications
- [ ] Bulk participant import
- [ ] Custom branding

## 🐛 Troubleshooting

### Database Won't Start

```bash
# Check Docker is running
docker ps

# Restart PostgreSQL
docker-compose restart postgres

# View logs
docker-compose logs postgres
```

### Can't Login

- Verify backend is running on port 3001
- Check browser console for errors
- Ensure database migrations ran successfully
- Try clearing localStorage: `localStorage.clear()`

### Code Execution Fails

- Ensure Docker daemon is running
- Check sandbox images are built: `./scripts/build-sandboxes.sh`
- View backend logs for errors

## 📚 Documentation

- [Full Admin System Guide](./ADMIN_SYSTEM.md) - Detailed API docs, security, etc.
- [Docker Setup](./DOCKER_SETUP.md) - Container configuration
- [Main README](./README.md) - Project overview

## 🆘 Need Help?

1. Check logs:
   ```bash
   # Backend logs
   npm run dev:backend
   
   # Database logs
   docker-compose logs postgres
   ```

2. Review error messages in browser console

3. Ensure all services are running:
   - PostgreSQL (port 5432)
   - Backend (port 3001)
   - Frontend (port 3000)

## 🎉 You're All Set!

Admin: Create questions → Create session → Share code
Participants: Join session → Solve problems → Submit solutions

Happy coding! 🚀
