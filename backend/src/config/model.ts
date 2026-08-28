import "./env.js";
import { ChatGoogle } from "@langchain/google";

export const model = new ChatGoogle({
  apiKey: process.env.GOOGLE_API_KEY!,
  model: process.env.GEMINI_MODEL || "gemini-3.5-flash-lite",
  temperature: 0,
});

export function extractTextContent(content: any): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((block: any) =>
        typeof block === "string" ? block : block.text || "",
      )
      .join("");
  }
  if (
    content &&
    typeof content === "object" &&
    typeof content.text === "string"
  ) {
    return content.text;
  }
  return String(content || "");
}

/**
 * Attempts to repair truncated JSON by closing any open strings,
 * arrays, and objects.  Handles the common case where the model
 * stops generating mid-response due to a token-limit cut-off.
 */
export function repairTruncatedJson(raw: string): string {
  let s = raw.trim();

  // Stack tracks open containers: '{' or '['
  const stack: string[] = [];
  let inString = false;
  let escape = false;

  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (ch === "\\") {
      escape = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (ch === "{" || ch === "[") stack.push(ch);
    else if (ch === "}" || ch === "]") stack.pop();
  }

  // If we ended inside a string, close it first
  if (inString) s += '"';

  // Remove any trailing comma before we start closing
  s = s.replace(/,\s*$/, "");

  // Close all open containers in LIFO order
  for (let i = stack.length - 1; i >= 0; i--) {
    s += stack[i] === "{" ? "}" : "]";
  }

  return s;
}

export function parseModelJson<T>(rawContent: any): T {
  let content = extractTextContent(rawContent);

  const thinkMatches = [...content.matchAll(/<think>([\s\S]*?)<\/think>/gi)];
  const lastThinkInner =
    thinkMatches.length > 0 ? thinkMatches[thinkMatches.length - 1][1] : "";

  content = content.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

  if (!content && lastThinkInner) {
    console.warn(
      "[parseModelJson] Content was empty after think-block removal; " +
        "falling back to think block inner text.",
    );
    content = lastThinkInner;
  }

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
        c === "\n" || c === "\r" || c === "\t" ? c : "",
      );

    try {
      return JSON.parse(cleaned) as T;
    } catch (_secondErr) {
      try {
        return JSON.parse(repairTruncatedJson(cleaned)) as T;
      } catch (repairErr) {
        throw new Error(
          `Failed to parse model JSON: ${initialErr instanceof Error ? initialErr.message : String(initialErr)} | Raw: ${content}`,
        );
      }
    }
  }
}