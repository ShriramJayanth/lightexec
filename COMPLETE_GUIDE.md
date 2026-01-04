# 🎓 LightExec - Complete System Guide

## 📖 Table of Contents
1. [System Overview](#system-overview)
2. [User Roles](#user-roles)
3. [Complete Workflow](#complete-workflow)
4. [API Reference](#api-reference)
5. [Database Schema](#database-schema)

## System Overview

LightExec is now a complete online coding assessment platform with three main components:

### 1. **Code Playground** (Original Feature)
- Real-time code editor with Monaco
- Support for 15+ programming languages
- Instant code execution in isolated containers
- Live statistics and monitoring

### 2. **Admin Portal** (NEW)
- Create and manage coding questions
- Add test cases for automatic validation
- Create timed coding sessions
- Generate unique access codes
- Monitor participant progress
- View submissions and scores

### 3. **Participant Portal** (NEW)
- Join sessions via access codes
- View assigned problems
- Submit solutions for grading
- Track scores and performance
- View submission history

## User Roles

### 👨‍💼 Admin
**Capabilities:**
- Create/edit/delete questions
- Manage test cases (visible & hidden)
- Create timed sessions
- Share access codes
- View all submissions
- Monitor real-time progress

**Use Cases:**
- Technical recruiters
- Coding bootcamp instructors
- Online course creators
- Interview coordinators

### 👨‍💻 Participant
**Capabilities:**
- Join multiple sessions
- View assigned questions
- Write and test code
- Submit solutions
- View instant feedback
- Track personal progress

**Use Cases:**
- Job candidates
- Students
- Coding challenge participants
- Self-learners

## Complete Workflow

### 📋 Admin Workflow

```
1. Login as Admin
   └─> http://localhost:3000/login
       Email: admin@lightexec.com
       Password: admin123

2. Create Questions
   ├─> Click "New Question"
   ├─> Fill Details:
   │   ├─> Title: "Two Sum Problem"
   │   ├─> Description: Full problem statement
   │   ├─> Difficulty: easy/medium/hard
   │   ├─> Language: python/javascript/java/etc
   │   ├─> Time Limit: 5000ms (default)
   │   └─> Memory Limit: 256MB (default)
   │
   └─> Add Test Cases:
       ├─> Test Case 1:
       │   ├─> Input: "2 3\n5"
       │   ├─> Expected Output: "5"
       │   ├─> Points: 10
       │   └─> Hidden: false (visible to participants)
       │
       └─> Test Case 2:
           ├─> Input: "10 20\n30"
           ├─> Expected Output: "30"
           ├─> Points: 10
           └─> Hidden: true (secret test)

3. Create Session
   ├─> Click "New Session"
   ├─> Fill Details:
   │   ├─> Name: "Technical Interview - Backend"
   │   ├─> Description: "90-minute coding assessment"
   │   ├─> Start Time: 2026-01-15 10:00 AM
   │   ├─> End Time: 2026-01-15 11:30 AM
   │   └─> Questions: Select 3-5 questions
   │
   └─> Get Access Code:
       └─> "AB12CD34" (share this with participants)

4. Share Access Code
   └─> Send code via:
       ├─> Email
       ├─> Slack/Teams
       ├─> Interview calendar
       └─> Or any communication channel

5. Monitor Progress (Real-time)
   ├─> View participants who joined
   ├─> See active submissions
   ├─> Check scores as they come in
   └─> Identify struggling participants

6. Review Results
   ├─> After session ends
   ├─> View detailed submissions
   ├─> Check code quality
   ├─> Compare performance
   └─> Export results (coming soon)
```

### 👥 Participant Workflow

```
1. Register/Login
   └─> http://localhost:3000/register
       ├─> Create account (one-time)
       └─> Or login with existing credentials

2. Join Session
   ├─> Click "Join Session"
   ├─> Enter Access Code: "AB12CD34"
   └─> Confirm to join

3. View Questions
   ├─> See list of all questions in session
   ├─> View difficulty levels
   └─> Check time remaining

4. Select & Solve Problem
   ├─> Click on a question
   ├─> Read problem statement
   ├─> View test cases (non-hidden)
   ├─> See input/output examples
   └─> Check time & memory limits

5. Write Solution
   ├─> Use code editor (Monaco)
   ├─> Choose language
   ├─> Write code
   └─> Test locally (optional)

6. Submit Solution
   ├─> Click "Submit"
   ├─> Code runs against ALL test cases
   ├─> Wait for results (2-5 seconds)
   └─> View feedback:
       ├─> Tests Passed: 8/10
       ├─> Score: 80/100
       ├─> Execution Time: 145ms
       ├─> Memory Used: 32MB
       └─> Errors (if any)

7. Iterate & Improve
   ├─> View which tests failed
   ├─> Modify code
   ├─> Resubmit
   └─> Try to achieve 100% score

8. View History
   └─> See all previous submissions
       ├─> Best score
       ├─> Attempts made
       └─> Time spent
```

## API Reference

### Quick API Examples

#### 1. Register User
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "secure123",
    "name": "John Doe"
  }'
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "john@example.com",
    "name": "John Doe",
    "role": "PARTICIPANT"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### 2. Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@lightexec.com",
    "password": "admin123"
  }'
```

#### 3. Create Question (Admin)
```bash
TOKEN="your-jwt-token"

curl -X POST http://localhost:3001/api/admin/questions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Two Sum",
    "description": "Find two numbers that add up to target",
    "difficulty": "easy",
    "languageId": "python",
    "starterCode": "def two_sum(nums, target):\n    pass",
    "timeLimit": 5000,
    "memoryLimit": 256
  }'
```

#### 4. Add Test Case (Admin)
```bash
curl -X POST http://localhost:3001/api/admin/questions/{questionId}/testcases \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "input": "2 3\n5",
    "output": "5",
    "isHidden": false,
    "points": 10
  }'
```

#### 5. Create Session (Admin)
```bash
curl -X POST http://localhost:3001/api/admin/sessions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Interview Round 1",
    "description": "Backend developer assessment",
    "startTime": "2026-01-15T10:00:00Z",
    "endTime": "2026-01-15T12:00:00Z",
    "questionIds": ["question-id-1", "question-id-2"]
  }'
