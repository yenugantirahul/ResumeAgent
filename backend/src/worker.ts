import dotenv from "dotenv";
dotenv.config();
dotenv.config({ path: ".env.local", override: true });

import { startResumeWorker } from "./queue/resume.worker.js";

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
