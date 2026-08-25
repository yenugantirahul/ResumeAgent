import "./polyfills.js";
import { logger, task } from "@trigger.dev/sdk";
import { PDFParse } from "pdf-parse";
import { createSupabaseAdmin } from "../config/supabase.js";
import { resumeGraph } from "../graph/resume.graph.js";

export const analyzeResumeTask = task({
  id: "analyze-resume",
  maxDuration: 300,

  run: async (payload: {
    resumeId: number;
    filePath: string;
    jobDescription: string;
  }) => {
    logger.log("Resume analysis started", { resumeId: payload.resumeId });

    // ── Step 1: Download the PDF from Supabase Storage ──────────────────────
    const supabase = createSupabaseAdmin();

    const { data: fileData, error: downloadError } = await supabase.storage
      .from("Resumes")
      .download(payload.filePath);

    if (downloadError) {
      logger.error("Failed to download resume", { error: downloadError });
      throw new Error(
        `Failed to download resume from storage: ${downloadError.message}`,
      );
    }

    // ── Step 2: Extract plain text from the PDF ──────────────────────────────
    const arrayBuffer = await fileData.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const parser = new PDFParse({ data: buffer });
    const parsedPdf = await parser.getText();

    // Clean and truncate: collapse blank lines, trim whitespace noise,
    // cap at 4000 chars. Fewer input tokens = faster LLM response.
    const resumeText = parsedPdf.text
      .replace(/[ \t]+/g, " ")          // collapse horizontal whitespace
      .replace(/\n{3,}/g, "\n\n")       // collapse 3+ blank lines → 1
      .trim()
      .slice(0, 4000);

    logger.log("PDF text extracted", { chars: resumeText.length });

    // ── Step 3: Run the LangGraph pipeline ───────────────────────────────────
    // resumeAgent + jdAgent run in parallel, then analysisAgent combines them
    const result = await resumeGraph.invoke({
      resumeText,
      jobDescription: payload.jobDescription,
    });

    const analysis = result.analysisResult;

    logger.log("LangGraph analysis complete", {
      overallScore: analysis.overallScore,
      skillScore: analysis.skillScore,
    });

    // Return the analysis — the orchestrator will pass this to store-result
    return {
      overallScore: analysis.overallScore,
      skillScore: analysis.skillScore,
      matchedSkills: analysis.matchedSkills,
      missingSkills: analysis.missingSkills,
      matchSummary: analysis.matchSummary,
      suggestions: analysis.suggestions,
      improvementSummary: analysis.improvementSummary,
    };
  },
});
