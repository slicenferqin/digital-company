import type { CyclePlanningDependencies, CyclePlanningState } from "../state";

export function createLoadMemoryInputsNode(dependencies: CyclePlanningDependencies) {
  return async function loadMemoryInputs(state: CyclePlanningState) {
    const memoryInputs = await dependencies.fetchMemoryInputsForPlanning(state.teamId);

    return {
      memoryInputs
    };
  };
}
