import type { ProductionGraphDependencies, ProductionState } from "../state";

export function createVersionArtifactNode(dependencies: ProductionGraphDependencies) {
  return async function versionArtifact(state: ProductionState) {
    if (!state.draftArtifact || !state.reviewResult) {
      throw new Error("Draft artifact and review result are required before versioning");
    }

    const result = await dependencies.applyDraftReviewResult(
      state.draftArtifact,
      state.reviewResult
    );

    return {
      finalArtifact: result.finalArtifact,
      versionTrail: result.createdVersion
        ? [state.draftArtifact, result.createdVersion]
        : [result.finalArtifact]
    };
  };
}
