import { Response, NextFunction } from 'express';
import { authService } from '../services/index.js';
import { AuthRequest } from '../types/auth.types.js';
import { logger } from '../utils/logger.js';

const CTX = 'AuthMiddleware';

export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];

  if (!token) {
    logger.warn(CTX, 'Request rejected — no token provided', { path: req.path, method: req.method });
    res.status(401).json({ error: 'Access token required' });
    return;
  }

  try {
    req.user = authService.verifyToken(token);
    logger.debug(CTX, 'Token verified', { userId: req.user.userId });
    next();
  } catch (err: any) {
    logger.warn(CTX, 'Token verification failed', { path: req.path, error: err.message });
    res.status(403).json({ error: 'Invalid or expired token' });
  }
};
