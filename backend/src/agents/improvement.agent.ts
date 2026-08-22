import { model } from "../config/model.js";
import { parseModelJson } from "../config/model.js";
import type { ResumeProfile } from "./resume.agent.js";
import type { JobProfile } from "./jd.agents.js";
import type { MatchResult } from "./matching.agent.js";

export type ImprovementResult = {
  suggestions: string[];
  summary: string;
};

export async function improvementAgent(
  resumeProfile: ResumeProfile,
  jobProfile: JobProfile,
  matchResult: MatchResult
): Promise<ImprovementResult> {
  const prompt = `
You are a resume improvement agent.

Return ONLY valid JSON in exactly this shape:

{
  "suggestions": [],
  "summary": ""
}

Rules:
- Use only the provided data.
- Never invent experience, skills, projects, achievements, technologies, or metrics.
- Suggestions must be specific and actionable.
- Do not tell the candidate to falsely claim missing skills.
- If a skill is missing, recommend learning or gaining experience with it.
- Do not include markdown.
- Do not include code fences.
- Do not include explanations before or after the JSON.
- Your entire response must contain one valid JSON object.

Resume Profile:
${JSON.stringify(resumeProfile)}

Job Profile:
${JSON.stringify(jobProfile)}

Match Result:
${JSON.stringify(matchResult)}
`;

  const response = await model.invoke(prompt);

  console.log("[improvementAgent] RAW RESPONSE:", response.content);

  try {
    const parsed = parseModelJson<ImprovementResult>(response.content);

    return {
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
      summary: typeof parsed.summary === "string" ? parsed.summary : "",
    };
  } catch (error) {
    console.error("[improvementAgent] JSON PARSE FAILED:", response.content, error);
    throw new Error(
      `Improvement agent returned invalid JSON: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}