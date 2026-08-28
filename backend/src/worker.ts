import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env files with absolute paths from both cwd and backend directories
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), "backend/.env.local") });
dotenv.config({ path: path.resolve(process.cwd(), "backend/.env") });

console.log("[worker] Environment check:");
console.log(`  SUPABASE_URL: ${process.env.SUPABASE_URL ? "Loaded ✅" : "MISSING ❌"}`);
console.log(`  REDIS_URL: ${process.env.REDIS_URL || "redis://localhost:6379"}`);

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