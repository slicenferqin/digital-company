import type { ProductionGraphDependencies, ProductionState } from "../state";

export function createReviewDraftNode(dependencies: ProductionGraphDependencies) {
  return async function reviewDraft(state: ProductionState) {
    if (!state.draftArtifact) {
      throw new Error("Draft artifact must exist before review");
    }

    const reviewResult = await dependencies.reviewer.reviewDraft({
      artifact: state.draftArtifact,
      bodyMarkdown: state.draftArtifact.bodyMarkdown ?? state.bodyMarkdown,
      summary: state.draftArtifact.summary,
      writingGuidelines: state.writingGuidelines,
      reviewGuidelines: state.reviewGuidelines
    });

    return {
      reviewResult
    };
  };
}
