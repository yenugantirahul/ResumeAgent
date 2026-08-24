// graph/resume.graph.ts

import { StateGraph, START, END } from "@langchain/langgraph";

import { ResumeGraphState } from "./graph.js";
import { resumeNode, jdNode, analysisNode } from "./nodes.js";

export const resumeGraph = new StateGraph(ResumeGraphState)
  .addNode("resume", resumeNode)
  .addNode("jd", jdNode)
  .addNode("analysis", analysisNode)
  // resume + jd run in parallel from START
  .addEdge(START, "resume")
  .addEdge(START, "jd")
  // analysis waits for both to finish
  .addEdge("resume", "analysis")
  .addEdge("jd", "analysis")
  .addEdge("analysis", END)
  .compile();