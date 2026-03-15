import { interrupt } from "@langchain/langgraph";

import type { ReviewFeedbackState } from "../state";

export async function interruptForOwner(state: ReviewFeedbackState) {
  if (!state.decisionSnapshot) {
    throw new Error("Decision snapshot must be loaded before interrupting");
  }

  if (state.decisionSnapshot.status !== "pending") {
    return {
      ownerChoice: {
        action:
          state.decisionSnapshot.status === "approved"
            ? "approve"
            : state.decisionSnapshot.resolution === "revise_requested"
              ? "revise"
              : "reject",
        note: state.decisionSnapshot.resolution ?? undefined
      }
    };
  }

  const ownerChoice = interrupt<{
    decisionId: string;
    title: string;
    summary: string | null;
    status: string;
  }, { action: "approve" | "reject" | "revise"; note?: string }>({
    decisionId: state.decisionSnapshot.id,
    title: state.decisionSnapshot.title,
    summary: state.decisionSnapshot.summary,
    status: state.decisionSnapshot.status
  });

  return {
    ownerChoice
  };
}
