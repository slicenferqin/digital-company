import { END, START, StateGraph } from "@langchain/langgraph";

import { createArtifactDraft } from "@/lib/domain/artifact/repository";

import { createCollectSourcesNode } from "./nodes/collect-sources";
import { createSummarizeFindingsNode } from "./nodes/summarize-findings";
import type { ResearchGraphDependencies, ResearchInput } from "./state";
import { ResearchStateAnnotation } from "./state";

const defaultDependencies: ResearchGraphDependencies = {
  providers: {},
  createArtifactDraft
};

export function buildResearchGraph(
  dependencies: ResearchGraphDependencies = defaultDependencies
) {
  return new StateGraph(ResearchStateAnnotation)
    .addNode("collectSources", createCollectSourcesNode(dependencies))
    .addNode("summarizeFindings", createSummarizeFindingsNode(dependencies))
    .addEdge(START, "collectSources")
    .addEdge("collectSources", "summarizeFindings")
    .addEdge("summarizeFindings", END)
    .compile();
}

export async function runResearchGraph(
  input: ResearchInput,
  dependencies: ResearchGraphDependencies
) {
  const graph = buildResearchGraph(dependencies);

  return graph.invoke({
    teamId: input.teamId,
    cycleId: input.cycleId,
    query: input.query,
    providerKey: input.providerKey,
    projectId: input.projectId ?? null,
    taskId: input.taskId ?? null,
    artifactTitle: input.artifactTitle ?? null,
    maxResults: input.maxResults ?? 5,
    includeDomains: input.includeDomains ?? []
  });
}
