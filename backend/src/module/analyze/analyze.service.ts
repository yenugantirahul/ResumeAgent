import { createSupabaseAdmin } from "../../config/supabase.js";
import { PDFParse } from "pdf-parse";
import { resumeGraph } from "../../graph/resume.graph.js";

export interface AnalyzeResumeInput {
  userId: string;
  filePath: string;
  fileName: string;
  jobDescription: string;
}

export interface AnalyzeResumeOutput {
  resumeId: number;
  reportId: number;
  overallScore: number;
  skillScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  matchSummary: string;
  suggestions: string[];
  improvementSummary: string;
}

export class AnalyzeService {
  async analyzeResume(input: AnalyzeResumeInput): Promise<AnalyzeResumeOutput> {
    const supabase = createSupabaseAdmin();

    console.log("[service] Step 1: parallel resume insertion and PDF download");
    const [insertResult, downloadResult] = await Promise.all([
      supabase
        .from("resumes")
        .insert({
          user_id: input.userId,
          file_url: input.filePath,
          file_name: input.fileName,
        })
        .select("id")
        .single(),
      supabase.storage
        .from("Resumes")
        .download(input.filePath),
    ]);

    if (insertResult.error) {
      console.error("[service] DB insert FAILED:", insertResult.error);
      throw new Error(`Failed to create resume row: ${insertResult.error.message}`);
    }
    if (downloadResult.error) {
      console.error("[service] Storage download FAILED:", downloadResult.error);
      throw new Error(`Failed to download resume: ${downloadResult.error.message}`);
    }

    const resumeId: number = insertResult.data.id;
    const fileData = downloadResult.data;

    // Parse PDF text in memory
    const buffer = Buffer.from(await fileData.arrayBuffer());
    const parser = new PDFParse({ data: buffer });
    const parsed = await parser.getText();
    await parser.destroy();

    const resumeText = parsed.text
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
      .slice(0, 4000);

    // Run high-speed analysis pipeline
    console.log("[service] Step 2: running fast analysis pipeline");
    const result = await resumeGraph.invoke({
      resumeText,
      jobDescription: input.jobDescription,
    });
    const analysis = result.analysisResult;
    console.log("[service] Step 2 complete, overallScore:", analysis.overallScore);

    // 4. INSERT result into report table (linked via resume_id FK)
    // Note: the DB column is spelled "overall_secore" (typo in schema — must match exactly)
    console.log("[service] Step 4: inserting into report table");
    const { data: reportRow, error: reportError } = await supabase
      .from("report")
      .insert({
        resume_id: resumeId,
        status: "COMPLETED",
        overall_secore: analysis.overallScore,  // matches DB typo
        skill_score: analysis.skillScore,
        matched_skills: analysis.matchedSkills,
        missing_skills: analysis.missingSkills,
        suggestions: analysis.suggestions,
        summary: analysis.improvementSummary,
      })
      .select("id")
      .single();

    if (reportError) {
      console.error("[service] Step 4 FAILED:", reportError);
    } else {
      console.log("[service] Step 4 done, reportId:", reportRow?.id);
    }

    return {
      resumeId,
      reportId: reportRow?.id ?? 0,
      overallScore: analysis.overallScore,
      skillScore: analysis.skillScore,
      matchedSkills: analysis.matchedSkills,
      missingSkills: analysis.missingSkills,
      matchSummary: analysis.matchSummary,
      suggestions: analysis.suggestions,
      improvementSummary: analysis.improvementSummary,
    };
  }
}

export const analyzeService = new AnalyzeService();
