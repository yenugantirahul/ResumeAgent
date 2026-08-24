import type { ResumeProfile } from "./resume.agent.js";
import type { JobProfile } from "./jd.agents.js";
import { model, parseModelJson } from "../config/model.js";

export type AnalysisResult = {
  overallScore: number;
  skillScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  matchSummary: string;
  suggestions: string[];
  improvementSummary: string;
};

/**
 * Single-shot agent that performs both matching AND improvement in one LLM
 * call instead of two, cutting latency by ~40-50%.
 */
export async function analysisAgent(
  resumeProfile: ResumeProfile,
  jobProfile: JobProfile,
): Promise<AnalysisResult> {
  const response = await model.invoke(`
You are a resume analysis agent. Given a resume profile and a job profile,
return ONLY valid JSON in exactly this shape:

{
  "overallScore": 0,
  "skillScore": 0,
  "matchedSkills": [],
  "missingSkills": [],
  "matchSummary": "",
  "suggestions": [],
  "improvementSummary": ""
}

Rules:
- Scores must be integers between 0 and 100.
- matchedSkills: skills present in both the resume and the job requirements.
- missingSkills: skills in the job requirements that are absent from the resume.
- matchSummary: one concise sentence describing the overall fit.
- suggestions: 3-6 specific, actionable steps the candidate can take to improve their match. Never tell the candidate to falsely claim skills they don't have.
- improvementSummary: one concise sentence summarising the improvement advice.
- Use only information from the provided profiles. Do not invent anything.
- Do not include markdown, code fences, or explanations outside the JSON.

Resume Profile:
${JSON.stringify(resumeProfile)}

Job Profile:
${JSON.stringify(jobProfile)}
`);

  console.log("[analysisAgent] RAW RESPONSE:", response.content);

  try {
    const parsed = parseModelJson<AnalysisResult>(response.content);
    return {
      overallScore:
        typeof parsed.overallScore === "number" ? parsed.overallScore : 0,
      skillScore:
        typeof parsed.skillScore === "number" ? parsed.skillScore : 0,
      matchedSkills: Array.isArray(parsed.matchedSkills)
        ? parsed.matchedSkills
        : [],
      missingSkills: Array.isArray(parsed.missingSkills)
        ? parsed.missingSkills
        : [],
      matchSummary:
        typeof parsed.matchSummary === "string" ? parsed.matchSummary : "",
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
      improvementSummary:
        typeof parsed.improvementSummary === "string"
          ? parsed.improvementSummary
          : "",
    };
  } catch (error) {
    console.error(
      "[analysisAgent] JSON PARSE FAILED:",
      response.content,
      error,
    );
    throw new Error(
      `Analysis agent returned invalid JSON: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