```

#### 6. Join Session (Participant)
```bash
curl -X POST http://localhost:3001/api/participant/sessions/join \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "accessCode": "AB12CD34"
  }'
```

#### 7. Submit Solution (Participant)
```bash
curl -X POST http://localhost:3001/api/participant/sessions/{sessionId}/questions/{questionId}/submit \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "def two_sum(nums, target):\n    # solution here",
    "language": "python"
  }'
```

## Database Schema

### Entity Relationship Diagram

```
┌──────────────┐
│    User      │
├──────────────┤
│ id (PK)      │
│ email        │
│ password     │
│ name         │
│ role         │ ──> ADMIN / PARTICIPANT
│ createdAt    │
└──────┬───────┘
       │
       │ 1:N (created by)
       │
┌──────┴───────────┐
│    Question      │
├──────────────────┤
│ id (PK)          │
│ title            │
│ description      │
│ difficulty       │ ──> easy / medium / hard
│ languageId       │
│ starterCode      │
│ timeLimit        │
│ memoryLimit      │
│ creatorId (FK)   │
└──────┬───────────┘
       │
       │ 1:N
       │
┌──────┴───────────┐
│   TestCase       │
├──────────────────┤
│ id (PK)          │
│ input            │
│ output           │
│ isHidden         │ ──> true / false
│ points           │
│ questionId (FK)  │
└──────────────────┘

┌──────────────┐
│   Session    │
├──────────────┤
│ id (PK)      │
│ name         │
│ description  │
│ startTime    │
│ endTime      │
│ accessCode   │ ──> Unique code for joining
│ isActive     │
│ questionIds  │ ──> Array of question IDs
│ creatorId(FK)│
└──────┬───────┘
       │
       │ M:N (via ParticipantSession)
       │
