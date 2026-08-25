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

    // 1. Insert into resumes (metadata only — no status/score columns in this table)
    console.log("[service] Step 1: inserting resume row for user", input.userId);
    const { data: row, error: insertError } = await supabase
      .from("resumes")
      .insert({
        user_id: input.userId,
        file_url: input.filePath,
        file_name: input.fileName,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("[service] Step 1 FAILED:", insertError);
      throw new Error(`Failed to create resume row: ${insertError.message}`);
    }
    const resumeId: number = row.id;
    console.log("[service] Step 1 done, resumeId:", resumeId);

    // 2. Download PDF and extract text
    console.log("[service] Step 2: downloading PDF", input.filePath);
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("Resumes")
      .download(input.filePath);

    if (downloadError) {
      console.error("[service] Step 2 FAILED:", downloadError);
      throw new Error(`Failed to download resume: ${downloadError.message}`);
    }

    const buffer = Buffer.from(await fileData.arrayBuffer());
    console.log("[service] Step 2: parsing PDF, bytes:", buffer.length);
    const parser = new PDFParse({ data: buffer });
    const parsed = await parser.getText();
    await parser.destroy();

    const resumeText = parsed.text
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
      .slice(0, 4000);
    console.log("[service] Step 2 done, text chars:", resumeText.length);

    // 3. Run LangGraph pipeline
    console.log("[service] Step 3: running LangGraph pipeline");
    const result = await resumeGraph.invoke({
      resumeText,
      jobDescription: input.jobDescription,
    });
    const analysis = result.analysisResult;
    console.log("[service] Step 3 done, overallScore:", analysis.overallScore);

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
