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
 * Single node that runs matching + improvement in one LLM call.
 * Replaces the old matchingNode + improvementNode pair.
 */
export async function analysisNode(state: any) {
  const analysisResult = await analysisAgent(
    state.resumeProfile,
    state.jobProfile,
  );
  return { analysisResult };
}
