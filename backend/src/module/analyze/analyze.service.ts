import { tasks } from "@trigger.dev/sdk";
import { resumePipelineTask } from "../../trigger/resume-pipeline.task.js";

export interface AnalyzeResumeInput {
  userId: string;
  filePath: string;
  fileName: string;
  jobDescription: string;
}

export interface AnalyzeResumeOutput {
  taskId: string;
  message: string;
}

export class AnalyzeService {
  // Triggers the resume-pipeline background task and returns immediately.
  // The pipeline runs three tasks in sequence:
  // 1. store-resume-metadata  — inserts a PENDING row in Supabase
  // 2. analyze-resume         — downloads PDF, runs LangGraph agents
  // 3. store-result           — updates the row to COMPLETED with scores

  async analyzeResume(input: AnalyzeResumeInput): Promise<AnalyzeResumeOutput> {
    const handle = await tasks.trigger(resumePipelineTask.id, {
      userId: input.userId,
      filePath: input.filePath,
      fileName: input.fileName,
      jobDescription: input.jobDescription,
    });

    console.log("[AnalyzeService] Pipeline task triggered:", handle.id);

    return {
      taskId: handle.id,
      message: "Resume analysis started. Poll /api/analyze/:taskId for status.",
    };
  }
}

export const analyzeService = new AnalyzeService();
