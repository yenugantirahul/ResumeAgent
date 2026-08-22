import { ChatGroq } from "@langchain/groq";

import dotenv from "dotenv";

dotenv.config();

export const model = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY!,
  model: "openai/gpt-oss-20b",
  temperature: 0,
});

export function extractTextContent(content: any): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((block: any) => (typeof block === "string" ? block : block.text || ""))
      .join("");
  }
  if (content && typeof content === "object" && typeof content.text === "string") {
    return content.text;
  }
  return String(content || "");
}

export function parseModelJson<T>(rawContent: any): T {
  let content = extractTextContent(rawContent);

  // Remove <think>...</think> reasoning blocks
  content = content.replace(/<think>[\s\S]*?<\/think>/gi, "");

  // Remove markdown code fences
  content = content
    .replace(/```(?:json)?/gi, "")
    .replace(/```/g, "")
    .trim();

  // Find outermost JSON object { ... } or array [ ... ]
  const firstBrace = content.indexOf("{");
  const lastBrace = content.lastIndexOf("}");

  let jsonStr = content;
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    jsonStr = content.slice(firstBrace, lastBrace + 1);
  }

  try {
    return JSON.parse(jsonStr) as T;
  } catch (initialErr) {
    // Attempt sanitization: remove trailing commas before } or ]
    const cleaned = jsonStr
      .replace(/,\s*([}\]])/g, "$1")
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, (c) =>
        c === "\n" || c === "\r" || c === "\t" ? c : ""
      );

    try {
      return JSON.parse(cleaned) as T;
    } catch (secondErr) {
      throw new Error(`Failed to parse model JSON: ${initialErr instanceof Error ? initialErr.message : String(initialErr)} | Raw: ${content}`);
    }
  }
}

