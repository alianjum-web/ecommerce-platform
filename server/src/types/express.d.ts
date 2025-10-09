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
      // ✅ ADD THESE MISSING PROPERTIES
      query: any;
      params: any;
      cookies: any;
      headers: any;
      files?: any;
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
  // ✅ ENSURE THESE ARE INCLUDED
  body: any;
  query: any;
  params: any;
  cookies: any;
  headers: any;
  files?: any;
}

export {};