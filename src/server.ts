import 'dotenv/config';
import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import pool from './config/database.js';
import { healthService } from './services/index.js';

const app: Application = express();
const PORT: number = parseInt(process.env.PORT || '3000', 10);

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', async (_req: Request, res: Response) => {
  const dbAlive = await healthService.checkDatabase();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: dbAlive ? 'connected' : 'unreachable',
  });
});

// Routes (will be added)
// app.use('/api/auth', authRoutes);
// app.use('/api/chat', chatRoutes);

// Error handling
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status((err as any).status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Closing DB pool...');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received. Closing DB pool...');
  await pool.end();
  process.exit(0);
});

app.listen(PORT, async () => {
  const dbAlive = await healthService.checkDatabase();
  console.log(`🚀 ORION Backend running on port ${PORT}`);
  console.log(`🗄️  Database: ${dbAlive ? 'Connected ✅' : 'UNREACHABLE ❌'}`);
});