┌──────┴────────────────┐
│ ParticipantSession    │
├───────────────────────┤
│ id (PK)               │
│ userId (FK)           │
│ sessionId (FK)        │
│ joinedAt              │
└───────────────────────┘
       │
       │ 1:N
       │
┌──────┴───────────┐
│   Submission     │
├──────────────────┤
│ id (PK)          │
│ code             │
│ language         │
│ status           │ ──> PENDING / PASSED / FAILED / ERROR
│ executionTime    │
│ memoryUsage      │
│ score            │
│ totalScore       │
│ testsPassed      │
│ testsTotal       │
│ output           │
│ error            │
│ userId (FK)      │
│ questionId (FK)  │
│ sessionId (FK)   │
│ submittedAt      │
└──────────────────┘
```

### Key Relationships

1. **User → Questions**: Admin creates many questions
2. **Question → TestCases**: Question has many test cases
3. **User → Sessions**: Admin creates many sessions
4. **Session ↔ Users**: Many-to-many via ParticipantSession
5. **User → Submissions**: Participant makes many submissions
6. **Question → Submissions**: Question receives many submissions

## Sample Data Flow

### Question Creation Flow
```
Admin creates question
    ↓
Question saved in DB
    ↓
Admin adds test cases
    ↓
Test cases linked to question
    ↓
Question ready for use in sessions
```

### Submission Flow
```
Participant writes code
    ↓
Submits solution
    ↓
Backend receives code
    ↓
Code runs in Docker container
    ↓
Execute against test case 1
    ↓
Execute against test case 2
    ↓
... (all test cases)
    ↓
Calculate score
    ↓
Save submission to DB
    ↓
Return results to participant
```

## Environment Configuration

### Backend (.env)
```env
# Server
PORT=3001
NODE_ENV=development

# Database
DATABASE_URL=postgresql://lightexec:lightexec_password@localhost:5432/lightexec_db

# JWT
JWT_SECRET=change-this-secret-key
JWT_EXPIRES_IN=7d

# Admin
ADMIN_EMAIL=admin@lightexec.com
ADMIN_PASSWORD=admin123

# Docker
DOCKER_SOCKET_PATH=/var/run/docker.sock
```

## Production Checklist

Before deploying to production:

- [ ] Change JWT_SECRET
- [ ] Update database credentials
- [ ] Change admin password
- [ ] Enable HTTPS/SSL
- [ ] Set up database backups
- [ ] Configure monitoring
- [ ] Add rate limiting for auth
- [ ] Set up logging infrastructure
- [ ] Configure email notifications
- [ ] Add CORS restrictions
- [ ] Enable security headers
- [ ] Set up CDN for frontend

## Performance Tips

1. **Database Indexing**: Already configured on frequently queried fields
2. **Container Pooling**: Pre-warmed containers for faster execution
3. **Caching**: Consider Redis for session data
4. **Load Balancing**: Use nginx for production
5. **CDN**: Serve static assets via CDN

## Security Best Practices

1. **Authentication**: JWT with secure secrets
2. **Password Storage**: Bcrypt hashing
3. **SQL Injection**: Protected by Prisma ORM
4. **Code Execution**: Isolated Docker containers
5. **Rate Limiting**: Applied on execution endpoints
6. **Input Validation**: express-validator on all inputs
7. **Role-Based Access**: Admin/Participant separation

## Support & Resources

- **Setup Guide**: [QUICKSTART_ADMIN.md](./QUICKSTART_ADMIN.md)
- **Full Documentation**: [ADMIN_SYSTEM.md](./ADMIN_SYSTEM.md)
- **Implementation Details**: [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)
- **Original Features**: [README.md](./README.md)

---

**LightExec** - Secure, scalable online code execution platform
Built with ❤️ using TypeScript, Next.js, Express, PostgreSQL, and Docker
