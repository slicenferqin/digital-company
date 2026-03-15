import type { BriefingCluster, BriefingEventSeverity, BriefingState } from "../state";

function severityScore(severity: BriefingEventSeverity) {
  switch (severity) {
    case "critical":
      return 3;
    case "warning":
      return 2;
    default:
      return 1;
  }
}

function maxSeverity(
  left: BriefingEventSeverity,
  right: BriefingEventSeverity
): BriefingEventSeverity {
  return severityScore(left) >= severityScore(right) ? left : right;
}

export async function mapTaskEvents(state: BriefingState) {
  const buckets = new Map<string, BriefingCluster>();

  for (const event of state.events) {
    const clusterKey = event.taskId ?? event.artifactId ?? `${event.kind}:${event.title}`;
    const existing = buckets.get(clusterKey);
    const increment = severityScore(event.severity);
    const requiresOwnerDecision =
      event.kind === "owner_approval_needed" || event.severity === "critical";

    if (!existing) {
      buckets.set(clusterKey, {
        clusterKey,
        title: event.title,
        severity: event.severity,
        eventCount: 1,
        sourceEventIds: [event.id],
        summaryLines: [event.summary],
        escalationScore: increment,
        requiresOwnerDecision
      });
      continue;
    }

    existing.severity = maxSeverity(existing.severity, event.severity);
    existing.eventCount += 1;
    existing.sourceEventIds.push(event.id);
    existing.summaryLines.push(event.summary);
    existing.escalationScore += increment;
    existing.requiresOwnerDecision = existing.requiresOwnerDecision || requiresOwnerDecision;
  }

  return {
    clusters: [...buckets.values()].sort((left, right) => right.escalationScore - left.escalationScore)
  };
}
