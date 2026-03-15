import { getArtifactById, writeFeedbackSignal } from "@/lib/domain/artifact/repository";
import {
  createPreferenceProfile,
  deactivatePreferenceProfiles,
  listPreferenceProfilesByTeamId
} from "@/lib/domain/team/repository";

import { writeFeedbackLessonToMemory } from "./memory-writeback";

export type ArtifactOwnerFeedbackAction =
  | "approved"
  | "adopted"
  | "published"
  | "reused";

export interface CaptureArtifactFeedbackInput {
  artifactId: string;
  action: ArtifactOwnerFeedbackAction;
  reasonCode?: string;
  note?: string;
  editBehaviorHints?: string[];
}

type FeedbackCaptureDependencies = {
  getArtifactById: typeof getArtifactById;
  writeFeedbackSignal: typeof writeFeedbackSignal;
  listPreferenceProfilesByTeamId: typeof listPreferenceProfilesByTeamId;
  deactivatePreferenceProfiles: typeof deactivatePreferenceProfiles;
  createPreferenceProfile: typeof createPreferenceProfile;
  writeFeedbackLessonToMemory: typeof writeFeedbackLessonToMemory;
};

const defaultDependencies: FeedbackCaptureDependencies = {
  getArtifactById,
  writeFeedbackSignal,
  listPreferenceProfilesByTeamId,
  deactivatePreferenceProfiles,
  createPreferenceProfile,
  writeFeedbackLessonToMemory
};

const stableReasonCodes = new Set([
  "brand_voice",
  "style",
  "tone",
  "channel_preference",
  "headline_preference"
]);

function shouldPromoteToPreference(input: CaptureArtifactFeedbackInput) {
  return (
    (input.reasonCode ? stableReasonCodes.has(input.reasonCode) : false) ||
    (input.editBehaviorHints?.length ?? 0) > 0
  );
}

function buildPreferenceName(input: CaptureArtifactFeedbackInput) {
  return input.reasonCode ? `owner:${input.reasonCode}` : "owner:editing-pattern";
}

export async function captureArtifactFeedback(
  input: CaptureArtifactFeedbackInput,
  dependencies: FeedbackCaptureDependencies = defaultDependencies
) {
  const artifact = await dependencies.getArtifactById(input.artifactId);

  if (!artifact) {
    throw new Error(`Artifact not found: ${input.artifactId}`);
  }

  const signal = await dependencies.writeFeedbackSignal({
    teamId: artifact.teamId,
    cycleId: artifact.cycleId,
    artifactId: artifact.id,
    source: "owner",
    signalType: shouldPromoteToPreference(input) ? "preference" : "correction",
    summary: input.note ?? input.reasonCode ?? input.action,
    payload: {
      action: input.action,
      reasonCode: input.reasonCode ?? null,
      note: input.note ?? null,
      editBehaviorHints: input.editBehaviorHints ?? []
    },
    weight: input.action === "reused" || input.action === "published" ? 3 : 2
  });

  if (shouldPromoteToPreference(input)) {
    const profileName = buildPreferenceName(input);
    const existingProfiles = await dependencies.listPreferenceProfilesByTeamId(artifact.teamId);
    const previousVersion =
      existingProfiles
        .filter(
          (profile) => profile.profileType === "owner" && profile.name === profileName
        )
        .sort((left, right) => right.version - left.version)[0]?.version ?? 0;

    await dependencies.deactivatePreferenceProfiles(artifact.teamId, "owner", profileName);

    const preferenceProfile = await dependencies.createPreferenceProfile({
      teamId: artifact.teamId,
      profileType: "owner",
      name: profileName,
      preferences: {
        action: input.action,
        note: input.note ?? null,
        reasonCode: input.reasonCode ?? null,
        editBehaviorHints: input.editBehaviorHints ?? [],
        sourceArtifactId: artifact.id
      },
      source: "feedback_capture",
      version: previousVersion + 1,
      active: true
    });

    return {
      artifact,
      signal,
      preferenceProfile,
      memoryEntry: null
    };
  }

  const memoryEntry = await dependencies.writeFeedbackLessonToMemory({
    teamId: artifact.teamId,
    cycleId: artifact.cycleId,
    sourceArtifactId: artifact.id,
    title: `Feedback: ${artifact.title}`,
    summary: input.note ?? input.reasonCode ?? input.action,
    bodyMarkdown: [
      `- action: ${input.action}`,
      `- reasonCode: ${input.reasonCode ?? "n/a"}`,
      `- note: ${input.note ?? "n/a"}`
    ].join("\n"),
    tags: ["feedback", input.action],
    importance: 4
  });

  return {
    artifact,
    signal,
    preferenceProfile: null,
    memoryEntry
  };
}
