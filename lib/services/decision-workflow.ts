import { getDecisionById, updateDecision } from "@/lib/domain/decision/repository";
import { resumeReviewFeedbackGraph, startReviewFeedbackGraph } from "@/lib/workflows/review-feedback/graph";
import type { OwnerChoice } from "@/lib/workflows/review-feedback/state";

const REVIEW_FEEDBACK_WORKFLOW_NAME = "review-feedback";

type DecisionWorkflowDependencies = {
  getDecisionById: typeof getDecisionById;
  updateDecision: typeof updateDecision;
  startReviewFeedbackGraph: typeof startReviewFeedbackGraph;
  resumeReviewFeedbackGraph: typeof resumeReviewFeedbackGraph;
};

const defaultDependencies: DecisionWorkflowDependencies = {
  getDecisionById,
  updateDecision,
  startReviewFeedbackGraph,
  resumeReviewFeedbackGraph
};

export function buildDecisionWorkflowThreadId(decisionId: string) {
  return `review-feedback:decision:${decisionId}`;
}

export async function initializeDecisionReviewWorkflow(input: {
  decisionId: string;
  teamId: string;
}, dependencies: DecisionWorkflowDependencies = defaultDependencies) {
  const threadId = buildDecisionWorkflowThreadId(input.decisionId);

  await dependencies.updateDecision({
    decisionId: input.decisionId,
    workflowThreadId: threadId,
    workflowName: REVIEW_FEEDBACK_WORKFLOW_NAME,
    workflowStatus: "awaiting_owner"
  });

  const workflow = await dependencies.startReviewFeedbackGraph(
    {
      teamId: input.teamId,
      decisionId: input.decisionId
    },
    threadId
  );

  return {
    threadId,
    workflow
  };
}

export async function resumeDecisionReviewWorkflow(input: {
  decisionId: string;
  ownerChoice: OwnerChoice;
}, dependencies: DecisionWorkflowDependencies = defaultDependencies) {
  const decision = await dependencies.getDecisionById(input.decisionId);

  if (!decision) {
    throw new Error(`Decision not found: ${input.decisionId}`);
  }

  if (!decision.workflowThreadId) {
    throw new Error(`Decision has no workflow thread id: ${input.decisionId}`);
  }

  await dependencies.updateDecision({
    decisionId: input.decisionId,
    workflowStatus: "resumed"
  });

  try {
    const workflow = await dependencies.resumeReviewFeedbackGraph(
      decision.workflowThreadId,
      input.ownerChoice
    );

    await dependencies.updateDecision({
      decisionId: input.decisionId,
      workflowStatus: "completed"
    });

    return {
      decision: await dependencies.getDecisionById(input.decisionId),
      workflow
    };
  } catch (error) {
    await dependencies.updateDecision({
      decisionId: input.decisionId,
      workflowStatus: "failed"
    });

    throw error;
  }
}
