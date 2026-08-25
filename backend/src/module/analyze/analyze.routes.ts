import { Router } from "express";
import { analyzeController } from "./analyze.controller.js";

const router = Router();

router.post("/", (req, res) => analyzeController.analyzeResume(req, res));
router.get("/", (req, res) => analyzeController.getResumes(req, res));
router.get("/:id", (req, res) => analyzeController.getResumeById(req, res));

export default router;
