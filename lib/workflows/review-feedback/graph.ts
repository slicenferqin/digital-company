import { Command, END, MemorySaver, START, StateGraph } from "@langchain/langgraph";
import type { BaseCheckpointSaver } from "@langchain/langgraph";

import { getDecisionById } from "@/lib/domain/decision/repository";
import { getDurableWorkflowCheckpointSaver } from "@/lib/workflows/runtime/checkpoint-saver";

import { interruptForOwner } from "./nodes/interrupt-for-owner";
import { createSyncStateNode } from "./nodes/sync-state";
import type {
  OwnerChoice,
  ReviewFeedbackDependencies,
  ReviewFeedbackInput
} from "./state";
import { ReviewFeedbackStateAnnotation } from "./state";

const defaultDependencies: ReviewFeedbackDependencies = {
  getDecisionById
};

const durableCheckpointer = getDurableWorkflowCheckpointSaver("review-feedback");

export function buildReviewFeedbackGraph(
  dependencies: ReviewFeedbackDependencies = defaultDependencies,
  options?: {
    checkpointer?: BaseCheckpointSaver | MemorySaver;
  }
) {
  return new StateGraph(ReviewFeedbackStateAnnotation)
    .addNode("syncStateBeforeInterrupt", createSyncStateNode(dependencies))
    .addNode("interruptForOwner", interruptForOwner)
    .addNode("syncStateAfterResume", createSyncStateNode(dependencies))
    .addNode("finalize", async (state) => ({
      finalDecision: state.decisionSnapshot
    }))
    .addEdge(START, "syncStateBeforeInterrupt")
    .addEdge("syncStateBeforeInterrupt", "interruptForOwner")
    .addEdge("interruptForOwner", "syncStateAfterResume")
    .addEdge("syncStateAfterResume", "finalize")
    .addEdge("finalize", END)
    .compile({
      checkpointer: options?.checkpointer ?? durableCheckpointer
    });
}

export async function startReviewFeedbackGraph(
  input: ReviewFeedbackInput,
  threadId: string,
  dependencies: ReviewFeedbackDependencies = defaultDependencies,
  options?: {
    checkpointer?: BaseCheckpointSaver | MemorySaver;
  }
) {
  const graph = buildReviewFeedbackGraph(dependencies, options);
  const chunks: unknown[] = [];

  for await (const chunk of await graph.stream(
    {
      teamId: input.teamId,
      decisionId: input.decisionId
    },
    {
      configurable: {
        thread_id: threadId
      }
    }
  )) {
    chunks.push(chunk);
  }

  return {
    chunks,
    state: await graph.getState({
      configurable: {
        thread_id: threadId
      }
    })
  };
}

export async function resumeReviewFeedbackGraph(
  threadId: string,
  ownerChoice: OwnerChoice,
  dependencies: ReviewFeedbackDependencies = defaultDependencies,
  options?: {
    checkpointer?: BaseCheckpointSaver | MemorySaver;
  }
) {
  const graph = buildReviewFeedbackGraph(dependencies, options);
  const chunks: unknown[] = [];

  for await (const chunk of await graph.stream(new Command({ resume: ownerChoice }), {
    configurable: {
      thread_id: threadId
    }
  })) {
    chunks.push(chunk);
  }

  return {
    chunks,
    state: await graph.getState({
      configurable: {
        thread_id: threadId
      }
    })
  };
}
