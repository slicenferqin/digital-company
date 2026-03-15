import type { CyclePlanningDependencies, CyclePlanningState } from "../state";

export function createLoadTeamContextNode(dependencies: CyclePlanningDependencies) {
  return async function loadTeamContext(state: CyclePlanningState) {
    const team = await dependencies.getTeamById(state.teamId);

    if (!team) {
      throw new Error(`Team not found: ${state.teamId}`);
    }

    const members = await dependencies.listMembersByTeamId(state.teamId);

    return {
      team,
      members
    };
  };
}
