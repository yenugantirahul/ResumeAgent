import express from "express";
import helmet from "helmet";
import cors from "cors";
import router from "./routes/index.js";
import { clerkMiddleware } from "@clerk/express";
import dotenv from "dotenv";
dotenv.config();
dotenv.config({ path: ".env.local", override: true });

const app = express();

// CORS must be first — before clerkMiddleware — so preflight OPTIONS requests
// receive Access-Control-Allow-Origin before any auth check runs.
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposedHeaders: ["Content-Length", "X-Content-Length", "Location"],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  }),
);

app.use(express.json());
app.use(clerkMiddleware());
app.use(helmet());
app.use("/api", router);

export default app;
