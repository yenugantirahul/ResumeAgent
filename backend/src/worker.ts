import "./config/env.js";
import { startResumeWorker } from "./queue/resume.worker.js";

console.log("[worker] Environment check:");
console.log(`  SUPABASE_URL: ${process.env.SUPABASE_URL ? "Loaded ✅" : "MISSING ❌"}`);
console.log(`  REDIS_URL: ${process.env.REDIS_URL || "redis://localhost:6379"}`);

const worker = startResumeWorker();

// Graceful shutdown
const shutdown = async () => {
  console.log("[worker] Shutting down gracefully...");
  await worker.close();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

console.log("[worker] Resume analysis BullMQ worker is running. Press Ctrl+C to stop.");