import type { ProductionGraphDependencies, ProductionState } from "../state";

export function createDraftNode(dependencies: ProductionGraphDependencies) {
  return async function createDraft(state: ProductionState) {
    const draftArtifact = await dependencies.createArtifactDraft({
      teamId: state.teamId,
      cycleId: state.cycleId,
      projectId: state.projectId ?? undefined,
      taskId: state.taskId ?? undefined,
      artifactType: state.artifactType,
      title: state.title,
      authorMemberId: state.authorMemberId ?? undefined,
      reviewerMemberId: state.reviewerMemberId ?? undefined,
      summary: state.summary ?? undefined,
      bodyMarkdown: state.bodyMarkdown
    });

    return {
      draftArtifact,
      versionTrail: [draftArtifact]
    };
  };
}
