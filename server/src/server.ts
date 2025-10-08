import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/authRoutes";
import productRoutes from "./routes/productRoutes";
import couponRoutes from "./routes/couponRoutes";
import settingsRoutes from "./routes/settingRoutes";
import cartRoutes from "./routes/cartRoutes";
import addressRoutes from "./routes/addressRoutes";
import orderRoutes from "./routes/orderRoutes";
import { ApiError } from "./utils/ApiError";

// Load environment variables
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3001;

const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

export const prisma = new PrismaClient();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/coupon", couponRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/address", addressRoutes);
app.use("/api/order", orderRoutes);

app.get("/", (req, res) => {
  res.send("Hello from E-Commerce backend");
});
// ✅ CORRECT: Error handling middleware signature
app.use((error: any, req: Request, res: Response, next: NextFunction) => {
  console.error("🔴 GLOBAL_ERROR:", {
    path: req.path,
    method: req.method,
    userId: (req as any).user?.userId,
    error: error.message,
    timestamp: new Date().toISOString(),
  });

  if (error instanceof ApiError) {
    res
      .status(error.statusCode)
      .json(new ApiError(error.statusCode, error.message));
    return;
  }

  // Handle Prisma errors
  if (error.code && error.code.startsWith("P")) {
    console.error("🔴 PRISMA_ERROR:", error.code);
    res.status(400).json({
      success: false,
      message: "Database error occurred",
    });
    return;
  }

  // Generic error
  res.status(500).json(new ApiError(500, "Internal server error"));
});

// 404 Handler for undefined routes
app.use("*", (req: Request, res: Response) => {
  res.status(404).json(new ApiError(404, `Route ${req.originalUrl} not found`));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// Graceful shutdown
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit();
});
