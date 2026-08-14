import express from "express"
import helmet from "helmet";
import router from "./routes/index.js";
import { clerkMiddleware } from "@clerk/express";

const app = express()
app.use(clerkMiddleware())
app.use(express.json())
app.use(helmet())
app.use("/api", router)

export default app;