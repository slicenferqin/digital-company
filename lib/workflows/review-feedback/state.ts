import { Annotation } from "@langchain/langgraph";

import type { Decision } from "@/lib/domain/decision/types";

const replaceReducer = <T>(defaultValue: T) =>
  Annotation<T>({
    reducer: (_, next) => next,
    default: () => defaultValue
  });

export type OwnerChoiceAction = "approve" | "reject" | "revise";

export interface OwnerChoice {
  action: OwnerChoiceAction;
  note?: string;
}

export interface ReviewFeedbackInput {
  teamId: string;
  decisionId: string;
}

export const ReviewFeedbackStateAnnotation = Annotation.Root({
  teamId: Annotation<string>,
  decisionId: Annotation<string>,
  decisionSnapshot: replaceReducer<Decision | null>(null),
  ownerChoice: replaceReducer<OwnerChoice | null>(null),
  finalDecision: replaceReducer<Decision | null>(null)
});

export type ReviewFeedbackState = typeof ReviewFeedbackStateAnnotation.State;

export interface ReviewFeedbackDependencies {
  getDecisionById: typeof import("@/lib/domain/decision/repository").getDecisionById;
}
