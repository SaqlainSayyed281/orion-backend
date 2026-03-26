import 'dotenv/config';
import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pool from './config/database.js';
import { healthService } from './services/index.js';
import { errorHandler } from './middleware/error.middleware.js';
import authRoutes from './routes/auth.routes.js';
import chatRoutes from './routes/chat.routes.js';
import { logger } from './utils/logger.js';

const app: Application = express();
const PORT: number = parseInt(process.env.PORT || '3000', 10);

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.MOBILE_APP_URL || '*' }));
app.use(express.json());

// Request logger — logs every inbound request
app.use((req: Request, _res: Response, next) => {
  logger.info('HTTP', `${req.method} ${req.url}`, {
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  });
  next();
});

// Health
app.get('/health', async (_req: Request, res: Response) => {
  const dbAlive = await healthService.checkDatabase();
  logger.info('Health', 'Health check requested', { database: dbAlive ? 'connected' : 'unreachable' });
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: dbAlive ? 'connected' : 'unreachable',
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);

// Global error handler — must be last
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('Server', 'SIGTERM received — shutting down gracefully');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('Server', 'SIGINT received — shutting down gracefully');
  await pool.end();
  process.exit(0);
});

app.listen(PORT, async () => {
  const dbAlive = await healthService.checkDatabase();
  logger.info('Server', `ORION Backend started`, { port: PORT, database: dbAlive ? 'connected' : 'UNREACHABLE' });
  if (!dbAlive) {
    logger.error('Server', 'Database is unreachable on startup — check DATABASE_URL');
  }
});
