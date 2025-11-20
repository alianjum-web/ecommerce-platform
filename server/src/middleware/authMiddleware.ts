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
    console.log("🔍 Auth Debug - All cookies:", Object.keys(req.cookies || {}));
    console.log("🔍 Auth Debug - Authorization header:", req.headers.authorization ? "Present" : "Missing");

    // Method 1: Check cookies first
    let accessToken = req.cookies?.accessToken;
    
    // Method 2: Check Authorization header
    if (!accessToken && req.headers.authorization) {
      accessToken = req.headers.authorization.replace('Bearer ', '');
    }
    
    // Method 3: Check query parameter (for specific cases)
    if (!accessToken && req.query.accessToken) {
      accessToken = req.query.accessToken as string;
    }

    console.log("ACCESS_TOKEN found via:", 
      req.cookies?.accessToken ? "Cookie" : 
      req.headers.authorization ? "Header" : 
      "Not found");

    if (!accessToken) {
      res.status(401).json({ 
        success: false, 
        error: "Access token is not present",
        suggestion: "Include token in Authorization header as 'Bearer <token>'",
        debug: {
          availableCookies: Object.keys(req.cookies || {}),
          hasAuthHeader: !!req.headers.authorization
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
      solution: "Please login again to get a new token"
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