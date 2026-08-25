import { logger, task } from "@trigger.dev/sdk";
import { createSupabaseAdmin } from "../config/supabase.js";

export const storeResumeMetadataTask = task({
  id: "store-resume-metadata",
  maxDuration: 300,

  run: async (payload: {
    userId: string;
    filePath: string;
    fileName: string;
  }) => {
    logger.log("Resume metadata storage started", { payload });

    const supabase = createSupabaseAdmin();

    // .select() returns the inserted row so we can extract the auto-generated id
    const { data, error } = await supabase
      .from("resumes")
      .insert({
        user_id: payload.userId,
        file_url: payload.filePath,
        file_name: payload.fileName,
        created_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error) {
      logger.error("Failed to store resume metadata", { error });
      throw new Error(`Supabase insert failed: ${error.message}`);
    }

    logger.log("Resume metadata stored", { resumeId: data.id });
    return { resumeId: data.id as number };
  },
});
