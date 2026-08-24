import { logger, task } from "@trigger.dev/sdk";
import { createSupabaseAdmin } from "../config/supabase.js";

export const storeResultTask = task({
  id: "store-result",
  maxDuration: 300,

  run: async (payload: {
    resumeId: number;
    overallScore: number;
    skillScore: number;
    matchedSkills: string[];
    missingSkills: string[];
    suggestions: string[];
    summary: string;
  }) => {
    logger.log("Storing analysis result", { resumeId: payload.resumeId });

    const supabase = createSupabaseAdmin();

    // UPDATE the existing row (inserted by store-resume-metadata) with results
    const { error } = await supabase
      .from("resumes")
      .update({
        status: "COMPLETED",
        overall_score: payload.overallScore,
        skill_score: payload.skillScore,
        matched_skills: payload.matchedSkills,
        missing_skills: payload.missingSkills,
        suggestions: payload.suggestions,
        summary: payload.summary,
      })
      .eq("id", payload.resumeId);

    if (error) {
      logger.error("Failed to store result data", { error });
      throw new Error(`Supabase update failed: ${error.message}`);
    }

    logger.log("Result stored successfully", { resumeId: payload.resumeId });
    return { resumeId: payload.resumeId, status: "COMPLETED" };
  },
});
