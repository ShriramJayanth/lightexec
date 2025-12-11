import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { rateLimiter } from './middleware/rateLimiter';
import { setupWebSocket } from './services/WebSocketService';
import { logger } from './utils/logger';

dotenv.config();

const app: Application = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(requestLogger(logger));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API Routes - Import routes after logger is initialized
import { router as executeRouter } from './routes/execute';
import { router as languagesRouter } from './routes/languages';
import { router as statsRouter } from './routes/stats';
import { ContainerOrchestrator } from './services/ContainerOrchestrator';

app.use('/api/execute', rateLimiter, executeRouter);
app.use('/api/languages', languagesRouter);
app.use('/api/stats', statsRouter);

// WebSocket Setup
setupWebSocket(wss, logger);

// Error Handler (must be last)
app.use(errorHandler(logger));

// Initialize Container Orchestrator
const orchestrator = ContainerOrchestrator.getInstance();
orchestrator.initialize().catch((err) => {
  logger.error('Failed to initialize orchestrator:', err);
});

// Graceful Shutdown
const shutdown = async () => {
  logger.info('Shutting down gracefully...');
  
  server.close(() => {
    logger.info('HTTP server closed');
  });

  await orchestrator.cleanup();
  
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start Server
server.listen(PORT, async () => {
  logger.info(`🚀 LightExec Backend running on port ${PORT}`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Initialize pre-warmed container pools
  try {
    await orchestrator.initialize();
    logger.info('✅ Container orchestrator initialized');
  } catch (error: any) {
    logger.warn('⚠️  Container orchestrator failed to initialize');
    logger.warn('⚠️  Code execution will not work until Docker is properly configured');
    logger.warn('⚠️  Run: ./scripts/setup-docker.sh to set up Docker');
  }
});

export { app };
