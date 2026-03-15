export type ArtifactType =
  | "strategy_card"
  | "topic_brief"
  | "research_summary"
  | "article_draft"
  | "social_post"
  | "retrospective"
  | "memo"
  | "other";
export type ArtifactStatus =
  | "draft"
  | "in_review"
  | "approved"
  | "rejected"
  | "published"
  | "archived";
export type ArtifactReviewStatus = "pending" | "approved" | "changes_requested" | "rejected";
export type FeedbackSource = "owner" | "editor" | "system" | "performance";
export type FeedbackSignalType = "quality" | "preference" | "correction" | "positive" | "negative";

export interface Artifact {
  id: string;
  teamId: string;
  cycleId: string;
  projectId: string | null;
  taskId: string | null;
  artifactType: ArtifactType;
  title: string;
  version: number;
  status: ArtifactStatus;
  authorMemberId: string | null;
  reviewerMemberId: string | null;
  summary: string | null;
  bodyMarkdown: string | null;
  storageUri: string | null;
  metadata: Record<string, unknown>;
  reviewedAt: Date | null;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ArtifactReview {
  id: string;
  artifactId: string;
  teamId: string;
  reviewerMemberId: string | null;
  status: ArtifactReviewStatus;
  feedbackSummary: string | null;
  checklist: Record<string, unknown>;
  reviewNotesMarkdown: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
}

export interface FeedbackSignal {
  id: string;
  teamId: string;
  cycleId: string | null;
  taskId: string | null;
  artifactId: string | null;
  memberId: string | null;
  source: FeedbackSource;
  signalType: FeedbackSignalType;
  summary: string;
  payload: Record<string, unknown>;
  weight: number;
  createdAt: Date;
}

export interface CreateArtifactDraftInput {
  teamId: string;
  cycleId: string;
  projectId?: string;
  taskId?: string;
  artifactType: ArtifactType;
  title: string;
  authorMemberId?: string;
  reviewerMemberId?: string;
  summary?: string;
  bodyMarkdown?: string;
  storageUri?: string;
  metadata?: Record<string, unknown>;
}

export interface CreateArtifactVersionInput extends CreateArtifactDraftInput {
  version: number;
  status?: ArtifactStatus;
}

export interface CreateArtifactReviewInput {
  artifactId: string;
  teamId: string;
  reviewerMemberId?: string;
  status?: ArtifactReviewStatus;
  feedbackSummary?: string;
  checklist?: Record<string, unknown>;
  reviewNotesMarkdown?: string;
  reviewedAt?: Date;
}

export interface WriteFeedbackSignalInput {
  teamId: string;
  cycleId?: string;
  taskId?: string;
  artifactId?: string;
  memberId?: string;
  source: FeedbackSource;
  signalType: FeedbackSignalType;
  summary: string;
  payload?: Record<string, unknown>;
  weight?: number;
}

export interface UpdateArtifactStatusInput {
  artifactId: string;
  status: ArtifactStatus;
  metadata?: Record<string, unknown>;
  reviewedAt?: Date | null;
  publishedAt?: Date | null;
}
