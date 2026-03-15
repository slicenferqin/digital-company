import { END, START, StateGraph } from "@langchain/langgraph";

import { createBriefing, listBriefingsForCycle } from "@/lib/domain/briefing/repository";
import { createDecision } from "@/lib/domain/decision/repository";
import { initializeDecisionReviewWorkflow } from "@/lib/services/decision-workflow";

import { mapTaskEvents } from "./nodes/map-task-events";
import { createReduceBriefingNode } from "./nodes/reduce-briefing";
import type { BriefingGraphDependencies, BriefingInput } from "./state";
import { BriefingStateAnnotation } from "./state";

const defaultDependencies: BriefingGraphDependencies = {
  listBriefingsForCycle,
  createBriefing,
  createDecision,
  initializeDecisionReviewWorkflow
};

export function buildBriefingGraph(
  dependencies: BriefingGraphDependencies = defaultDependencies
) {
  return new StateGraph(BriefingStateAnnotation)
    .addNode("mapTaskEvents", mapTaskEvents)
    .addNode("reduceBriefing", createReduceBriefingNode(dependencies))
    .addEdge(START, "mapTaskEvents")
    .addEdge("mapTaskEvents", "reduceBriefing")
    .addEdge("reduceBriefing", END)
    .compile();
}

export async function runBriefingGraph(
  input: BriefingInput,
  dependencies: BriefingGraphDependencies = defaultDependencies
) {
  const graph = buildBriefingGraph(dependencies);

  return graph.invoke({
    teamId: input.teamId,
    cycleId: input.cycleId,
    type: input.type ?? "daily",
    events: input.events,
    escalationThreshold: input.escalationThreshold ?? 5
  });
}
