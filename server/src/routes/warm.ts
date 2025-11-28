// src/routes/warm.ts
import express from "express";
import { warmUp } from "../controllers/warmController";

const router = express.Router();

router.get("/", warmUp);

export default router;