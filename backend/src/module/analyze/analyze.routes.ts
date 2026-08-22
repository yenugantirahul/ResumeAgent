import { Router } from "express";
import { createSupabaseAdmin } from "../../config/supabase.js";
import { PDFParse } from "pdf-parse";
import { resumeAgent } from "../../agents/resume.agent.js";
import { jdAgent } from "../../agents/jd.agents.js";
import { matchingAgent } from "../../agents/matching.agent.js";
import { improvementAgent } from "../../agents/improvement.agent.js";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { filePath, jobDescription } = req.body;

    console.log("[analyze] filePath received:", filePath);
    console.log("[analyze] Authorization header present:", !!req.headers.authorization);

    if (!filePath) {
      return res.status(400).json({
        message: "filePath is required",
      });
    }

    const supabase = createSupabaseAdmin();

    const { data, error } = await supabase.storage
      .from("Resumes")
      .download(filePath);

    if (error) {
      console.error("[analyze] Supabase download error:", JSON.stringify(error));
      return res.status(500).json({
        message: "Failed to download resume",
        error: error.message,
        supabaseError: error,
      });
    }

    const arrayBuffer = await data.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const parser = new PDFParse({
      data: buffer,
    });

    const result = await parser.getText();

    const resumeText = result.text;

    const profile = await resumeAgent(resumeText);
    const jd = await jdAgent(jobDescription);
    const mat = await matchingAgent(profile, jd);
    const imp = await improvementAgent(profile, jd, mat, );
    console.log(profile + " " + jd);

    return res.status(200).json({
      profile,
      jd,
      mat,
      imp
    });
  } catch (error) {
    const err = error as Error;
    console.error("[analyze] ERROR:", err.message, err.stack);

    return res.status(500).json({
      message: "Failed to analyze resume",
      error: err.message,
      step: err.stack?.split("\n")[1]?.trim(),
    });
  }
});

export default router;