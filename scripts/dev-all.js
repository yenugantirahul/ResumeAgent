import { spawn } from "child_process";

console.log("==================================================");
console.log("Starting API and BullMQ Worker in DEV mode (watch)...");
console.log("==================================================");

// Spawn tsx watch for server.ts
const api = spawn(
  process.platform === "win32" ? "npx.cmd" : "npx",
  ["tsx", "watch", "src/server.ts"],
  {
    cwd: "backend",
    stdio: "inherit",
    shell: true,
    env: process.env,
  }
);

// Spawn tsx watch for worker.ts
const worker = spawn(
  process.platform === "win32" ? "npx.cmd" : "npx",
  ["tsx", "watch", "src/worker.ts"],
  {
    cwd: "backend",
    stdio: "inherit",
    shell: true,
    env: process.env,
  }
);

api.on("error", (err) => console.error("[dev] API error:", err));
worker.on("error", (err) => console.error("[dev] Worker error:", err));

const shutdown = () => {
  console.log("\n[dev] Shutting down development processes...");
  api.kill("SIGTERM");
  worker.kill("SIGTERM");
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);