import { describe, expect, it } from "vitest";

import {
  normalizeWorkflowNodeCosts,
  summarizeWorkflowCosts
} from "../../lib/observability/cost-tracker";
import { computeWorkflowOverviewMetrics } from "../../lib/observability/workflow-metrics";

describe("observability cost tracker", () => {
  it("aggregates cost by graph and metric", () => {
    const entries = [
      ...normalizeWorkflowNodeCosts("research", [
        {
          nodeKey: "collect_sources",
          provider: "tavily",
          metric: "credits",
          amount: 2
        },
        {
          nodeKey: "summarize_findings",
          provider: "local",
          metric: "usd",
          amount: 0
        }
      ]),
      ...normalizeWorkflowNodeCosts("production", [
        {
          nodeKey: "review_draft",
          provider: "local",
          metric: "requests",
          amount: 1
        }
      ])
    ];

    const summary = summarizeWorkflowCosts(entries);

    expect(summary.research.totalCredits).toBe(2);
    expect(summary.research.totalUsd).toBe(0);
    expect(summary.production.totalRequests).toBe(1);
    expect(summary.briefing.totalUsd).toBe(0);
  });

  it("computes the core workflow overview metrics", () => {
    const metrics = computeWorkflowOverviewMetrics({
      cycles: [
        {
          id: "cycle_1",
          status: "completed",
          startAt: new Date("2026-03-01T00:00:00.000Z"),
          updatedAt: new Date("2026-03-02T00:00:00.000Z")
        },
        {
          id: "cycle_2",
          status: "active",
          startAt: new Date("2026-03-08T00:00:00.000Z"),
          updatedAt: new Date("2026-03-08T12:00:00.000Z")
        }
      ],
      artifacts: [
        {
          id: "artifact_v1",
          cycleId: "cycle_1",
          title: "旗舰长文",
          artifactType: "article_draft",
          version: 1,
          status: "rejected"
        },
        {
          id: "artifact_v2",
          cycleId: "cycle_1",
          title: "旗舰长文",
          artifactType: "article_draft",
          version: 2,
          status: "approved"
        },
        {
          id: "artifact_social",
          cycleId: "cycle_2",
          title: "短内容",
          artifactType: "social_post",
          version: 1,
          status: "published"
        }
      ],
      decisions: [
        {
          id: "decision_1",
          cycleId: "cycle_1",
          relatedBriefingId: "briefing_1",
          status: "approved"
        },
        {
          id: "decision_2",
          cycleId: "cycle_2",
          relatedBriefingId: null,
          status: "pending"
        }
      ],
      briefings: [
        {
          id: "briefing_1",
          cycleId: "cycle_1",
          type: "daily"
        },
        {
          id: "briefing_2",
          cycleId: "cycle_2",
          type: "daily"
        }
      ]
    });

    expect(metrics.cycleLeadTimeHours).toBe(24);
    expect(metrics.artifactPassRate).toBe(0.67);
    expect(metrics.ownerInterventionRate).toBe(1);
    expect(metrics.averageRevisionRounds).toBe(0.5);
    expect(metrics.escalationFrequency).toBe(0.5);
    expect(metrics.workflowRecoveryFailures).toBe(1);
  });
});
