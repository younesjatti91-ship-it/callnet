import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction): void {
  logger.error('Unhandled API Exception', {
    method: req.method,
    path: req.path,
    error: err.message,
    stack: err.stack,
  });

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: statusCode === 500 && process.env.NODE_ENV === 'production' ? 'Internal server error occurred' : message,
      details: err.details,
    },
  });
}
