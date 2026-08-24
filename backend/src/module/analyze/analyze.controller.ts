import { Request, Response } from "express";
import { analyzeService } from "./analyze.service.js";

export class AnalyzeController {
  // POST /api/analyze
  // Triggers the resume pipeline task and returns a taskId immediately (202).
  async analyzeResume(req: Request, res: Response): Promise<Response> {
    try {
      const { filePath, fileName, jobDescription } = req.body;

      // Clerk attaches the verified user to req.auth via the Clerk middleware
      const userId = (req as any).auth?.userId;

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (!filePath) {
        return res.status(400).json({ message: "filePath is required" });
      }

      if (!fileName) {
        return res.status(400).json({ message: "fileName is required" });
      }

      if (!jobDescription) {
        return res.status(400).json({ message: "jobDescription is required" });
      }

      console.log("[analyze] triggering pipeline for user:", userId);

      const result = await analyzeService.analyzeResume({
        userId,
        filePath,
        fileName,
        jobDescription,
      });

      // 202 Accepted — work is happening in the background
      return res.status(202).json(result);
    } catch (error) {
      const err = error as Error;
      console.error("[analyze] ERROR:", err.message, err.stack);

      return res.status(500).json({
        message: "Failed to start resume analysis",
        error: err.message,
      });
    }
  }
}

export const analyzeController = new AnalyzeController();
