import express from "express"
import helmet from "helmet";
import router from "./routes/index.js";

const app = express()

app.use(express.json())
app.use(helmet())
app.use("/api", router)

export default app;