import { Response, NextFunction } from 'express';
import { authService } from '../services/index.js';
import { AuthRequest } from '../types/auth.types.js';

export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return;
  }

  try {
    req.user = authService.verifyToken(token);
    next();
  } catch {
    res.status(403).json({ error: 'Invalid or expired token' });
  }
};
