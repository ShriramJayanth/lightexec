import { Router, Request, Response } from 'express';
import { ContainerOrchestrator } from '../services/ContainerOrchestrator';

export const router = Router();
const orchestrator = ContainerOrchestrator.getInstance();

router.get('/', (req: Request, res: Response) => {
  const stats = orchestrator.getStats();
  
  res.json({
    ...stats,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
  });
});

export default router;
