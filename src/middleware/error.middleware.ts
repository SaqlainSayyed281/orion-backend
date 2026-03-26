import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

const CTX = 'ErrorHandler';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  logger.error(CTX, `Unhandled error: ${message}`, {
    statusCode,
    method: req.method,
    path: req.path,
    stack: err.stack,
  });

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
