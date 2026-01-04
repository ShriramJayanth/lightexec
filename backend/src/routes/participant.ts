import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import { prisma } from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';

export const router = Router();

// Join session with access code (no auth required)
router.post(
  '/sessions/join',
  [body('accessCode').notEmpty().withMessage('Access code is required')],
  authenticate,
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { accessCode } = req.body;

      const session = await prisma.session.findUnique({
        where: { accessCode },
      });

      if (!session) {
        return res.status(404).json({ error: 'Invalid access code' });
      }

      if (!session.isActive) {
        return res.status(400).json({ error: 'Session is not active' });
      }

      const now = new Date();
      if (now < session.startTime) {
        return res.status(400).json({ error: 'Session has not started yet' });
      }

      if (now > session.endTime) {
        return res.status(400).json({ error: 'Session has ended' });
      }

      // Add participant to session
      await prisma.participantSession.upsert({
        where: {
          userId_sessionId: {
            userId: req.user!.userId,
            sessionId: session.id,
          },
        },
        create: {
          userId: req.user!.userId,
          sessionId: session.id,
        },
        update: {},
      });

      // Fetch questions separately
      const questions = await prisma.question.findMany({
        where: {
          id: { in: session.questionIds },
        },
        include: {
          testCases: { where: { isHidden: false } },
        },
      });

      res.json({ ...session, questions });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Get my sessions
router.get('/sessions', authenticate, async (req: AuthRequest, res) => {
  try {
    const participantSessions = await prisma.participantSession.findMany({
      where: { userId: req.user!.userId },
      include: {
        session: true,
      },
      orderBy: { joinedAt: 'desc' },
    });

    // Fetch questions for each session
    const sessionsWithQuestions = await Promise.all(
      participantSessions.map(async (ps) => {
        const questions = await prisma.question.findMany({
          where: {
            id: { in: ps.session.questionIds },
          },
          select: {
            id: true,
            title: true,
            difficulty: true,
          },
        });
        return { ...ps.session, questions };
      })
    );

    res.json(sessionsWithQuestions);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get session questions
router.get('/sessions/:id/questions', authenticate, async (req: AuthRequest, res) => {
  try {
    // Verify participant is in session
    const participation = await prisma.participantSession.findUnique({
      where: {
        userId_sessionId: {
          userId: req.user!.userId,
          sessionId: req.params.id,
        },
      },
    });

    if (!participation) {
      return res.status(403).json({ error: 'Not enrolled in this session' });
    }

    const session = await prisma.session.findUnique({
      where: { id: req.params.id },
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const questions = await prisma.question.findMany({
      where: {
        id: { in: session.questionIds },
      },
      include: {
        testCases: { where: { isHidden: false } },
      },
    });

    // Get user's submissions for these questions
    const submissions = await prisma.submission.findMany({
      where: {
        userId: req.user!.userId,
        sessionId: req.params.id,
        questionId: { in: session.questionIds },
        status: 'PASSED',
      },
      select: {
        questionId: true,
        status: true,
        score: true,
        totalScore: true,
      },
    });

    // Add submission status to each question
    const questionsWithStatus = questions.map(q => ({
      ...q,
      isCompleted: submissions.some(s => s.questionId === q.id && s.status === 'PASSED'),
      bestScore: submissions.find(s => s.questionId === q.id)?.score || 0,
    }));

    res.json(questionsWithStatus);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get single question
router.get(
  '/sessions/:sessionId/questions/:questionId',
  authenticate,
  async (req: AuthRequest, res) => {
    try {
      // Verify participant is in session
      const participation = await prisma.participantSession.findUnique({
        where: {
          userId_sessionId: {
            userId: req.user!.userId,
            sessionId: req.params.sessionId,
          },
        },
      });

      if (!participation) {
        return res.status(403).json({ error: 'Not enrolled in this session' });
      }

      const question = await prisma.question.findUnique({
        where: { id: req.params.questionId },
        include: {
          testCases: { where: { isHidden: false } },
        },
      });

      if (!question) {
        return res.status(404).json({ error: 'Question not found' });
      }

      // Get user's previous submissions for this question
      const submissions = await prisma.submission.findMany({
        where: {
          userId: req.user!.userId,
          questionId: req.params.questionId,
          sessionId: req.params.sessionId,
        },
        orderBy: { submittedAt: 'desc' },
        take: 10,
      });

      res.json({ ...question, previousSubmissions: submissions });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Submit solution
router.post(
  '/sessions/:sessionId/questions/:questionId/submit',
  [
    body('code').notEmpty().withMessage('Code is required'),
    body('language').notEmpty().withMessage('Language is required'),
  ],
  authenticate,
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Verify participant is in session
      const participation = await prisma.participantSession.findUnique({
        where: {
          userId_sessionId: {
            userId: req.user!.userId,
            sessionId: req.params.sessionId,
          },
        },
      });

      if (!participation) {
        return res.status(403).json({ error: 'Not enrolled in this session' });
      }

      const question = await prisma.question.findUnique({
        where: { id: req.params.questionId },
        include: { testCases: true },
      });

      if (!question) {
        return res.status(404).json({ error: 'Question not found' });
      }

      const { code, language } = req.body;

      // Import the execution service
      const { executeCode } = await import('../services/ContainerOrchestrator');

      // Run code against all test cases
      let testsPassed = 0;
      let score = 0;
      const totalTests = question.testCases.length;
      const totalScore = question.testCases.reduce((sum, tc) => sum + tc.points, 0);
      let executionTime = 0;
      let memoryUsage = 0;
      let lastOutput = '';
      let lastError = '';

      for (const testCase of question.testCases) {
        try {
          const result = await executeCode({
            code,
            language,
            stdin: testCase.input,
            timeout: question.timeLimit,
            memoryLimit: question.memoryLimit,
          });

          executionTime += result.executionTime || 0;
          memoryUsage = Math.max(memoryUsage, result.memoryUsed || 0);
          lastOutput = result.stdout || '';

          if (result.stdout?.trim() === testCase.output.trim() && result.exitCode === 0) {
            testsPassed++;
            score += testCase.points;
          } else {
            lastError = result.error || `Expected: ${testCase.output}, Got: ${result.stdout}`;
          }
        } catch (error: any) {
          lastError = error.message;
        }
      }

      const status =
        testsPassed === totalTests
          ? 'PASSED'
          : testsPassed > 0
          ? 'FAILED'
          : 'ERROR';

      const submission = await prisma.submission.create({
        data: {
          code,
          language,
          status,
          executionTime,
          memoryUsage,
          score,
          totalScore,
          testsPassed,
          testsTotal: totalTests,
          output: lastOutput,
          error: lastError,
          userId: req.user!.userId,
          questionId: req.params.questionId,
          sessionId: req.params.sessionId,
        },
      });

      res.json(submission);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Get my submissions for a question
router.get(
  '/sessions/:sessionId/questions/:questionId/submissions',
  authenticate,
  async (req: AuthRequest, res) => {
    try {
      const submissions = await prisma.submission.findMany({
        where: {
          userId: req.user!.userId,
          questionId: req.params.questionId,
          sessionId: req.params.sessionId,
        },
        orderBy: { submittedAt: 'desc' },
      });

      res.json(submissions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);
