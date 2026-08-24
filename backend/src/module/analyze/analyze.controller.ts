import { Request, Response } from "express";
import { analyzeService } from "./analyze.service.js";

export class AnalyzeController {
  // POST /api/analyze request

  async analyzeResume(req: Request, res: Response): Promise<Response> {
    try {
      const { filePath, jobDescription } = req.body;

      console.log("[analyze] filePath received:", filePath);
      console.log(
        "[analyze] Authorization header present:",
        !!req.headers.authorization,
      );

      if (!filePath) {
        return res.status(400).json({
          message: "filePath is required",
        });
      }

      if (!jobDescription) {
        return res.status(400).json({
          message: "jobDescription is required",
        });
      }

      const result = await analyzeService.analyzeResume({
        filePath,
        jobDescription,
      });

      return res.status(200).json(result);
    } catch (error) {
      const err = error as Error;
      console.error("[analyze] ERROR:", err.message, err.stack);

      return res.status(500).json({
        message: "Failed to analyze resume",
        error: err.message,
        step: err.stack?.split("\n")[1]?.trim(),
      });
    }
  }
}

export const analyzeController = new AnalyzeController();
