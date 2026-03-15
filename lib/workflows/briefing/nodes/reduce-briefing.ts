import { buildBriefingDedupeKey, findExistingBriefingByDedupeKey } from "@/lib/services/briefing-dedupe";

import type { BriefingGraphDependencies, BriefingState } from "../state";

function renderBriefingBody(state: BriefingState) {
  const lines = [`# ${state.type === "daily" ? "今日简报" : "周期简报"}`, ""];

  for (const cluster of state.clusters) {
    lines.push(`## ${cluster.title}`);
    lines.push(`- 严重程度：${cluster.severity}`);
    lines.push(`- 事件数：${cluster.eventCount}`);

    for (const summaryLine of cluster.summaryLines.slice(0, 5)) {
      lines.push(`- ${summaryLine}`);
    }

    lines.push("");
  }

  return lines.join("\n");
}

export function createReduceBriefingNode(dependencies: BriefingGraphDependencies) {
  return async function reduceBriefing(state: BriefingState) {
    const sourceEventIds = state.clusters.flatMap((cluster) => cluster.sourceEventIds);
    const dedupeKey = buildBriefingDedupeKey({
      cycleId: state.cycleId,
      briefingType: state.type,
      sourceEventIds
    });

    const existingBriefings = await dependencies.listBriefingsForCycle(state.cycleId);
    const existing = findExistingBriefingByDedupeKey(existingBriefings, dedupeKey);

    if (existing) {
      return {
        dedupeKey,
        briefing: existing,
        linkedDecision: null,
        deduped: true
      };
    }

    const topClusters = state.clusters.slice(0, 3);
    const title =
      state.type === "daily"
        ? `今日简报：${topClusters[0]?.title ?? "团队进展"}`
        : `周期简报：${topClusters[0]?.title ?? "团队进展"}`;
    const summary = `本次简报汇总 ${state.clusters.length} 个事件簇，其中 ${state.clusters.filter((cluster) => cluster.severity !== "info").length} 个需要重点关注。`;
    const actionItems = state.clusters
      .filter((cluster) => cluster.requiresOwnerDecision)
      .map((cluster) => `关注：${cluster.title}`);
    const risks = state.clusters
      .filter((cluster) => cluster.severity === "critical" || cluster.severity === "warning")
      .map((cluster) => cluster.title);
    const escalationScore = state.clusters.reduce(
      (sum, cluster) => sum + cluster.escalationScore,
      0
    );

    const briefing = await dependencies.createBriefing({
      teamId: state.teamId,
      cycleId: state.cycleId,
      type: state.type,
      status: "published",
      title,
      summary,
      bodyMarkdown: renderBriefingBody(state),
      highlights: topClusters.map((cluster) => cluster.title),
      risks,
      actionItems,
      metadata: {
        dedupeKey,
        sourceEventIds,
        escalationScore,
        eventCount: state.events.length
      },
      publishedAt: new Date()
    });

    const shouldPromote =
      escalationScore >= state.escalationThreshold ||
      state.clusters.some((cluster) => cluster.requiresOwnerDecision);

    const linkedDecision = shouldPromote
      ? await dependencies.createDecision({
          teamId: state.teamId,
          cycleId: state.cycleId,
          relatedBriefingId: briefing.id,
          type: "approval",
          title: `需要老板介入：${briefing.title}`,
          summary: "秘书长已将高优先级风险或待决策事项升级为决策对象。",
          contextMarkdown: actionItems.join("\n")
        })
      : null;

    return {
      dedupeKey,
      briefing,
      linkedDecision,
      deduped: false
    };
  };
}
