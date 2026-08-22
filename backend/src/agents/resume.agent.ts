import { model, parseModelJson } from "../config/model.js";


export type ResumeProfile = {
  skills: string[];

  experience: {
    company: string;
    role: string;
    description: string;
  }[];

  projects: {
    name: string;
    technologies: string[];
    description: string;
  }[];

  education: {
    institution: string;
    degree: string;
  }[];
};


export async function resumeAgent(
  resumeText: string
) {
  const prompt = `
You are a resume parsing agent.

Your task is to extract structured information from the resume.

Return ONLY valid JSON.

Use exactly this shape:

{
  "skills": [],
  "experience": [
    {
      "company": "",
      "role": "",
      "description": ""
    }
  ],
  "projects": [
    {
      "name": "",
      "technologies": [],
      "description": ""
    }
  ],
  "education": [
    {
      "institution": "",
      "degree": ""
    }
  ]
}

Rules:
- Use only information present in the resume.
- Never invent skills.
- Never invent companies.
- Never invent projects.
- Never invent experience.
- Never invent education.
- If a section has no information, return an empty array.
- Do not include markdown.
- Do not include \`\`\`json.
- Do not include explanations.
- Return only the JSON object.

Resume:

${resumeText}
`;

  const response = await model.invoke(prompt);

  console.log("[resumeAgent] RAW RESPONSE:", response.content);

  try {
    const parsed = parseModelJson<ResumeProfile>(response.content);

    return {
      skills: Array.isArray(parsed.skills) ? parsed.skills : [],
      experience: Array.isArray(parsed.experience) ? parsed.experience : [],
      projects: Array.isArray(parsed.projects) ? parsed.projects : [],
      education: Array.isArray(parsed.education) ? parsed.education : [],
    };
  } catch (error) {
    console.error("[resumeAgent] JSON PARSE FAILED:", response.content, error);
    throw new Error(`Resume agent returned invalid JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
}