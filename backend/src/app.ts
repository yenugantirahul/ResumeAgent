import dotenv from "dotenv";
import path from "path";

// Ensure dotenv is loaded immediately inside app.ts as well
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
dotenv.config({ path: path.resolve(process.cwd(), "backend/.env.local"), override: true });

import express, { Request, Response, NextFunction } from "express";
import helmet from "helmet";
import cors from "cors";
import router from "./routes/index.js";
import { clerkMiddleware } from "@clerk/express";

const app = express();

// 1. Universal CORS middleware with fallback
app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin || "http://localhost:3000";
  res.header("Access-Control-Allow-Origin", origin as string);
  res.header("Access-Control-Allow-Credentials", "true");
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );

  // If preflight OPTIONS request, respond immediately with 204 No Content
  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }

  next();
});

app.use(express.json());

// Only use Clerk middleware if keys are present
const publishableKey =
  process.env.CLERK_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

const secretKey = process.env.CLERK_SECRET_KEY;

if (publishableKey && secretKey) {
  app.use(
    clerkMiddleware({
      publishableKey,
      secretKey,
    })
  );
} else {
  console.warn(
    "[auth] Warning: CLERK_PUBLISHABLE_KEY or CLERK_SECRET_KEY missing in backend process."
  );
}

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

app.use("/api", router);

export default app;