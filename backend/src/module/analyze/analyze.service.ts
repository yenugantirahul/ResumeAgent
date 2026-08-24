import { createSupabaseAdmin } from "../../config/supabase.js";
import { PDFParse } from "pdf-parse";
import { resumeGraph } from "../../graph/resume.graph.js";

export interface AnalyzeResumeInput {
  filePath: string;
  jobDescription: string;
}

export interface AnalyzeResumeOutput {
  overallScore: number;
  skillScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  matchSummary: string;
  suggestions: string[];
  improvementSummary: string;
}

export class AnalyzeService {
  
  // Downloads resume from Supabase storage and extracts its plain text.
  
  async extractResumeText(filePath: string): Promise<string> {
    const supabase = createSupabaseAdmin();

    const { data, error } = await supabase.storage
      .from("Resumes")
      .download(filePath);

    if (error) {
      console.error(
        "[AnalyzeService] Supabase download error:",
        JSON.stringify(error)
      );
      throw new Error(`Failed to download resume from storage: ${error.message}`);
    }

    const arrayBuffer = await data.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const parser = new PDFParse({ data: buffer });
    const parsedPdf = await parser.getText();

    return parsedPdf.text;
  }

  
  // Orchestrates resume extraction, LangGraph workflow execution, and result formatting.
  
  async analyzeResume({
    filePath,
    jobDescription,
  }: AnalyzeResumeInput): Promise<AnalyzeResumeOutput> {
    const resumeText = await this.extractResumeText(filePath);

    const result = await resumeGraph.invoke({
      resumeText,
      jobDescription,
    });

    return {
      overallScore: result.analysisResult.overallScore,
      skillScore: result.analysisResult.skillScore,
      matchedSkills: result.analysisResult.matchedSkills,
      missingSkills: result.analysisResult.missingSkills,
      matchSummary: result.analysisResult.matchSummary,
      suggestions: result.analysisResult.suggestions,
      improvementSummary: result.analysisResult.improvementSummary,
    };
  }
}

export const analyzeService = new AnalyzeService();
