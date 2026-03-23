import 'dotenv/config';
import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pool from './config/database.js';
import { healthService } from './services/index.js';
import { errorHandler } from './middleware/error.middleware.js';
import authRoutes from './routes/auth.routes.js';
import chatRoutes from './routes/chat.routes.js';

const app: Application = express();
const PORT: number = parseInt(process.env.PORT || '3000', 10);

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.MOBILE_APP_URL || '*' }));
app.use(express.json());

// Health
app.get('/health', async (_req: Request, res: Response) => {
  const dbAlive = await healthService.checkDatabase();
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
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await pool.end();
  process.exit(0);
});

app.listen(PORT, async () => {
  const dbAlive = await healthService.checkDatabase();
  console.log(`🚀 ORION Backend running on port ${PORT}`);
  console.log(`🗄️  Database: ${dbAlive ? 'Connected ✅' : 'UNREACHABLE ❌'}`);
});
