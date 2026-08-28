import { spawn } from "child_process";

console.log("==================================================");
console.log("Starting API Server and BullMQ Worker concurrently...");
console.log("==================================================");

const api = spawn("node", ["backend/dist/server.js"], { stdio: "inherit", env: process.env });
const worker = spawn("node", ["backend/dist/worker.js"], { stdio: "inherit", env: process.env });

api.on("error", (err) => { console.error("API failed to spawn:", err); process.exit(1); });
worker.on("error", (err) => { console.error("Worker failed to spawn:", err); });

api.on("exit", (code, signal) => {
  console.error(`API exited: code=${code} signal=${signal}`);
  worker.kill("SIGTERM");
  process.exit(code ?? 1);
});

worker.on("exit", (code, signal) => {
  console.warn(`Worker exited: code=${code} signal=${signal}`);
});

const shutdown = () => { api.kill("SIGTERM"); worker.kill("SIGTERM"); };
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
