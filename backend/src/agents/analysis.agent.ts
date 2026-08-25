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
 * High-speed single-shot agent that analyzes resume against JD directly
 * in one LLM call, reducing analysis latency to ~1-2 seconds.
 */
export async function analysisAgent(
  resumeText: string,
  jobDescription: string,
): Promise<AnalysisResult> {
  const prompt = `You are an expert ATS resume analyst.
Compare the following resume directly against the job description.

Evaluate:
1. overallScore (integer 0-100): Overall match score.
2. skillScore (integer 0-100): Technical / role skill alignment score.
3. matchedSkills (array of strings): Skills in BOTH resume and job requirements.
4. missingSkills (array of strings): Required/preferred skills in job missing from resume.
5. matchSummary (string): 1-2 concise sentences describing overall fit.
6. suggestions (array of 3-5 strings): High-impact, actionable steps to improve the match.
7. improvementSummary (string): 1 concise sentence summarizing key advice.

Return ONLY valid JSON matching this exact structure with no markdown or code blocks:
{
  "overallScore": 0,
  "skillScore": 0,
  "matchedSkills": [],
  "missingSkills": [],
  "matchSummary": "",
  "suggestions": [],
  "improvementSummary": ""
}

Resume:
${resumeText}

Job Description:
${jobDescription}
`;

  const response = await model.invoke(prompt);

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

