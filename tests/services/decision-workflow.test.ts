import { describe, expect, it, vi } from "vitest";

import {
  buildDecisionWorkflowThreadId,
  resumeDecisionReviewWorkflow
} from "../../lib/services/decision-workflow";

describe("decision workflow service", () => {
  it("builds a deterministic workflow thread id", () => {
    expect(buildDecisionWorkflowThreadId("decision_123")).toBe(
      "review-feedback:decision:decision_123"
    );
  });

  it("resolves workflow thread from persisted decision instead of caller input", async () => {
    const decision = {
      id: "decision_1",
      teamId: "team_1",
      cycleId: "cycle_1",
      relatedBriefingId: "briefing_1",
      requestedByMemberId: null,
      type: "approval" as const,
      title: "需要老板确认",
      summary: null,
      contextMarkdown: null,
      status: "approved" as const,
      workflowThreadId: "review-feedback:decision:decision_1",
      workflowName: "review-feedback",
      workflowStatus: "awaiting_owner" as const,
      resolution: "approved",
      resolutionPayload: {
        ownerAction: "approve"
      },
      decidedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const getDecisionById = vi.fn().mockResolvedValue(decision);
    const updateDecision = vi.fn().mockResolvedValue(decision);
    const resumeReviewFeedbackGraph = vi.fn().mockResolvedValue({
      state: {
        values: {
          finalDecision: decision
        }
      }
    });

    const result = await resumeDecisionReviewWorkflow(
      {
        decisionId: "decision_1",
        ownerChoice: {
          action: "approve",
          note: "ok"
        }
      },
      {
        getDecisionById,
        updateDecision,
        resumeReviewFeedbackGraph
      } as never
    );

    expect(getDecisionById).toHaveBeenCalledWith("decision_1");
    expect(resumeReviewFeedbackGraph).toHaveBeenCalledWith(
      "review-feedback:decision:decision_1",
      {
        action: "approve",
        note: "ok"
      }
    );
    expect(result.workflow.state.values.finalDecision.id).toBe("decision_1");
  });
});
