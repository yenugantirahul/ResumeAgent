import { Worker, Job } from "bullmq";
import { redisConnection } from "./redis.js";
import { createSupabaseAdmin } from "../config/supabase.js";
import { PDFParse } from "pdf-parse";
import { resumeGraph } from "../graph/resume.graph.js";

interface ResumeJobPayload {
  resumeId: number;
  filePath: string;
  jobDescription: string;
}

async function processResumeJob(job: Job<ResumeJobPayload>): Promise<void> {
  const { resumeId, filePath, jobDescription } = job.data;
  const supabase = createSupabaseAdmin();

  console.log(`[worker] Processing job ${job.id} | resumeId=${resumeId}`);

  // ── Step 1: Download PDF from Supabase Storage ─────────────────────────────
  const { data: fileData, error: downloadError } = await supabase.storage
    .from("Resumes")
    .download(filePath);

  if (downloadError) {
    throw new Error(`PDF download failed: ${downloadError.message}`);
  }

  // ── Step 2: Parse PDF text ──────────────────────────────────────────────────
  const buffer = Buffer.from(await fileData.arrayBuffer());
  const parser = new PDFParse({ data: buffer });
  const parsed = await parser.getText();

  // Clean and cap at 4000 chars (fewer tokens = faster LLM)
  const resumeText = parsed.text
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, 4000);

  console.log(`[worker] PDF parsed | chars=${resumeText.length}`);

  // ── Step 3: Run LangGraph AI pipeline ──────────────────────────────────────
  const result = await resumeGraph.invoke({ resumeText, jobDescription });
  const analysis = result.analysisResult;

  console.log(`[worker] Analysis complete | overallScore=${analysis.overallScore}`);

  // ── Step 4: Store result in Supabase report table ──────────────────────────
  // Note: DB column is spelled "overall_secore" (typo in original schema — must match)
  const { error: reportError } = await supabase
    .from("report")
    .insert({
      resume_id: resumeId,
      status: "COMPLETED",
      overall_secore: analysis.overallScore,
      skill_score: analysis.skillScore,
      matched_skills: analysis.matchedSkills,
      missing_skills: analysis.missingSkills,
      suggestions: analysis.suggestions,
      summary: analysis.improvementSummary,
    });

  if (reportError) {
    throw new Error(`Failed to store report: ${reportError.message}`);
  }

  console.log(`[worker] Job ${job.id} complete | resumeId=${resumeId}`);
}

export function startResumeWorker(): Worker {
  const worker = new Worker<ResumeJobPayload>(
    "resume-analysis",
    processResumeJob,
    {
      connection: redisConnection,
      concurrency: 2, // Keep low — LLM calls are expensive / rate-limited
    }
  );

  worker.on("completed", (job) =>
    console.log(`[worker] ✅ Job ${job.id} completed`)
  );

  worker.on("failed", (job, err) =>
    console.error(`[worker] ❌ Job ${job?.id} failed: ${err.message}`)
  );

  worker.on("error", (err) =>
    console.error(`[worker] Worker error: ${err.message}`)
  );

  console.log("[worker] BullMQ resume worker started (concurrency=2)");
  return worker;
}
