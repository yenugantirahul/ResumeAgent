// graph/state.ts

import { Annotation } from "@langchain/langgraph";

import type { ResumeProfile } from "../agents/resume.agent.js";
import type { JobProfile } from "../agents/jd.agents.js";
import type { AnalysisResult } from "../agents/analysis.agent.js";

export const ResumeGraphState = Annotation.Root({
  resumeText: Annotation<string>(),
  jobDescription: Annotation<string>(),

  resumeProfile: Annotation<ResumeProfile>(),
  jobProfile: Annotation<JobProfile>(),

  // Combined matching + improvement result
  analysisResult: Annotation<AnalysisResult>(),
});
