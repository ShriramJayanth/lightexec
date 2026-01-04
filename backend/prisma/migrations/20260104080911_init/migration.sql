-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'PARTICIPANT');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('PENDING', 'PASSED', 'FAILED', 'ERROR');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'PARTICIPANT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL DEFAULT 'medium',
    "languageId" TEXT NOT NULL,
    "starterCode" TEXT,
    "timeLimit" INTEGER NOT NULL DEFAULT 5000,
    "memoryLimit" INTEGER NOT NULL DEFAULT 256,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "creatorId" TEXT NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestCase" (
    "id" TEXT NOT NULL,
    "input" TEXT NOT NULL,
    "output" TEXT NOT NULL,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "points" INTEGER NOT NULL DEFAULT 10,
    "questionId" TEXT NOT NULL,

    CONSTRAINT "TestCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "accessCode" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "creatorId" TEXT NOT NULL,
    "questionIds" TEXT[],

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParticipantSession" (
    "id" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,

    CONSTRAINT "ParticipantSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Submission" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "executionTime" INTEGER,
    "memoryUsage" INTEGER,
    "score" INTEGER NOT NULL DEFAULT 0,
    "totalScore" INTEGER NOT NULL,
    "testsPassed" INTEGER NOT NULL DEFAULT 0,
    "testsTotal" INTEGER NOT NULL,
    "output" TEXT,
    "error" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "Question_creatorId_idx" ON "Question"("creatorId");

-- CreateIndex
CREATE INDEX "Question_languageId_idx" ON "Question"("languageId");

-- CreateIndex
CREATE INDEX "TestCase_questionId_idx" ON "TestCase"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_accessCode_key" ON "Session"("accessCode");

-- CreateIndex
CREATE INDEX "Session_creatorId_idx" ON "Session"("creatorId");

-- CreateIndex
CREATE INDEX "Session_accessCode_idx" ON "Session"("accessCode");

-- CreateIndex
CREATE INDEX "ParticipantSession_userId_idx" ON "ParticipantSession"("userId");

-- CreateIndex
CREATE INDEX "ParticipantSession_sessionId_idx" ON "ParticipantSession"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "ParticipantSession_userId_sessionId_key" ON "ParticipantSession"("userId", "sessionId");

-- CreateIndex
CREATE INDEX "Submission_userId_idx" ON "Submission"("userId");

-- CreateIndex
CREATE INDEX "Submission_questionId_idx" ON "Submission"("questionId");

-- CreateIndex
CREATE INDEX "Submission_sessionId_idx" ON "Submission"("sessionId");

-- CreateIndex
CREATE INDEX "Submission_submittedAt_idx" ON "Submission"("submittedAt");

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestCase" ADD CONSTRAINT "TestCase_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipantSession" ADD CONSTRAINT "ParticipantSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipantSession" ADD CONSTRAINT "ParticipantSession_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;
