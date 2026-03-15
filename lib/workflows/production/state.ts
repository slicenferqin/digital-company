import { Annotation } from "@langchain/langgraph";

import type {
  Artifact,
  ArtifactReview,
  ArtifactType
} from "@/lib/domain/artifact/types";
import type { DraftReviewResult } from "@/lib/services/artifact-versioning";

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

export interface ProductionInput {
  teamId: string;
  cycleId: string;
  artifactType: ArtifactType;
  title: string;
  bodyMarkdown: string;
  summary?: string;
  projectId?: string;
  taskId?: string;
  authorMemberId?: string;
  reviewerMemberId?: string;
}

export interface DraftReviewer {
  reviewDraft(input: {
    artifact: Artifact;
    bodyMarkdown: string;
    summary: string | null;
  }): Promise<DraftReviewResult>;
}

export const ProductionStateAnnotation = Annotation.Root({
  teamId: Annotation<string>,
  cycleId: Annotation<string>,
  artifactType: Annotation<ArtifactType>,
  title: Annotation<string>,
  bodyMarkdown: Annotation<string>,
  summary: replaceReducer<string | null>(null),
  projectId: replaceReducer<string | null>(null),
  taskId: replaceReducer<string | null>(null),
  authorMemberId: replaceReducer<string | null>(null),
  reviewerMemberId: replaceReducer<string | null>(null),
  draftArtifact: replaceReducer<Artifact | null>(null),
  reviewResult: replaceReducer<DraftReviewResult | null>(null),
  reviewRecord: replaceReducer<ArtifactReview | null>(null),
  finalArtifact: replaceReducer<Artifact | null>(null),
  versionTrail: replaceArrayReducer<Artifact>()
});

export type ProductionState = typeof ProductionStateAnnotation.State;

export interface ProductionGraphDependencies {
  createArtifactDraft: typeof import("@/lib/domain/artifact/repository").createArtifactDraft;
  reviewer: DraftReviewer;
  applyDraftReviewResult: typeof import("@/lib/services/artifact-versioning").applyDraftReviewResult;
}
