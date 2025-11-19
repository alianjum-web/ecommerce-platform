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
    const accessToken = req.cookies?.accessToken || 
                       req.headers.authorization?.replace('Bearer ', '');

    console.log("ACCESS_TOKEN checking.....", accessToken)
    if (!accessToken) {
      res.status(401).json({ success: false, error: "Access token is not present" });
      return;
    }
    console.log("ACCESS_TOKEN is presnet ")

    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jwtVerify(accessToken, secret);

    req.user = {
      userId: payload.userId as number,
      email: payload.email as string,
      role: payload.role as string || "user",
    };
    
    next();
  } catch (error) {
    console.error("JWT verification error:", error);
    res.status(401).json({ success: false, error: "Invalid or expired token" });
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