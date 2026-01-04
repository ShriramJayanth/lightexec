import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import { prisma } from '../config/database';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

export const router = Router();

// All routes require admin authentication
router.use(authenticate);
router.use(requireAdmin);

// Create Question
router.post(
  '/questions',
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('languageId').notEmpty().withMessage('Language is required'),
    body('difficulty').isIn(['easy', 'medium', 'hard']).withMessage('Invalid difficulty'),
    body('timeLimit').isInt({ min: 1000 }).optional(),
    body('memoryLimit').isInt({ min: 64 }).optional(),
    body('starterCode').optional(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const question = await prisma.question.create({
        data: {
          ...req.body,
          creatorId: req.user!.userId,
        },
        include: {
          testCases: true,
        },
      });

      res.status(201).json(question);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Get all questions
router.get('/questions', async (req: AuthRequest, res) => {
  try {
    const questions = await prisma.question.findMany({
      where: { creatorId: req.user!.userId },
      include: {
        testCases: true,
        _count: {
          select: { submissions: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(questions);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get single question
router.get('/questions/:id', param('id').isUUID(), async (req: AuthRequest, res) => {
  try {
    const question = await prisma.question.findFirst({
      where: {
        id: req.params.id,
        creatorId: req.user!.userId,
      },
      include: {
        testCases: true,
      },
    });

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    res.json(question);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update Question
router.put(
  '/questions/:id',
  [
    param('id').isUUID(),
    body('title').optional(),
    body('description').optional(),
    body('difficulty').isIn(['easy', 'medium', 'hard']).optional(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const question = await prisma.question.updateMany({
        where: {
          id: req.params.id,
          creatorId: req.user!.userId,
        },
        data: req.body,
      });

      if (question.count === 0) {
        return res.status(404).json({ error: 'Question not found' });
      }

      const updated = await prisma.question.findUnique({
        where: { id: req.params.id },
        include: { testCases: true },
      });

      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Delete Question
router.delete('/questions/:id', param('id').isUUID(), async (req: AuthRequest, res) => {
  try {
    const result = await prisma.question.deleteMany({
      where: {
        id: req.params.id,
        creatorId: req.user!.userId,
      },
    });

    if (result.count === 0) {
      return res.status(404).json({ error: 'Question not found' });
    }

    res.json({ message: 'Question deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Add Test Case
router.post(
  '/questions/:id/testcases',
  [
    param('id').isUUID(),
    body('input').isString(),
    body('output').isString(),
    body('isHidden').isBoolean().optional(),
    body('points').isInt({ min: 1 }).optional(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Verify question ownership
      const question = await prisma.question.findFirst({
        where: {
          id: req.params.id,
          creatorId: req.user!.userId,
        },
      });

      if (!question) {
        return res.status(404).json({ error: 'Question not found' });
      }

      const testCase = await prisma.testCase.create({
        data: {
          ...req.body,
          questionId: req.params.id,
        },
      });

      res.status(201).json(testCase);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Update Test Case
router.put(
  '/testcases/:id',
  [param('id').isUUID()],
  async (req: AuthRequest, res) => {
    try {
      const testCase = await prisma.testCase.findUnique({
        where: { id: req.params.id },
        include: { question: true },
      });

      if (!testCase || testCase.question.creatorId !== req.user!.userId) {
        return res.status(404).json({ error: 'Test case not found' });
      }

      const updated = await prisma.testCase.update({
        where: { id: req.params.id },
        data: req.body,
      });

      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Delete Test Case
router.delete('/testcases/:id', param('id').isUUID(), async (req: AuthRequest, res) => {
  try {
    const testCase = await prisma.testCase.findUnique({
      where: { id: req.params.id },
      include: { question: true },
    });

    if (!testCase || testCase.question.creatorId !== req.user!.userId) {
      return res.status(404).json({ error: 'Test case not found' });
    }

    await prisma.testCase.delete({ where: { id: req.params.id } });
    res.json({ message: 'Test case deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create Session
router.post(
  '/sessions',
  [
    body('name').notEmpty().withMessage('Session name is required'),
    body('description').optional(),
    body('startTime').isISO8601().withMessage('Valid start time is required'),
    body('endTime').isISO8601().withMessage('Valid end time is required'),
    body('questionIds').isArray({ min: 1 }).withMessage('At least one question is required'),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, description, startTime, endTime, questionIds } = req.body;

      // Generate unique access code
      const accessCode = uuidv4().split('-')[0].toUpperCase();

      const session = await prisma.session.create({
        data: {
          name,
          description,
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          accessCode,
          questionIds,
          creatorId: req.user!.userId,
        },
      });

      res.status(201).json(session);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Get all sessions
router.get('/sessions', async (req: AuthRequest, res) => {
  try {
    const sessions = await prisma.session.findMany({
      where: { creatorId: req.user!.userId },
      include: {
        _count: {
          select: { participants: true, submissions: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(sessions);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update session
router.put(
  '/sessions/:id',
  [
    param('id').isUUID(),
    body('name').notEmpty().withMessage('Session name is required'),
    body('description').optional(),
    body('startTime').isISO8601().withMessage('Valid start time is required'),
    body('endTime').isISO8601().withMessage('Valid end time is required'),
    body('questionIds').isArray({ min: 1 }).withMessage('At least one question is required'),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, description, startTime, endTime, questionIds } = req.body;

      // Verify session ownership
      const existingSession = await prisma.session.findFirst({
        where: {
          id: req.params.id,
          creatorId: req.user!.userId,
        },
      });

      if (!existingSession) {
        return res.status(404).json({ error: 'Session not found' });
      }

      const session = await prisma.session.update({
        where: { id: req.params.id },
        data: {
          name,
          description,
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          questionIds,
        },
      });

      res.json(session);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Get single session with details
router.get('/sessions/:id', param('id').isUUID(), async (req: AuthRequest, res) => {
  try {
    const session = await prisma.session.findFirst({
      where: {
        id: req.params.id,
        creatorId: req.user!.userId,
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        },
        submissions: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            question: {
              select: {
                id: true,
                title: true,
              },
            },
          },
          orderBy: { submittedAt: 'desc' },
        },
      },
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Fetch questions separately using questionIds
    const questions = await prisma.question.findMany({
      where: {
        id: { in: session.questionIds },
      },
      include: {
        testCases: true,
      },
    });

    res.json({ ...session, questions });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update Session
router.put(
  '/sessions/:id',
  [
    param('id').isUUID(),
    body('name').notEmpty().withMessage('Session name is required'),
    body('description').optional(),
    body('startTime').isISO8601().withMessage('Valid start time is required'),
    body('endTime').isISO8601().withMessage('Valid end time is required'),
    body('questionIds').isArray({ min: 1 }).withMessage('At least one question is required'),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, description, startTime, endTime, questionIds } = req.body;

      // Verify session ownership
      const existingSession = await prisma.session.findFirst({
        where: {
          id: req.params.id,
          creatorId: req.user!.userId,
        },
      });

      if (!existingSession) {
        return res.status(404).json({ error: 'Session not found' });
      }

      const updated = await prisma.session.update({
        where: { id: req.params.id },
        data: {
          name,
          description,
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          questionIds,
        },
      });

      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Delete Session
router.delete('/sessions/:id', param('id').isUUID(), async (req: AuthRequest, res) => {
  try {
    const result = await prisma.session.deleteMany({
      where: {
        id: req.params.id,
        creatorId: req.user!.userId,
      },
    });

    if (result.count === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({ message: 'Session deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get session participants with their progress
router.get('/sessions/:id/participants', param('id').isUUID(), async (req: AuthRequest, res) => {
  try {
    const session = await prisma.session.findFirst({
      where: {
        id: req.params.id,
        creatorId: req.user!.userId,
      },
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Get all participants in this session
    const participants = await prisma.participantSession.findMany({
      where: { sessionId: req.params.id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    // Get submissions for all participants
    const participantStatus = await Promise.all(
      participants.map(async (participant) => {
        const submissions = await prisma.submission.findMany({
          where: {
            userId: participant.userId,
            sessionId: req.params.id,
          },
          orderBy: { submittedAt: 'desc' },
        });

        // Group submissions by question
        const questionStats = session.questionIds.map(questionId => {
          const questionSubmissions = submissions.filter(s => s.questionId === questionId);
          const bestSubmission = questionSubmissions.find(s => s.status === 'PASSED') || 
                                questionSubmissions[0];
          
          // Find first accepted submission (sort by submittedAt ascending to get earliest)
          const firstAccepted = questionSubmissions
            .filter(s => s.status === 'PASSED')
            .sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime())[0];
          
          return {
            questionId,
            status: bestSubmission?.status || 'NOT_ATTEMPTED',
            score: bestSubmission?.score || 0,
            totalScore: bestSubmission?.totalScore || 0,
            attempts: questionSubmissions.length,
            lastAttempt: bestSubmission?.submittedAt || null,
            firstAcceptedAt: firstAccepted?.submittedAt || null,
          };
        });

        const totalQuestions = session.questionIds.length;
        const completedQuestions = questionStats.filter(q => q.status === 'PASSED').length;
        const totalScore = questionStats.reduce((sum, q) => sum + q.score, 0);
        const maxScore = questionStats.reduce((sum, q) => sum + q.totalScore, 0);

        // Calculate earliest completion time (first accepted submission across all questions)
        const completionTimes = questionStats
          .filter(q => q.firstAcceptedAt)
          .map(q => new Date(q.firstAcceptedAt!).getTime());
        const earliestCompletion = completionTimes.length > 0 ? Math.min(...completionTimes) : null;

        return {
          user: participant.user,
          joinedAt: participant.joinedAt,
          progress: {
            completed: completedQuestions,
            total: totalQuestions,
            percentage: totalQuestions > 0 ? Math.round((completedQuestions / totalQuestions) * 100) : 0,
          },
          score: {
            achieved: totalScore,
            maximum: maxScore,
            percentage: maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0,
          },
          questions: questionStats,
          totalAttempts: submissions.length,
          earliestCompletion,
        };
      })
    );

    // Sort by ranking: most completed first, then by earliest completion time
    participantStatus.sort((a, b) => {
      // First, sort by number of completed questions (descending)
      if (b.progress.completed !== a.progress.completed) {
        return b.progress.completed - a.progress.completed;
      }
      
      // If tied on completed questions, sort by earliest completion time (ascending)
      if (a.earliestCompletion && b.earliestCompletion) {
        return a.earliestCompletion - b.earliestCompletion;
      }
      
      // If one has completion time and other doesn't, prioritize the one with completion
      if (a.earliestCompletion && !b.earliestCompletion) return -1;
      if (!a.earliestCompletion && b.earliestCompletion) return 1;
      
      // If neither has completion time, sort by score
      return b.score.achieved - a.score.achieved;
    });

    res.json(participantStatus);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
