import express from "express";
import helmet from "helmet";
import cors from "cors";
import router from "./routes/index.js";
import { clerkMiddleware } from "@clerk/express";
import dotenv from "dotenv";

dotenv.config();
dotenv.config({ path: ".env.local", override: true });

const app = express();

// Set up permissive CORS headers across all routes & preflight OPTIONS requests
app.use(
  cors({
    origin: (origin, callback) => {
      // In dev & prod, dynamically reflect requested origin for maximum compatibility
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

// Express 5 wildcard OPTIONS handler to ensure preflight requests ALWAYS succeed with 204
app.options("*", cors());

app.use(express.json());
app.use(clerkMiddleware());
app.use(helmet({
  crossOriginResourcePolicy: false,
}));
app.use("/api", router);

export default app;