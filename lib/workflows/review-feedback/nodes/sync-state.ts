import type { ReviewFeedbackDependencies, ReviewFeedbackState } from "../state";

export function createSyncStateNode(dependencies: ReviewFeedbackDependencies) {
  return async function syncState(state: ReviewFeedbackState) {
    const decisionSnapshot = await dependencies.getDecisionById(state.decisionId);

    if (!decisionSnapshot) {
      throw new Error(`Decision not found: ${state.decisionId}`);
    }

    return {
      decisionSnapshot
    };
  };
}
