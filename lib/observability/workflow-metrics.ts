type MetricCycle = {
  id: string;
  status: string;
  startAt: Date;
  updatedAt: Date;
};

type MetricArtifact = {
  id: string;
  cycleId: string;
  title: string;
  artifactType: string;
  version: number;
  status: string;
};

type MetricDecision = {
  id: string;
  cycleId: string | null;
  relatedBriefingId: string | null;
  status: string;
};

type MetricBriefing = {
  id: string;
  cycleId: string | null;
  type: string;
};

export interface WorkflowOverviewMetrics {
  cycleLeadTimeHours: number;
  artifactPassRate: number;
  ownerInterventionRate: number;
  averageRevisionRounds: number;
  escalationFrequency: number;
  workflowRecoveryFailures: number;
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}

export function computeWorkflowOverviewMetrics(input: {
  cycles: MetricCycle[];
  artifacts: MetricArtifact[];
  decisions: MetricDecision[];
  briefings: MetricBriefing[];
}): WorkflowOverviewMetrics {
  const completedCycles = input.cycles.filter((cycle) => cycle.status === "completed");
  const cycleLeadTimeHours =
    completedCycles.length === 0
      ? 0
      : round(
          completedCycles.reduce((sum, cycle) => {
            return sum + (cycle.updatedAt.getTime() - cycle.startAt.getTime()) / (1000 * 60 * 60);
          }, 0) / completedCycles.length
        );

  const passedArtifacts = input.artifacts.filter((artifact) =>
    ["approved", "published"].includes(artifact.status)
  ).length;
  const artifactPassRate =
    input.artifacts.length === 0 ? 0 : round(passedArtifacts / input.artifacts.length);

  const cyclesWithOwnerIntervention = new Set(
    input.decisions.filter((decision) => decision.cycleId).map((decision) => decision.cycleId as string)
  );
  const ownerInterventionRate =
    input.cycles.length === 0
      ? 0
      : round(cyclesWithOwnerIntervention.size / input.cycles.length);

  const artifactVersionMap = new Map<string, number>();
  for (const artifact of input.artifacts) {
    const key = `${artifact.cycleId}:${artifact.artifactType}:${artifact.title}`;
    const current = artifactVersionMap.get(key) ?? 0;
    artifactVersionMap.set(key, Math.max(current, artifact.version));
  }
  const revisionRounds = [...artifactVersionMap.values()].map((version) => Math.max(version - 1, 0));
  const averageRevisionRounds =
    revisionRounds.length === 0
      ? 0
      : round(revisionRounds.reduce((sum, value) => sum + value, 0) / revisionRounds.length);

  const escalationDecisionCount = input.decisions.filter((decision) => decision.relatedBriefingId).length;
  const escalationFrequency =
    input.briefings.length === 0 ? 0 : round(escalationDecisionCount / input.briefings.length);

  const workflowRecoveryFailures = input.decisions.filter(
    (decision) => decision.status === "pending"
  ).length;

  return {
    cycleLeadTimeHours,
    artifactPassRate,
    ownerInterventionRate,
    averageRevisionRounds,
    escalationFrequency,
    workflowRecoveryFailures
  };
}
