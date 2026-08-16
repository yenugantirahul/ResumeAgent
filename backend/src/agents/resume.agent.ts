import { ChatGroq } from "@langchain/groq";
import dotenv from "dotenv";

dotenv.config();

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

const model = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY!,
  model: "llama-3.3-70b-versatile",
  temperature: 0,
});

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

  const content = response.content;

  if (typeof content !== "string") {
    throw new Error("Groq response was not a string");
  }

  const cleanedContent = content
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  console.log("Raw Groq output:", content);

  try {
    const parsed = JSON.parse(cleanedContent);

    return parsed as ResumeProfile;
  } catch (error) {
    console.error("Failed JSON:", cleanedContent);

    throw new Error("Groq returned invalid JSON");
  }
}