import { Router } from "express";
import { analyzeController } from "./analyze.controller.js";

const router = Router();

router.post("/", (req, res) => analyzeController.analyzeResume(req, res));

export default router;
