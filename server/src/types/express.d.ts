// src/types/express.d.ts
import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      validatedData?: any;
      user?: {
        userId: string;
        email: string;
        role?: string;
      };
    }
  }
}

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role?: string;
  };
  validatedData?: any; 
  body: any;
}

export {};