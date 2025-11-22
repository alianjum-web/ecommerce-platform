// auth.controller.ts (suggested)
import { prisma } from "../server";
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";

function signAccessToken(userId: number, email: string, role: string) {
  return jwt.sign({ userId, email, role }, process.env.JWT_SECRET!, {
    expiresIn: "60m",
  });
}

// hash refresh token before storing (so DB safe)
function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

async function setTokens(
  res: Response,
  accessToken: string,
  refreshToken: string
) {
  const isProd = process.env.NODE_ENV === "production";

  // ✅ Industry Standard: No domain for cross-origin, let browser handle it
  const cookieOptions = {
    httpOnly: true, // ✅ Prevent XSS
    secure: isProd, // ✅ HTTPS only in production
    sameSite: isProd ? "none" : "lax", // ✅ "none" for cross-site + secure
    path: "/",
    maxAge: 60 * 60 * 1000, // 1 hour for access token
  } as const;

  // Access Token Cookie
  res.cookie("accessToken", accessToken, cookieOptions);

  // Refresh Token Cookie (longer expiry)
  res.cookie("refreshToken", refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  // ✅ Logging for development only
  if (!isProd) {
    console.log("🍪 Cookies set with options:", {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      domain: "Not set (auto)",
    });
  }
}

const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({
        success: false,
        error: "User with this email exists!",
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "USER",
      },
    });

    res.status(201).json({
      message: "User registered successfully",
      success: true,
      userId: user.id,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Registration failed" });
  }
};

const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const extractCurrentUser = await prisma.user.findUnique({
      where: { email },
    });
    
    if (!extractCurrentUser || !(await bcrypt.compare(password, extractCurrentUser.password))) {
      res.status(401).json({ success: false, error: "Invalid credentials" });
      return;
    }

    const accessToken = signAccessToken(
      extractCurrentUser.id,
      extractCurrentUser.email,
      extractCurrentUser.role
    );

    const refreshToken = uuidv4();
    const hashed = hashToken(refreshToken);

    await prisma.user.update({
      where: { id: extractCurrentUser.id },
      data: { refreshToken: hashed },
    });

    // Try to set cookies (for same-domain or compatible scenarios)
    await setTokens(res, accessToken, refreshToken);

    // ALSO return tokens in response body for cross-domain scenarios
    res.status(200).json({
      success: true,
      message: "Login successfully",
      user: {
        id: extractCurrentUser.id,
        name: extractCurrentUser.name,
        email: extractCurrentUser.email,
        role: extractCurrentUser.role,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Login failed" });
  }
};

const getCurrentUser = async (req: Request, res: Response) => {
  try {
    // Extract token from cookies or Authorization header
    const token =
      req.cookies?.accessToken || req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    // Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    const userId = Number((decoded as any).userId); // convert to number
    if (Number.isNaN(userId)) {
      return res.status(401).json({ error: "Invalid token payload" });
    }

    // Fetch user from DB
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json({ user });
  } catch (error) {
    console.error("Error fetching current user:", error);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

const refreshAccessToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    
    if (!refreshToken) {
      res.status(401).json({ success: false, error: "Refresh token required" });
      return;
    }

    // Verify refresh token
    const hashedToken = hashToken(refreshToken);
    const user = await prisma.user.findFirst({
      where: { refreshToken: hashedToken }
    });

    if (!user) {
      // Clear invalid cookies
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');
      res.status(401).json({ success: false, error: "Invalid refresh token" });
      return;
    }

    // Issue new access token
    const newAccessToken = signAccessToken(user.id, user.email, user.role);
    
    // Set new access token cookie
    const isProd = process.env.NODE_ENV === "production";
    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      path: "/",
      maxAge: 60 * 60 * 1000, // 1 hour
    });

    res.json({
      success: true,
      message: "Token refreshed",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      }
    });

  } catch (error) {
    console.error("Token refresh error:", error);
    res.status(500).json({ success: false, error: "Token refresh failed" });
  }
};

const logout = async (req: Request, res: Response): Promise<void> => {
  const isProd = process.env.NODE_ENV === "production";
  const domain = isProd ? process.env.COOKIE_DOMAIN : undefined;

  res.clearCookie("accessToken", {
    path: "/",
    domain: domain,
  });
  res.clearCookie("refreshToken", {
    path: "/",
    domain: domain,
  });

  res.status(200).json({
    success: true,
    message: "User logged out successfully",
  });
};

export { register, login, getCurrentUser, refreshAccessToken, logout };
