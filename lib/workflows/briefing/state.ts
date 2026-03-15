import { Annotation } from "@langchain/langgraph";

import type { Briefing } from "@/lib/domain/briefing/types";
import type { Decision } from "@/lib/domain/decision/types";

const replaceReducer = <T>(defaultValue: T) =>
  Annotation<T>({
    reducer: (_, next) => next,
    default: () => defaultValue
  });

const replaceArrayReducer = <T>() =>
  Annotation<T[]>({
    reducer: (_, next) => next,
    default: () => []
  });

export type BriefingEventSeverity = "info" | "warning" | "critical";
export type BriefingEventKind =
  | "task_blocked"
  | "task_completed"
  | "artifact_ready"
  | "owner_approval_needed"
  | "risk_detected"
  | "feedback_received";

export interface BriefingEvent {
  id: string;
  kind: BriefingEventKind;
  severity: BriefingEventSeverity;
  occurredAt: string;
  title: string;
  summary: string;
  taskId?: string;
  artifactId?: string;
  memberId?: string;
  metadata?: Record<string, unknown>;
}

export interface BriefingCluster {
  clusterKey: string;
  title: string;
  severity: BriefingEventSeverity;
  eventCount: number;
  sourceEventIds: string[];
  summaryLines: string[];
  escalationScore: number;
  requiresOwnerDecision: boolean;
}

export interface BriefingInput {
  teamId: string;
  cycleId: string;
  type?: "daily" | "weekly" | "cycle" | "escalation" | "decision";
  events: BriefingEvent[];
  escalationThreshold?: number;
}

export const BriefingStateAnnotation = Annotation.Root({
  teamId: Annotation<string>,
  cycleId: Annotation<string>,
  type: Annotation<"daily" | "weekly" | "cycle" | "escalation" | "decision">,
  events: replaceArrayReducer<BriefingEvent>(),
  escalationThreshold: replaceReducer<number>(5),
  clusters: replaceArrayReducer<BriefingCluster>(),
  dedupeKey: replaceReducer<string | null>(null),
  briefing: replaceReducer<Briefing | null>(null),
  linkedDecision: replaceReducer<Decision | null>(null),
  deduped: replaceReducer<boolean>(false)
});

export type BriefingState = typeof BriefingStateAnnotation.State;

export interface BriefingGraphDependencies {
  listBriefingsForCycle: typeof import("@/lib/domain/briefing/repository").listBriefingsForCycle;
  createBriefing: typeof import("@/lib/domain/briefing/repository").createBriefing;
  createDecision: typeof import("@/lib/domain/decision/repository").createDecision;
  initializeDecisionReviewWorkflow: typeof import("@/lib/services/decision-workflow").initializeDecisionReviewWorkflow;
}
