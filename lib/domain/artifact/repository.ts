import { eq } from "drizzle-orm";

import { getDatabase } from "@/lib/db/client";
import { artifactReviews, artifacts, feedbackSignals } from "@/lib/db/schema";

import type {
  Artifact,
  ArtifactReview,
  CreateArtifactDraftInput,
  CreateArtifactReviewInput,
  FeedbackSignal,
  WriteFeedbackSignalInput
} from "./types";

function mapArtifact(row: typeof artifacts.$inferSelect): Artifact {
  return {
    id: row.id,
    teamId: row.teamId,
    cycleId: row.cycleId,
    projectId: row.projectId,
    taskId: row.taskId,
    artifactType: row.artifactType,
    title: row.title,
    version: row.version,
    status: row.status,
    authorMemberId: row.authorMemberId,
    reviewerMemberId: row.reviewerMemberId,
    summary: row.summary,
    bodyMarkdown: row.bodyMarkdown,
    storageUri: row.storageUri,
    metadata: row.metadata,
    reviewedAt: row.reviewedAt,
    publishedAt: row.publishedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}

function mapArtifactReview(row: typeof artifactReviews.$inferSelect): ArtifactReview {
  return {
    id: row.id,
    artifactId: row.artifactId,
    teamId: row.teamId,
    reviewerMemberId: row.reviewerMemberId,
    status: row.status,
    feedbackSummary: row.feedbackSummary,
    checklist: row.checklist,
    reviewNotesMarkdown: row.reviewNotesMarkdown,
    reviewedAt: row.reviewedAt,
    createdAt: row.createdAt
  };
}

function mapFeedbackSignal(row: typeof feedbackSignals.$inferSelect): FeedbackSignal {
  return {
    id: row.id,
    teamId: row.teamId,
    cycleId: row.cycleId,
    taskId: row.taskId,
    artifactId: row.artifactId,
    memberId: row.memberId,
    source: row.source,
    signalType: row.signalType,
    summary: row.summary,
    payload: row.payload,
    weight: row.weight,
    createdAt: row.createdAt
  };
}

export async function createArtifactDraft(input: CreateArtifactDraftInput, database = getDatabase()) {
  const [row] = await database
    .insert(artifacts)
    .values({
      teamId: input.teamId,
      cycleId: input.cycleId,
      projectId: input.projectId ?? null,
      taskId: input.taskId ?? null,
      artifactType: input.artifactType,
      title: input.title,
      version: 1,
      status: "draft",
      authorMemberId: input.authorMemberId ?? null,
      reviewerMemberId: input.reviewerMemberId ?? null,
      summary: input.summary ?? null,
      bodyMarkdown: input.bodyMarkdown ?? null,
      storageUri: input.storageUri ?? null,
      metadata: input.metadata ?? {}
    })
    .returning();

  return mapArtifact(row);
}

export async function createArtifactReview(input: CreateArtifactReviewInput, database = getDatabase()) {
  const [row] = await database
    .insert(artifactReviews)
    .values({
      artifactId: input.artifactId,
      teamId: input.teamId,
      reviewerMemberId: input.reviewerMemberId ?? null,
      status: input.status ?? "pending",
      feedbackSummary: input.feedbackSummary ?? null,
      checklist: input.checklist ?? {},
      reviewNotesMarkdown: input.reviewNotesMarkdown ?? null,
      reviewedAt: input.reviewedAt ?? null
    })
    .returning();

  return mapArtifactReview(row);
}

export async function writeFeedbackSignal(input: WriteFeedbackSignalInput, database = getDatabase()) {
  const [row] = await database
    .insert(feedbackSignals)
    .values({
      teamId: input.teamId,
      cycleId: input.cycleId ?? null,
      taskId: input.taskId ?? null,
      artifactId: input.artifactId ?? null,
      memberId: input.memberId ?? null,
      source: input.source,
      signalType: input.signalType,
      summary: input.summary,
      payload: input.payload ?? {},
      weight: input.weight ?? 0
    })
    .returning();

  return mapFeedbackSignal(row);
}

export async function listArtifactsForCycle(cycleId: string, database = getDatabase()) {
  const rows = await database.select().from(artifacts).where(eq(artifacts.cycleId, cycleId));
  return rows.map(mapArtifact);
}
