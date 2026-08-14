import { Router } from "express";
import { createSupabaseClient } from "../../config/supabase.js";
import { PDFParse } from "pdf-parse";
const router = Router();

router.get("/", async (req, res) => {
    const supabase = createSupabaseClient(req);
    const { filePath } = req.body
    const { data, error } = await supabase.storage
        .from("Resumes")
        .download(filePath);

    if (error) {
        throw new Error(error.message);
    }

    const arrayBuffer = await data.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);


    const parser = new PDFParse({
        data: buffer,
    });

    const result = await parser.getText();

    console.log(result.text);
})


export default router