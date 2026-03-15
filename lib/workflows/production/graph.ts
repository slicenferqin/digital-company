import { END, START, StateGraph } from "@langchain/langgraph";

import { createArtifactDraft } from "@/lib/domain/artifact/repository";
import { applyDraftReviewResult } from "@/lib/services/artifact-versioning";

import { createDraftNode } from "./nodes/create-draft";
import { createReviewDraftNode } from "./nodes/review-draft";
import { createVersionArtifactNode } from "./nodes/version-artifact";
import type { ProductionGraphDependencies, ProductionInput } from "./state";
import { ProductionStateAnnotation } from "./state";

export function buildProductionGraph(dependencies: ProductionGraphDependencies) {
  return new StateGraph(ProductionStateAnnotation)
    .addNode("createDraft", createDraftNode(dependencies))
    .addNode("reviewDraft", createReviewDraftNode(dependencies))
    .addNode("versionArtifact", createVersionArtifactNode(dependencies))
    .addEdge(START, "createDraft")
    .addEdge("createDraft", "reviewDraft")
    .addEdge("reviewDraft", "versionArtifact")
    .addEdge("versionArtifact", END)
    .compile();
}

export async function runProductionGraph(
  input: ProductionInput,
  dependencies: ProductionGraphDependencies
) {
  const graph = buildProductionGraph(dependencies);

  return graph.invoke({
    teamId: input.teamId,
    cycleId: input.cycleId,
    artifactType: input.artifactType,
    title: input.title,
    bodyMarkdown: input.bodyMarkdown,
    summary: input.summary ?? null,
    projectId: input.projectId ?? null,
    taskId: input.taskId ?? null,
    authorMemberId: input.authorMemberId ?? null,
    reviewerMemberId: input.reviewerMemberId ?? null
  });
}

export const defaultProductionDependencies = {
  createArtifactDraft,
  applyDraftReviewResult
};
