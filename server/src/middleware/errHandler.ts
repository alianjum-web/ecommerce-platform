// middleware/errorHandler.ts
import { createLogger } from '../utils/logger';
import { ApiError, ValidationError, InternalServerError, NotFoundError } from '../utils/ApiError';
import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from '../types/express';

const errorLogger = createLogger('ERROR_HANDLER');

export const errorHandler = (
  error: any,
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  // ✅ LOG WITH STRUCTURED CONTEXT
  errorLogger.error(error, {
    path: req.path,
    method: req.method,
    userId: (req as any).user?.userId,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    body: process.env.NODE_ENV === 'development' ? req.body : undefined, // Only in dev
    query: process.env.NODE_ENV === 'development' ? req.query : undefined,
  });

  let processedError = error;

  // ✅ HANDLE SPECIFIC ERROR TYPES
  if (error.name === 'ValidationError') {
    processedError = new ValidationError('Input validation failed');
  } else if (error.name === 'CastError') {
    processedError = new NotFoundError('Resource not found');
  } else if (error.code === 'LIMIT_FILE_SIZE') {
    processedError = new ValidationError('File too large');
  } 
  // ✅ HANDLE PRISMA ERRORS
  else if (error.code && error.code.startsWith('P')) {
    errorLogger.warn('Database operation failed', { prismaCode: error.code });
    
    switch (error.code) {
      case 'P2002':
        processedError = new ValidationError('Duplicate field value');
        break;
      case 'P2025':
        processedError = new NotFoundError('Record not found');
        break;
      default:
        processedError = new ApiError(400, 'Database operation failed');
    }
  }
  // ✅ ENSURE IT'S AN ApiError
  else if (!(error instanceof ApiError)) {
    processedError = new InternalServerError(
      process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    );
  }

  // ✅ SEND RESPONSE
  res.status(processedError.statusCode).json({
    success: false,
    message: processedError.message,
    errors: processedError.errors,
    ...(process.env.NODE_ENV === 'development' && {
      stack: processedError.stack,
      originalError: error.message
    })
  });
};