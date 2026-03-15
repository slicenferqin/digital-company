export type DecisionType = "approval" | "priority" | "policy" | "publish" | "other";
export type DecisionStatus = "pending" | "approved" | "rejected" | "superseded";

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
}

export interface UpdateDecisionInput {
  decisionId: string;
  status?: DecisionStatus;
  resolution?: string;
  resolutionPayload?: Record<string, unknown>;
  decidedAt?: Date;
}
