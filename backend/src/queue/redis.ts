import { Redis } from "ioredis";

export const redisConnection = new Redis(
  process.env.REDIS_URL || "redis://localhost:6379",
  {
    maxRetriesPerRequest: null, // Required by BullMQ for blocking commands
  }
);

redisConnection.on("connect", () => console.log("[redis] Connected"));
redisConnection.on("error", (err: Error) => console.error("[redis] Error:", err.message));