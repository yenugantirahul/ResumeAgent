import { Router } from "express";
import healthRoutes from "../module/health/health.routes.js";
import analyzeRoutes from "../module/analyze/analyze.routes.js";

const router = Router();

router.use("/health", healthRoutes);
router.use("/analyze", analyzeRoutes)
export default router;