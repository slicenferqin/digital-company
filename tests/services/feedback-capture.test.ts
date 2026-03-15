import { describe, expect, it, vi } from "vitest";

import { captureArtifactFeedback } from "../../lib/services/feedback-capture";

describe("feedback capture service", () => {
  it("promotes stable owner feedback into a preference profile", async () => {
    const getArtifactById = vi.fn().mockResolvedValue({
      id: "artifact_1",
      teamId: "team_1",
      cycleId: "cycle_1",
      title: "旗舰长文"
    });
    const writeFeedbackSignal = vi.fn().mockResolvedValue({
      id: "signal_1"
    });
    const listPreferenceProfilesByTeamId = vi.fn().mockResolvedValue([
      {
        id: "pref_old",
        teamId: "team_1",
        profileType: "owner",
        name: "owner:brand_voice",
        preferences: {},
        source: "feedback_capture",
        version: 1,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
    const deactivatePreferenceProfiles = vi.fn().mockResolvedValue(1);
    const createPreferenceProfile = vi.fn().mockResolvedValue({
      id: "pref_2",
      teamId: "team_1",
      profileType: "owner",
      name: "owner:brand_voice",
      preferences: {},
      source: "feedback_capture",
      version: 2,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    const writeFeedbackLessonToMemory = vi.fn();

    const result = await captureArtifactFeedback(
      {
        artifactId: "artifact_1",
        action: "approved",
        reasonCode: "brand_voice",
        note: "语气需要更克制",
        editBehaviorHints: ["avoid_hype"]
      },
      {
        getArtifactById,
        writeFeedbackSignal,
        listPreferenceProfilesByTeamId,
        deactivatePreferenceProfiles,
        createPreferenceProfile,
        writeFeedbackLessonToMemory
      }
    );

    expect(writeFeedbackSignal).toHaveBeenCalledTimes(1);
    expect(createPreferenceProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        teamId: "team_1",
        profileType: "owner",
        name: "owner:brand_voice",
        version: 2
      })
    );
    expect(result.preferenceProfile?.id).toBe("pref_2");
    expect(result.memoryEntry).toBeNull();
  });

  it("writes one-off feedback into memory when it is not a stable preference", async () => {
    const getArtifactById = vi.fn().mockResolvedValue({
      id: "artifact_2",
      teamId: "team_1",
      cycleId: "cycle_1",
      title: "社媒短内容"
    });
    const writeFeedbackSignal = vi.fn().mockResolvedValue({
      id: "signal_2"
    });
    const listPreferenceProfilesByTeamId = vi.fn().mockResolvedValue([]);
    const deactivatePreferenceProfiles = vi.fn();
    const createPreferenceProfile = vi.fn();
    const writeFeedbackLessonToMemory = vi.fn().mockResolvedValue({
      id: "memory_1"
    });

    const result = await captureArtifactFeedback(
      {
        artifactId: "artifact_2",
        action: "published",
        reasonCode: "timing",
        note: "发布时间需要更贴近中午流量"
      },
      {
        getArtifactById,
        writeFeedbackSignal,
        listPreferenceProfilesByTeamId,
        deactivatePreferenceProfiles,
        createPreferenceProfile,
        writeFeedbackLessonToMemory
      }
    );

    expect(createPreferenceProfile).not.toHaveBeenCalled();
    expect(writeFeedbackLessonToMemory).toHaveBeenCalledWith(
      expect.objectContaining({
        teamId: "team_1",
        sourceArtifactId: "artifact_2",
        title: "Feedback: 社媒短内容"
      })
    );
    expect(result.memoryEntry?.id).toBe("memory_1");
    expect(result.preferenceProfile).toBeNull();
  });
});
