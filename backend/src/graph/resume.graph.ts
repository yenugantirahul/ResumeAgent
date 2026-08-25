// graph/resume.graph.ts

import { StateGraph, START, END } from "@langchain/langgraph";

import { ResumeGraphState } from "./graph.js";
import { analysisNode } from "./nodes.js";

export const resumeGraph = new StateGraph(ResumeGraphState)
  .addNode("analysis", analysisNode)
  .addEdge(START, "analysis")
  .addEdge("analysis", END)
  .compile();