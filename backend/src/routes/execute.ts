import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { ContainerOrchestrator } from '../services/ContainerOrchestrator';
import { SUPPORTED_LANGUAGES } from '../config/constants';

export const router = Router();
const orchestrator = ContainerOrchestrator.getInstance();

router.post(
  '/',
  [
    body('code').isString().trim().isLength({ min: 1, max: 102400 }),
    body('language').isString().isIn(Object.keys(SUPPORTED_LANGUAGES)),
    body('stdin').optional().isString(),
    body('timeout').optional().isInt({ min: 1000, max: 30000 }),
    body('memoryLimit').optional().isInt({ min: 64, max: 1024 }),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const result = await orchestrator.executeCode({
        code: req.body.code,
        language: req.body.language,
        stdin: req.body.stdin,
        timeout: req.body.timeout,
        memoryLimit: req.body.memoryLimit,
      });

      res.json(result);
    } catch (error: any) {
      res.status(500).json({
        error: 'Execution failed',
        message: error.message,
      });
    }
  }
);

export default router;
