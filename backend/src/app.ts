import express from "express";
import helmet from "helmet";
import cors from "cors";
import router from "./routes/index.js";
import { clerkMiddleware } from "@clerk/express";
import dotenv from "dotenv";
import path from "path";

// Load .env and .env.local reliably from the backend root directory
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
dotenv.config({ path: path.resolve(process.cwd(), "backend/.env.local"), override: true });

const app = express();

// 1. CORS middleware must run first to handle all preflight OPTIONS requests cleanly
app.use(
  cors({
    origin: (origin, callback) => {
      callback(null, origin || true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
    exposedHeaders: ["Content-Length", "X-Content-Length", "Location"],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  }),
);

// Explicit OPTIONS handler for all endpoints
app.options("*", cors());

app.use(express.json());

// Only use clerkMiddleware if Clerk keys are present
if (process.env.CLERK_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
  process.env.CLERK_PUBLISHABLE_KEY = process.env.CLERK_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  app.use(clerkMiddleware());
} else {
  console.warn("[auth] Warning: CLERK_PUBLISHABLE_KEY is not set in environment.");
}

app.use(helmet({
  crossOriginResourcePolicy: false,
}));

app.use("/api", router);

export default app;