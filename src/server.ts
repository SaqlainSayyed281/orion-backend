import 'dotenv/config';
import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';

const app: Application = express();
const PORT: number = parseInt(process.env.PORT || '3000', 10);

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes (will be added)
// app.use('/api/auth', require('./routes/auth'));
// app.use('/api/chat', require('./routes/chat'));

// Error handling
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    error: err.message || 'Internal server error'
  });
});

app.listen(PORT, () => {
  console.log(`ORION Backend running on port ${PORT}`);
});
