import { Request, Response, NextFunction, Router } from 'express';

declare global {
  namespace Express {
    interface Request {
      validatedData?: any;
      user?: {
        userId: string;
        email: string;
        role?: string;
      };
      query: any;
      params: any;
      cookies: any;
      headers: any;
      files?: any;
    }

    namespace Multer {
      interface File {
        fieldname: string;
        originalname: string;
        encoding: string;
        mimetype: string;
        size: number;
        destination: string;
        filename: string;
        path: string;
        buffer: Buffer;
      }
    }
  }

  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
      PORT?: string;
      DATABASE_URL: string;
      JWT_SECRET: string;
      FRONTEND_URL: string;
      CLOUDINARY_CLOUD_NAME: string;
      CLOUDINARY_API_KEY: string;
      CLOUDINARY_API_SECRET: string;
      ACCESS_TOKEN_SECRET: string;
      ACCESS_TOKEN_EXPIRY: string;
      REFRESH_TOKEN_SECRET: string;
      REFRESH_TOKEN_EXPIRY: string;
      PAYPAL_CLIENT_ID: string;
      PAYPAL_CLIENT_SECRET: string;
      PAYPAL_MODE: string;
      STRIPE_SECRET_KEY: string;
      STRIPE_WEBHOOK_SECRET: string;
      SMTP_HOST: string;
      SMTP_PORT: string;
      SMTP_USER: string;
      SMTP_PASS: string;
      EMAIL_FROM: string;
      LOG_ENABLED: string;
      LOG_LEVEL: string;
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
}

// Don't re-export Express types here - they're already available from 'express'