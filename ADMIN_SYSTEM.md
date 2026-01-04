# LightExec - Admin & Participant System

This document explains the new admin and participant functionality added to LightExec.

## Overview

LightExec now supports:
- **Admin Portal**: Create questions with test cases, manage coding sessions
- **Participant Portal**: Join sessions via access codes, solve problems, submit solutions
- **Authentication**: JWT-based secure authentication for admins and participants
- **Database**: PostgreSQL with Prisma ORM for data persistence

## Architecture

### Database Schema

**Users**
- Admins and participants stored in same table with role differentiation
- Passwords hashed with bcrypt

**Questions**
- Title, description, difficulty level
- Language-specific starter code
- Time and memory limits
- Created by admins

**Test Cases**
- Input/output pairs for validation
- Hidden test cases not visible to participants
- Point-based scoring system

**Sessions**
- Time-bound coding contests/assessments
- Unique access codes for participant entry
- Multiple questions per session
- Active/inactive status

**Submissions**
- Code submissions with execution results
- Test case pass/fail tracking
- Score and performance metrics

## Setup Instructions

### 1. Initial Setup

```bash
# Run the database setup script
chmod +x scripts/setup-database.sh
./scripts/setup-database.sh
```

This will:
- Start PostgreSQL in Docker
- Install dependencies
- Run database migrations
- Create default admin account

### 2. Start the Application

```bash
# Start both backend and frontend
npm run dev

# Or start individually
npm run dev:backend
npm run dev:frontend
```

### 3. Default Admin Credentials

```
Email: admin@lightexec.com
Password: admin123
```

**⚠️ IMPORTANT: Change these credentials immediately after first login!**

## API Endpoints

### Authentication

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

Returns:
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "ADMIN" | "PARTICIPANT"
  },
  "token": "jwt-token"
}
```

### Admin Endpoints

All admin endpoints require `Authorization: Bearer <token>` header with admin role.

#### Create Question
```http
POST /api/admin/questions
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "title": "Two Sum",
  "description": "Find two numbers that add up to target",
  "difficulty": "easy",
  "languageId": "python",
  "starterCode": "def two_sum(nums, target):\n    pass",
  "timeLimit": 5000,
  "memoryLimit": 256
}
```

#### Add Test Case
```http
POST /api/admin/questions/:id/testcases
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "input": "1 2 3 4\n5",
  "output": "9",
  "isHidden": false,
  "points": 10
}
```

#### Create Session
```http
POST /api/admin/sessions
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "name": "Coding Assessment 2026",
  "description": "Backend developer assessment",
  "startTime": "2026-01-10T10:00:00Z",
  "endTime": "2026-01-10T12:00:00Z",
  "questionIds": ["question-uuid-1", "question-uuid-2"]
}
```

Returns:
```json
{
  "id": "session-uuid",
  "name": "Coding Assessment 2026",
  "accessCode": "ABC123XY",
  ...
}
```

#### Get Session Details
```http
GET /api/admin/sessions/:id
Authorization: Bearer <admin-token>
```

Returns session with participants, submissions, and detailed analytics.

### Participant Endpoints

All participant endpoints require `Authorization: Bearer <token>` header.

#### Join Session
```http
POST /api/participant/sessions/join
Authorization: Bearer <participant-token>
Content-Type: application/json

{
  "accessCode": "ABC123XY"
}
```

#### Get My Sessions
```http
GET /api/participant/sessions
Authorization: Bearer <participant-token>
```

#### Get Session Questions
```http
GET /api/participant/sessions/:sessionId/questions
Authorization: Bearer <participant-token>
```

#### Submit Solution
```http
POST /api/participant/sessions/:sessionId/questions/:questionId/submit
Authorization: Bearer <participant-token>
Content-Type: application/json

{
  "code": "def two_sum(nums, target):\n    # solution",
  "language": "python"
}
```

Returns:
```json
{
  "id": "submission-uuid",
  "status": "PASSED" | "FAILED" | "ERROR",
  "testsPassed": 8,
  "testsTotal": 10,
  "score": 80,
  "totalScore": 100,
  "executionTime": 145,
  "memoryUsage": 32
}
```

## Frontend Integration

### Authentication Storage

Store JWT token in localStorage or secure HTTP-only cookies:

```typescript
// Login
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});

const { user, token } = await response.json();
localStorage.setItem('authToken', token);
localStorage.setItem('user', JSON.stringify(user));
```

### Authenticated Requests

```typescript
const token = localStorage.getItem('authToken');

const response = await fetch('/api/admin/questions', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

## Workflow Examples

### Admin Workflow

1. **Login** as admin
2. **Create Questions** with test cases
3. **Create Session** and select questions
4. **Share Access Code** with participants
5. **Monitor Progress** and view submissions in real-time
6. **Review Results** after session ends

### Participant Workflow

1. **Register/Login** to platform
2. **Join Session** using access code
3. **View Questions** in the session
4. **Write & Test Code** in the editor
5. **Submit Solution** for evaluation
6. **View Results** and scores

## Security Features

- **Password Hashing**: bcrypt with salt rounds
- **JWT Authentication**: Secure token-based auth
- **Role-Based Access**: Admin/Participant separation
- **Input Validation**: express-validator on all inputs
- **SQL Injection Prevention**: Prisma ORM parameterized queries
- **Code Execution Sandboxing**: Docker container isolation

## Database Management

### View Data
```bash
cd backend
npx prisma studio
```

This opens a web interface at http://localhost:5555 to browse/edit data.

### Run Migrations
```bash
cd backend
npx prisma migrate dev --name <migration-name>
```

### Reset Database (Development Only!)
```bash
cd backend
npx prisma migrate reset
```

## Environment Variables

### Backend (.env)

```env
# Database
DATABASE_URL=postgresql://lightexec:lightexec_password@localhost:5432/lightexec_db

# JWT
JWT_SECRET=your-super-secret-key-change-this
JWT_EXPIRES_IN=7d

# Admin Defaults
ADMIN_EMAIL=admin@lightexec.com
ADMIN_PASSWORD=admin123

# Server
PORT=3001
NODE_ENV=development
```

## Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker-compose ps

# View PostgreSQL logs
docker-compose logs postgres

# Restart PostgreSQL
docker-compose restart postgres
```

### Migration Issues

```bash
# Check migration status
cd backend
npx prisma migrate status

# Reset and rerun migrations (dev only!)
npx prisma migrate reset
```

### Authentication Issues

- Verify JWT_SECRET is set in .env
- Check token expiration (default 7 days)
- Ensure Authorization header format: `Bearer <token>`

## Production Deployment

1. **Change All Secrets**:
   - Update JWT_SECRET
   - Change database credentials
   - Update admin password

2. **Use Environment Variables**:
   - Never commit .env files
   - Use secrets management (AWS Secrets Manager, etc.)

3. **Enable HTTPS**:
   - Use reverse proxy (nginx)
   - Enable SSL/TLS certificates

4. **Database Backups**:
   - Regular PostgreSQL backups
   - Test restore procedures

5. **Rate Limiting**:
   - Already configured for code execution
   - Consider adding for auth endpoints

## Future Enhancements

- Real-time leaderboard
- Code plagiarism detection
- Video proctoring integration
- Analytics dashboard
- Email notifications
- OAuth integration (Google, GitHub)
- Code review and comments
- Batch participant import
- Session templates

## Support

For issues or questions, please refer to the main README.md or create an issue in the repository.
