import { describe, expect, it, vi } from "vitest";
import { Command, MemorySaver } from "@langchain/langgraph";

import { interruptForOwner } from "../../lib/workflows/review-feedback/nodes/interrupt-for-owner";
import { createSyncStateNode } from "../../lib/workflows/review-feedback/nodes/sync-state";
import { ReviewFeedbackStateAnnotation } from "../../lib/workflows/review-feedback/state";
import { StateGraph, START, END } from "@langchain/langgraph";

describe("review feedback graph", () => {
  it("interrupts for owner input and resumes without replaying completed nodes", async () => {
    const getDecisionById = vi
      .fn()
      .mockResolvedValueOnce({
        id: "decision_1",
        teamId: "team_1",
        cycleId: "cycle_1",
        relatedBriefingId: "briefing_1",
        requestedByMemberId: null,
        type: "approval",
        title: "需要老板确认",
        summary: "请决定是否推进",
        contextMarkdown: null,
        status: "pending",
        resolution: null,
        resolutionPayload: {},
        decidedAt: null,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .mockResolvedValueOnce({
        id: "decision_1",
        teamId: "team_1",
        cycleId: "cycle_1",
        relatedBriefingId: "briefing_1",
        requestedByMemberId: null,
        type: "approval",
        title: "需要老板确认",
        summary: "请决定是否推进",
        contextMarkdown: null,
        status: "approved",
        resolution: "approved",
        resolutionPayload: {
          ownerAction: "approve"
        },
        decidedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });

    const graph = new StateGraph(ReviewFeedbackStateAnnotation)
      .addNode("syncStateBeforeInterrupt", createSyncStateNode({ getDecisionById }))
      .addNode("interruptForOwner", interruptForOwner)
      .addNode("syncStateAfterResume", createSyncStateNode({ getDecisionById }))
      .addNode("finalize", async (state) => ({
        finalDecision: state.decisionSnapshot
      }))
      .addEdge(START, "syncStateBeforeInterrupt")
      .addEdge("syncStateBeforeInterrupt", "interruptForOwner")
      .addEdge("interruptForOwner", "syncStateAfterResume")
      .addEdge("syncStateAfterResume", "finalize")
      .addEdge("finalize", END)
      .compile({
        checkpointer: new MemorySaver()
      });

    const config = {
      configurable: {
        thread_id: "decision-thread-1"
      }
    };

    const firstChunks: unknown[] = [];

    for await (const chunk of await graph.stream(
      {
        teamId: "team_1",
        decisionId: "decision_1"
      },
      config
    )) {
      firstChunks.push(chunk);
    }

    expect(getDecisionById).toHaveBeenCalledTimes(1);
    expect(
      firstChunks.some(
        (chunk) =>
          typeof chunk === "object" &&
          chunk !== null &&
          "__interrupt__" in (chunk as Record<string, unknown>)
      )
    ).toBe(true);

    const resumedChunks: unknown[] = [];

    for await (const chunk of await graph.stream(
      new Command({
        resume: {
          action: "approve",
          note: "ok"
        }
      }),
      config
    )) {
      resumedChunks.push(chunk);
    }

    expect(getDecisionById).toHaveBeenCalledTimes(2);

    const finalState = await graph.getState(config);
    const values = finalState.values as Record<string, unknown>;
    const finalDecision = values.finalDecision as { status?: string } | undefined;

    expect(finalDecision?.status).toBe("approved");
    expect(resumedChunks.length).toBeGreaterThan(0);
  });
});
