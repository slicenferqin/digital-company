export type DecisionType = "approval" | "priority" | "policy" | "publish" | "other";
export type DecisionStatus = "pending" | "approved" | "rejected" | "superseded";
export type DecisionWorkflowStatus =
  | "not_started"
  | "awaiting_owner"
  | "resumed"
  | "completed"
  | "failed";

export interface Decision {
  id: string;
  teamId: string;
  cycleId: string | null;
  relatedBriefingId: string | null;
  requestedByMemberId: string | null;
  type: DecisionType;
  title: string;
  summary: string | null;
  contextMarkdown: string | null;
  status: DecisionStatus;
  workflowThreadId: string | null;
  workflowName: string | null;
  workflowStatus: DecisionWorkflowStatus;
  resolution: string | null;
  resolutionPayload: Record<string, unknown>;
  decidedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDecisionInput {
  teamId: string;
  cycleId?: string;
  relatedBriefingId?: string;
  requestedByMemberId?: string;
  type?: DecisionType;
  title: string;
  summary?: string;
  contextMarkdown?: string;
  workflowThreadId?: string;
  workflowName?: string;
  workflowStatus?: DecisionWorkflowStatus;
}

export interface UpdateDecisionInput {
  decisionId: string;
  status?: DecisionStatus;
  workflowThreadId?: string | null;
  workflowName?: string | null;
  workflowStatus?: DecisionWorkflowStatus;
  resolution?: string;
  resolutionPayload?: Record<string, unknown>;
  decidedAt?: Date;
}
