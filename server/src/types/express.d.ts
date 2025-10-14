import { Request, Response, NextFunction, Router } from "express";

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

    interface Multer {
      File: any;
    }
  }

  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: "development" | "production" | "test";
      PORT?: string;
      DATABASE_URL: string;
      JWT_SECRET: string;

      FRONTEND_URL: string;

      JWT_SECRET: string;

      CLOUDINARY_CLOUD_NAME: string;
      CLOUDINARY_API_KEY: string;
      CLOUDINARY_API_SECRET: string;

      ACCESS_TOKEN_SECRET: string;
      ACCESS_TOKEN_EXPIRY: string;
      REFRESH_TOKEN_SECRET: string;
      REFRESH_TOKEN_EXPIRY: string;

      // # .env (never commit)
      PAYPAL_CLIENT_ID: string;
      PAYPAL_CLIENT_SECRET: string;
      PAYPAL_MODE: string;

      //  Stripe (if using stripe)
      STRIPE_SECRET_KEY: string;
      STRIPE_WEBHOOK_SECRET: string;

      //  Email (nodemailer)
      SMTP_HOST: string;
      SMTP_PORT: string;
      SMTP_USER: string;
      SMTP_PASS: string;
      EMAIL_FROM: string;

      LOG_ENABLED: string;
      LOG_LEVEL: string;
      NODE_ENV: string;
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
  query: any;
  params: any;
  cookies: any;
  headers: any;
  files?: any;
}

// Export Express types for use in other files
export { Request, Response, NextFunction, Router };
