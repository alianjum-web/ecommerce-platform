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
  
  // For cross-domain setup, don't set domain or set to backend domain
  const domain = isProd ? ".ecommerce-platform-841i.onrender.com" : undefined;

  console.log("Cookie Configuration:", {
    environment: isProd ? "production" : "development",
    domain: domain || "Not set (cross-domain)",
  });

  const cookieOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? ("none" as const) : ("lax" as const),
    path: "/",
    domain: domain, // This should match your backend domain
  } as const;

  // Access Token Cookie
  res.cookie("accessToken", accessToken, {
    ...cookieOptions,
    maxAge: 60 * 60 * 1000, // 1 hour
  });

  // Refresh Token Cookie
  res.cookie("refreshToken", refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  console.log("✅ Cookies set for domain:", domain || "current domain");
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
    console.log("Extracted User", extractCurrentUser);
    if (
      !extractCurrentUser ||
      !(await bcrypt.compare(password, extractCurrentUser.password))
    ) {
      res.status(401).json({ success: false, error: "Invalid credentials" });
      return;
    }
    console.log("ACCESS_TOKEN generating...");

    const accessToken = signAccessToken(
      extractCurrentUser.id,
      extractCurrentUser.email,
      extractCurrentUser.role
    );
    console.log("ACCESS_TOKEN generated", accessToken);

    const refreshToken = uuidv4();
    const hashed = hashToken(refreshToken);

    // store hashed refresh token in DB (replace previous token)
    await prisma.user.update({
      where: { id: extractCurrentUser.id },
      data: { refreshToken: hashed }, // ensure your prisma schema has refreshToken?: string | null
    });
    console.log("Token is setting ....");
    console.log(
      "Before setting cookies - Headers:",
      Object.keys(res.getHeaders())
    );

    await setTokens(res, accessToken, refreshToken);

    // DEBUG: Check what cookies are actually being set
    console.log("Login Response - Cookies being set:");
    const setCookieHeaders = res.getHeaders()["set-cookie"];
    console.log("Set-Cookie headers:", setCookieHeaders);

    res.status(200).json({
      success: true,
      message: "Login successfully",
      user: {
        id: extractCurrentUser.id,
        name: extractCurrentUser.name,
        email: extractCurrentUser.email,
        role: extractCurrentUser.role,
      },
      // Add debug info to response
      debug: {
        accessTokenSet: !!accessToken,
        refreshTokenSet: !!refreshToken,
        cookiesInResponse: setCookieHeaders,
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

// POST /refresh-token
const refreshTokenController = async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) return res.status(401).json({ success: false });

    const hashed = hashToken(token);
    const user = await prisma.user.findFirst({
      where: { refreshToken: hashed },
    });
    if (!user) return res.status(401).json({ success: false });

    // rotate tokens: new access token, optionally new refresh token
    const accessToken = signAccessToken(user.id, user.email, user.role);
    const newRefreshToken = uuidv4();
    const newHashed = hashToken(newRefreshToken);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: newHashed },
    });

    await setTokens(res, accessToken, newRefreshToken);

    return res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
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

export { register, login, getCurrentUser, refreshTokenController, logout };
