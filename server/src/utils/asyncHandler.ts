import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

// ✅ Fixed asyncHandler with proper typing
const asyncHandler = <T = any>(
    fn: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<T> | T
) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req as AuthenticatedRequest, res, next)).catch(next);
    };
};

export { asyncHandler };