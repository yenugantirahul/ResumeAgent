import { resumeAgent } from "../agents/resume.agent.js";
import { jdAgent } from "../agents/jd.agents.js";
import { analysisAgent } from "../agents/analysis.agent.js";

export async function resumeNode(state: any) {
  const resumeProfile = await resumeAgent(state.resumeText);
  return { resumeProfile };
}

export async function jdNode(state: any) {
  const jobProfile = await jdAgent(state.jobDescription);
  return { jobProfile };
}

/**
 * Fast direct analysis node that evaluates resume against JD directly.
 */
export async function analysisNode(state: any) {
  const analysisResult = await analysisAgent(
    state.resumeText,
    state.jobDescription,
  );
  return { analysisResult };
}

