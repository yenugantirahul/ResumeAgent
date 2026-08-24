import { logger, task, tasks } from "@trigger.dev/sdk";
import { storeResumeMetadataTask } from "./store-resume-metadata.task.js";
import { analyzeResumeTask } from "./analyze-resume.task.js";
import { storeResultTask } from "./store-result.task.js";

/**
 * Orchestrator task — runs the full resume pipeline in 3 sequential steps:
 *
 *  1. store-resume-metadata  →  inserts a PENDING row, returns resumeId
 *  2. analyze-resume         →  downloads PDF, runs LangGraph, returns scores
 *  3. store-result           →  updates the row to COMPLETED with scores
 */
export const resumePipelineTask = task({
  id: "resume-pipeline",
  maxDuration: 600,

  run: async (payload: {
    userId: string;
    filePath: string;
    fileName: string;
    jobDescription: string;
  }) => {
    logger.log("Resume pipeline started", { payload });

    // ── Step 1: Store resume metadata, get back the new resumeId ─────────────
    const metadataResult = await tasks.triggerAndWait(
      storeResumeMetadataTask.id,
      {
        userId: payload.userId,
        filePath: payload.filePath,
        fileName: payload.fileName,
      },
    );

    if (!metadataResult.ok) {
      throw new Error("store-resume-metadata task failed");
    }

    const { resumeId } = metadataResult.output;
    logger.log("Step 1 complete — metadata stored", { resumeId });

    // ── Step 2: Analyze the resume ────────────────────────────────────────────
    const analysisResult = await tasks.triggerAndWait(analyzeResumeTask.id, {
      resumeId,
      filePath: payload.filePath,
      jobDescription: payload.jobDescription,
    });

    if (!analysisResult.ok) {
      throw new Error("analyze-resume task failed");
    }

    const analysis = analysisResult.output;
    logger.log("Step 2 complete — analysis done", {
      overallScore: analysis.overallScore,
    });

    // ── Step 3: Persist the analysis result ──────────────────────────────────
    const storeResult = await tasks.triggerAndWait(storeResultTask.id, {
      resumeId,
      overallScore: analysis.overallScore,
      skillScore: analysis.skillScore,
      matchedSkills: analysis.matchedSkills,
      missingSkills: analysis.missingSkills,
      suggestions: analysis.suggestions,
      summary: analysis.improvementSummary,
    });

    if (!storeResult.ok) {
      throw new Error("store-result task failed");
    }

    logger.log("Resume pipeline complete", { resumeId });

    return {
      resumeId,
      ...analysis,
    };
  },
});
