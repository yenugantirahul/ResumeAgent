import { createSupabaseAdmin } from "../../config/supabase.js";
import { resumeQueue } from "../../queue/resume.queue.js";

export interface AnalyzeResumeInput {
  userId: string;
  filePath: string;
  fileName: string;
  jobDescription: string;
}

export interface AnalyzeResumeOutput {
  resumeId: number;
  status: "PENDING";
  message: string;
}

export class AnalyzeService {
  async analyzeResume(input: AnalyzeResumeInput): Promise<AnalyzeResumeOutput> {
    const supabase = createSupabaseAdmin();

    // ── Step 1: Insert PENDING resume row in DB ────────────────────────────────
    console.log("[service] Inserting resume metadata...");
    const { data, error } = await supabase
      .from("resumes")
      .insert({
        user_id: input.userId,
        file_url: input.filePath,
        file_name: input.fileName,
        created_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error) {
      throw new Error(`Failed to create resume row: ${error.message}`);
    }

    const resumeId: number = data.id;
    console.log(`[service] Resume row created | resumeId=${resumeId}`);

    // ── Step 2: Enqueue BullMQ job (fire and forget) ───────────────────────────
    await resumeQueue.add("analyze", {
      resumeId,
      filePath: input.filePath,
      jobDescription: input.jobDescription,
    });

    console.log(`[service] Job enqueued for resumeId=${resumeId}`);

    // ── Step 3: Return immediately — worker handles PDF + AI + DB write ────────
    return {
      resumeId,
      status: "PENDING",
      message: "Resume analysis started. Poll GET /api/analyze/:id for results.",
    };
  }
}

export const analyzeService = new AnalyzeService();
