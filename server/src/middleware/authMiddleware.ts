// src/middleware/authMiddleware.ts
import { NextFunction, Response } from "express";
import { jwtVerify } from "jose";
import { AuthenticatedRequest } from "../types/express";

export const authenticateJwt = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    console.log("🔍 Auth Middleware - Headers:", req.headers);
    console.log("🔍 Auth Middleware - Cookies:", req.cookies);
    
    const accessToken = req.cookies?.accessToken || 
                       req.headers.authorization?.replace('Bearer ', '') ||
                       req.headers.cookie?.split(';')
                         .find(c => c.trim().startsWith('accessToken='))
                         ?.split('=')[1];

    console.log("ACCESS_TOKEN extracted:", accessToken ? "Present" : "Missing");

    if (!accessToken) {
      console.log("❌ No access token found in request");
      res.status(401).json({ 
        success: false, 
        error: "Access token is not present",
        debug: {
          cookies: Object.keys(req.cookies || {}),
          authHeader: req.headers.authorization ? "Present" : "Missing",
          allCookies: req.headers.cookie || "No cookies"
        }
      });
      return;
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jwtVerify(accessToken, secret);

    req.user = {
      userId: payload.userId as number,
      email: payload.email as string,
      role: payload.role as string || "user",
    };
    
    console.log("✅ JWT Verified - User:", req.user.email);
    next();
  } catch (error) {
    console.error("❌ JWT verification error:", error);
    res.status(401).json({ 
      success: false, 
      error: "Invalid or expired token",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

export const isSuperAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (req.user && req.user.role === "SUPER_ADMIN") {
    next();
  } else {
    res.status(403).json({
      success: false,
      error: "Access denied! Super admin access required",
    });
  }
};