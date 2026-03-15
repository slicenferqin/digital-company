import {
  createArtifactReview,
  createArtifactVersion,
  updateArtifactStatus
} from "@/lib/domain/artifact/repository";
import type { Artifact, ArtifactReviewStatus } from "@/lib/domain/artifact/types";

export type DraftReviewVerdict = "approved" | "changes_requested";

export interface DraftReviewResult {
  verdict: DraftReviewVerdict;
  blockingIssues: string[];
  comments: string[];
  summary?: string;
  revisedBodyMarkdown?: string;
}

type ArtifactVersioningDependencies = {
  createArtifactReview: typeof createArtifactReview;
  createArtifactVersion: typeof createArtifactVersion;
  updateArtifactStatus: typeof updateArtifactStatus;
};

const defaultDependencies: ArtifactVersioningDependencies = {
  createArtifactReview,
  createArtifactVersion,
  updateArtifactStatus
};

function reviewStatusFromVerdict(verdict: DraftReviewVerdict): ArtifactReviewStatus {
  return verdict === "approved" ? "approved" : "changes_requested";
}

export async function applyDraftReviewResult(
  artifact: Artifact,
  reviewResult: DraftReviewResult,
  dependencies: ArtifactVersioningDependencies = defaultDependencies
) {
  await dependencies.createArtifactReview({
    artifactId: artifact.id,
    teamId: artifact.teamId,
    reviewerMemberId: artifact.reviewerMemberId ?? undefined,
    status: reviewStatusFromVerdict(reviewResult.verdict),
    feedbackSummary: reviewResult.summary ?? reviewResult.comments.join("；"),
    checklist: {
      blockingIssues: reviewResult.blockingIssues,
      comments: reviewResult.comments
    },
    reviewNotesMarkdown: reviewResult.comments.join("\n")
  });

  if (reviewResult.verdict === "approved") {
    const approvedArtifact = await dependencies.updateArtifactStatus({
      artifactId: artifact.id,
      status: "approved",
      reviewedAt: new Date(),
      metadata: {
        ...artifact.metadata,
        review: {
          verdict: reviewResult.verdict,
          blockingIssues: reviewResult.blockingIssues,
          comments: reviewResult.comments
        }
      }
    });

    return {
      review: reviewResult,
      finalArtifact: approvedArtifact ?? artifact,
      createdVersion: null
    };
  }

  await dependencies.updateArtifactStatus({
    artifactId: artifact.id,
    status: "rejected",
    reviewedAt: new Date(),
    metadata: {
      ...artifact.metadata,
      review: {
        verdict: reviewResult.verdict,
        blockingIssues: reviewResult.blockingIssues,
        comments: reviewResult.comments
      }
    }
  });

  const revisedArtifact = await dependencies.createArtifactVersion({
    teamId: artifact.teamId,
    cycleId: artifact.cycleId,
    projectId: artifact.projectId ?? undefined,
    taskId: artifact.taskId ?? undefined,
    artifactType: artifact.artifactType,
    title: artifact.title,
    authorMemberId: artifact.authorMemberId ?? undefined,
    reviewerMemberId: artifact.reviewerMemberId ?? undefined,
    summary: reviewResult.summary ?? artifact.summary ?? undefined,
    bodyMarkdown: reviewResult.revisedBodyMarkdown ?? artifact.bodyMarkdown ?? undefined,
    storageUri: artifact.storageUri ?? undefined,
    version: artifact.version + 1,
    status: "approved",
    metadata: {
      ...artifact.metadata,
      versionLineage: {
        previousArtifactId: artifact.id,
        parentVersion: artifact.version,
        currentVersion: artifact.version + 1
      },
      review: {
        verdict: reviewResult.verdict,
        blockingIssues: reviewResult.blockingIssues,
        comments: reviewResult.comments
      }
    }
  });

  return {
    review: reviewResult,
    finalArtifact: revisedArtifact,
    createdVersion: revisedArtifact
  };
}
