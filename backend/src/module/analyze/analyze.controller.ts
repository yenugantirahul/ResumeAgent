import { Request, Response } from "express";
import { getAuth } from "@clerk/express";
import { analyzeService } from "./analyze.service.js";
import { createSupabaseAdmin } from "../../config/supabase.js";


export class AnalyzeController {
  // POST /api/analyze
  async analyzeResume(req: Request, res: Response): Promise<Response> {
    try {
      const { filePath, fileName, jobDescription } = req.body;
      const { userId } = getAuth(req);

      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      if (!filePath) return res.status(400).json({ message: "filePath is required" });
      if (!fileName) return res.status(400).json({ message: "fileName is required" });
      if (!jobDescription) return res.status(400).json({ message: "jobDescription is required" });

      const result = await analyzeService.analyzeResume({ userId, filePath, fileName, jobDescription });
      return res.status(202).json(result);
    } catch (error) {
      const err = error as Error;
      console.error("[analyze] 500 ERROR:", err.message);
      console.error("[analyze] Stack:", err.stack);
      return res.status(500).json({
        message: "Failed to start resume analysis",
        error: err.message,   // â† shows in browser console
      });
    }
  }

  // GET /api/analyze â€” list all resumes for the authenticated user
  async getResumes(req: Request, res: Response): Promise<Response> {
    try {
      const { userId } = getAuth(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const supabase = createSupabaseAdmin();
      // Join report table to get status and scores alongside metadata
      const { data, error } = await supabase
        .from("resumes")
        .select("id, file_name, created_at, report(id, status, overall_secore, skill_score)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw new Error(error.message);

      const formatted = (data || []).map((item: any) => {
        const report = Array.isArray(item.report) ? item.report[0] : item.report;
        return {
          id: item.id,
          file_name: item.file_name,
          created_at: item.created_at,
          status: (report?.status as "PENDING" | "COMPLETED") ?? "PENDING",
          overall_score: report?.overall_secore ?? report?.overall_score ?? null,
          skill_score: report?.skill_score ?? null,
        };
      });

      return res.status(200).json(formatted);
    } catch (error) {
      const err = error as Error;
      return res.status(500).json({ message: "Failed to fetch resumes", error: err.message });
    }
  }

  // GET /api/analyze/:id â€” get a single resume with full results
  async getResumeById(req: Request, res: Response): Promise<Response> {
    try {
      const { userId } = getAuth(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const { id } = req.params;

      const supabase = createSupabaseAdmin();
      const { data, error } = await supabase
        .from("resumes")
        .select("*, report(*)")
        .eq("id", id)
        .eq("user_id", userId) // ensure user can only read their own
        .single();

      if (error || !data) return res.status(404).json({ message: "Resume not found" });

      const report = Array.isArray(data.report) ? data.report[0] : data.report;
      const formatted = {
        id: data.id,
        file_name: data.file_name,
        file_url: data.file_url,
        created_at: data.created_at,
        status: report?.status ?? "PENDING",
        overall_score: report?.overall_secore ?? report?.overall_score ?? 0,
        skill_score: report?.skill_score ?? 0,
        matched_skills: report?.matched_skills ?? [],
        missing_skills: report?.missing_skills ?? [],
        match_summary: report?.match_summary ?? report?.summary ?? "",
        suggestions: report?.suggestions ?? [],
        summary: report?.summary ?? "",
        // Also provide camelCase fields for seamless compatibility
        overallScore: report?.overall_secore ?? report?.overall_score ?? 0,
        skillScore: report?.skill_score ?? 0,
        matchedSkills: report?.matched_skills ?? [],
        missingSkills: report?.missing_skills ?? [],
        matchSummary: report?.match_summary ?? report?.summary ?? "",
        improvementSummary: report?.summary ?? "",
      };

      return res.status(200).json(formatted);
    } catch (error) {
      const err = error as Error;
      return res.status(500).json({ message: "Failed to fetch resume", error: err.message });
    }
  }
}

export const analyzeController = new AnalyzeController();

