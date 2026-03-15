import { describe, expect, it, vi } from "vitest";

import { buildBriefingDedupeKey } from "../../lib/services/briefing-dedupe";
import { buildBriefingGraph } from "../../lib/workflows/briefing/graph";

describe("briefing graph", () => {
  it("creates a briefing, dedupes repeated runs, and promotes escalations to decisions", async () => {
    const eventIds = ["evt_1", "evt_2"];
    const dedupeKey = buildBriefingDedupeKey({
      cycleId: "cycle_1",
      briefingType: "daily",
      sourceEventIds: eventIds
    });

    const createdBriefing = {
      id: "briefing_1",
      teamId: "team_1",
      cycleId: "cycle_1",
      authorMemberId: null,
      type: "daily" as const,
      status: "published" as const,
      title: "今日简报：等待老板确认发布节奏",
      summary: "summary",
      bodyMarkdown: "# briefing",
      highlights: ["等待老板确认发布节奏"],
      risks: ["等待老板确认发布节奏"],
      actionItems: ["关注：等待老板确认发布节奏"],
      metadata: {
        dedupeKey
      },
      publishedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const listBriefingsForCycle = vi
      .fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([createdBriefing]);
    const createBriefing = vi.fn().mockResolvedValue(createdBriefing);
    const initializeDecisionReviewWorkflow = vi.fn().mockResolvedValue({
      threadId: "review-feedback:decision:decision_1"
    });
    const createDecision = vi.fn().mockResolvedValue({
      id: "decision_1",
      teamId: "team_1",
      cycleId: "cycle_1",
      relatedBriefingId: "briefing_1",
      requestedByMemberId: null,
      type: "approval" as const,
      title: "需要老板介入：今日简报：等待老板确认发布节奏",
      summary: "秘书长已将高优先级风险或待决策事项升级为决策对象。",
      contextMarkdown: "关注：等待老板确认发布节奏",
      status: "pending" as const,
      workflowThreadId: null,
      workflowName: null,
      workflowStatus: "not_started" as const,
      resolution: null,
      resolutionPayload: {},
      decidedAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const graph = buildBriefingGraph({
      listBriefingsForCycle,
      createBriefing,
      createDecision,
      initializeDecisionReviewWorkflow
    });

    const input = {
      teamId: "team_1",
      cycleId: "cycle_1",
      type: "daily" as const,
      escalationThreshold: 4,
      events: [
        {
          id: eventIds[0],
          kind: "owner_approval_needed" as const,
          severity: "critical" as const,
          occurredAt: "2026-03-15T11:00:00.000Z",
          title: "等待老板确认发布节奏",
          summary: "编辑要求在发布前确认语气边界。",
          taskId: "task_1"
        },
        {
          id: eventIds[1],
          kind: "task_blocked" as const,
          severity: "warning" as const,
          occurredAt: "2026-03-15T11:05:00.000Z",
          title: "等待老板确认发布节奏",
          summary: "当前主资产无法继续推进。",
          taskId: "task_1"
        }
      ]
    };

    const firstRun = await graph.invoke(input);

    expect(createBriefing).toHaveBeenCalledTimes(1);
    expect(createDecision).toHaveBeenCalledTimes(1);
    expect(initializeDecisionReviewWorkflow).toHaveBeenCalledWith({
      decisionId: "decision_1",
      teamId: "team_1"
    });
    expect(firstRun.deduped).toBe(false);
    expect(firstRun.linkedDecision?.id).toBe("decision_1");

    const secondRun = await graph.invoke(input);

    expect(createBriefing).toHaveBeenCalledTimes(1);
    expect(createDecision).toHaveBeenCalledTimes(1);
    expect(secondRun.deduped).toBe(true);
    expect(secondRun.briefing?.id).toBe("briefing_1");
  });
});
