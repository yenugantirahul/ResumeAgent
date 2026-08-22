import { model, parseModelJson } from "../config/model.js";


export type JobProfile = {
    role: string,
    requiredSkills: string[],
    preferredSkills: string[],
    responsibilities: string[],
    keywords: string[],
}





export async function jdAgent(
    desc: string
) {
    const prompt = `
You are a job description parsing agent.

Your task is to extract structured information from the provided job description.

Return ONLY valid JSON in exactly this format:

{
  "role": "",
  "requiredSkills": [],
  "preferredSkills": [],
  "responsibilities": [],
  "keywords": []
}

Rules:
- Use only information present in the job description.
- Do not invent requirements.
- Do not invent skills.
- Do not perform resume matching.
- Put mandatory skills in "requiredSkills".
- Put optional, preferred, bonus, or nice-to-have skills in "preferredSkills".
- Put major duties in "responsibilities".
- Put important ATS-style technical or role-specific terms in "keywords".
- If the role title is not clearly stated, return an empty string.
- If a section has no information, return an empty array.
- Avoid duplicate values.
- Keep skill names concise.
- Do not include markdown.
- Do not include explanations.
- Return only the JSON object.

Job Description:

${desc}
`;
    const response = await model.invoke(prompt);

    console.log("[jdAgent] RAW RESPONSE:", response.content);

    try {
        const parsed = parseModelJson<JobProfile>(response.content);

        return {
            role: typeof parsed.role === "string" ? parsed.role : "",
            requiredSkills: Array.isArray(parsed.requiredSkills) ? parsed.requiredSkills : [],
            preferredSkills: Array.isArray(parsed.preferredSkills) ? parsed.preferredSkills : [],
            responsibilities: Array.isArray(parsed.responsibilities) ? parsed.responsibilities : [],
            keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
        };
    } catch (error) {
        console.error("[jdAgent] JSON PARSE FAILED:", response.content, error);
        throw new Error(`JD agent returned invalid JSON: ${error instanceof Error ? error.message : String(error)}`);
    }
}