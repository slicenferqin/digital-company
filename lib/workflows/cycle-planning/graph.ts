import { END, START, StateGraph } from "@langchain/langgraph";

import { createCycle, createProject, createTask } from "@/lib/domain/cycle/repository";
import { fetchMemoryInputsForPlanning } from "@/lib/domain/memory/repository";
import {
  getTeamById,
  listMembersByTeamId,
  listPreferenceProfilesByTeamId
} from "@/lib/domain/team/repository";

import { createProjectsAndTasksNode } from "./nodes/create-projects-and-tasks";
import { generateCyclePlan } from "./nodes/generate-cycle-plan";
import { createLoadMemoryInputsNode } from "./nodes/load-memory-inputs";
import { createLoadTeamContextNode } from "./nodes/load-team-context";
import {
  CyclePlanningDependencies,
  CyclePlanningStateAnnotation,
  type CyclePlanningInput
} from "./state";

const defaultDependencies: CyclePlanningDependencies = {
  getTeamById,
  listMembersByTeamId,
  listPreferenceProfilesByTeamId,
  fetchMemoryInputsForPlanning,
  createCycle,
  createProject,
  createTask
};

export function buildCyclePlanningGraph(
  dependencies: CyclePlanningDependencies = defaultDependencies
) {
  return new StateGraph(CyclePlanningStateAnnotation)
    .addNode("loadTeamContext", createLoadTeamContextNode(dependencies))
    .addNode("loadMemoryInputs", createLoadMemoryInputsNode(dependencies))
    .addNode("generateCyclePlan", generateCyclePlan)
    .addNode("createProjectsAndTasks", createProjectsAndTasksNode(dependencies))
    .addEdge(START, "loadTeamContext")
    .addEdge("loadTeamContext", "loadMemoryInputs")
    .addEdge("loadMemoryInputs", "generateCyclePlan")
    .addEdge("generateCyclePlan", "createProjectsAndTasks")
    .addEdge("createProjectsAndTasks", END)
    .compile();
}

export async function runCyclePlanningGraph(
  input: CyclePlanningInput,
  dependencies: CyclePlanningDependencies = defaultDependencies
) {
  const graph = buildCyclePlanningGraph(dependencies);
  return graph.invoke({
    teamId: input.teamId,
    startAt: input.startAt,
    endAt: input.endAt,
    requestedCycleType: input.requestedCycleType ?? null,
    requestedGoalSummary: input.requestedGoalSummary ?? null,
    requestedPriorityFocus: input.requestedPriorityFocus ?? null
  });
}
