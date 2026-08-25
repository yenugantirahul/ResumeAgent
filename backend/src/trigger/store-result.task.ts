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

    // INSERT into report table linked to the resume row
    // Note: DB column is spelled "overall_secore" (typo in original schema)
    const { data, error } = await supabase
      .from("report")
      .insert({
        resume_id: payload.resumeId,
        status: "COMPLETED",
        overall_secore: payload.overallScore,   // matches DB typo
        skill_score: payload.skillScore,
        matched_skills: payload.matchedSkills,
        missing_skills: payload.missingSkills,
        suggestions: payload.suggestions,
        summary: payload.summary,
      })
      .select("id")
      .single();

    if (error) {
      logger.error("Failed to store result data", { error });
      throw new Error(`Supabase insert failed: ${error.message}`);
    }

    logger.log("Result stored successfully", { resumeId: payload.resumeId, reportId: data.id });
    return { resumeId: payload.resumeId, reportId: data.id, status: "COMPLETED" };
  },
});
