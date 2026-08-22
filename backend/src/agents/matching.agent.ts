import type { ResumeProfile } from "./resume.agent.js";
import { JobProfile } from "./jd.agents.js";
import { model, parseModelJson } from "../config/model.js";


export type MatchResult = {
  overallScore: number;
  skillScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  summary: string;
};



export async function matchingAgent(
  resumeProfile: ResumeProfile,
  jobProfile: JobProfile
): Promise<MatchResult> {
  const response = await model.invoke(`
You are a resume-to-job matching agent.

Return ONLY valid JSON in this format:

{
  "overallScore": 0,
  "skillScore": 0,
  "matchedSkills": [],
  "missingSkills": [],
  "summary": ""
}

Rules:
- Scores must be between 0 and 100.
- Use only information from the provided profiles.
- Do not invent skills.
- matchedSkills must exist in both profiles.
- missingSkills must come from the job requirements but be absent from the resume.
- Keep summary concise.
- Do not include markdown.

Resume Profile:
${JSON.stringify(resumeProfile)}

Job Profile:
${JSON.stringify(jobProfile)}
`);

  console.log("[matchingAgent] RAW RESPONSE:", response.content);

  try {
    const parsed = parseModelJson<MatchResult>(response.content);
    return {
      overallScore: typeof parsed.overallScore === "number" ? parsed.overallScore : 0,
      skillScore: typeof parsed.skillScore === "number" ? parsed.skillScore : 0,
      matchedSkills: Array.isArray(parsed.matchedSkills) ? parsed.matchedSkills : [],
      missingSkills: Array.isArray(parsed.missingSkills) ? parsed.missingSkills : [],
      summary: typeof parsed.summary === "string" ? parsed.summary : "",
    };
  } catch (error) {
    console.error("[matchingAgent] JSON PARSE FAILED:", response.content, error);
    throw new Error(`Matching agent returned invalid JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
}