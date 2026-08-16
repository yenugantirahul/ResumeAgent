import { Router } from "express";
import { createSupabaseAdmin } from "../../config/supabase.js";
import { PDFParse } from "pdf-parse";
import { resumeAgent } from "../../agents/resume.agent.js";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { filePath } = req.body;

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

    console.log(profile);

    return res.status(200).json({
      profile,
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