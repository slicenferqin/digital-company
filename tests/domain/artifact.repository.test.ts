import { describe, expect, it, vi } from "vitest";

import { createArtifactDraft, writeFeedbackSignal } from "../../lib/domain/artifact/repository";
import { artifacts, feedbackSignals } from "../../lib/db/schema";

describe("artifact repository", () => {
  it("creates an artifact draft with version one", async () => {
    const artifactRow = {
      id: "artifact_1",
      teamId: "team_1",
      cycleId: "cycle_1",
      projectId: null,
      taskId: null,
      artifactType: "article_draft" as const,
      title: "长文初稿",
      version: 1,
      status: "draft" as const,
      authorMemberId: "member_1",
      reviewerMemberId: null,
      summary: "一版初稿",
      bodyMarkdown: "# Draft",
      storageUri: null,
      metadata: {},
      reviewedAt: null,
      publishedAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const artifactInsert = {
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([artifactRow])
    };

    const database = {
      insert: vi.fn((table) => {
        if (table === artifacts) {
          return artifactInsert;
        }

        throw new Error("unexpected table");
      })
    };

    const result = await createArtifactDraft(
      {
        teamId: "team_1",
        cycleId: "cycle_1",
        artifactType: "article_draft",
        title: "长文初稿",
        authorMemberId: "member_1",
        summary: "一版初稿",
        bodyMarkdown: "# Draft"
      },
      database as never
    );

    expect(result.version).toBe(1);
    expect(result.status).toBe("draft");
    expect(artifactInsert.values).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "长文初稿",
        version: 1
      })
    );
  });

  it("writes feedback signals as structured events", async () => {
    const feedbackRow = {
      id: "signal_1",
      teamId: "team_1",
      cycleId: "cycle_1",
      taskId: null,
      artifactId: "artifact_1",
      memberId: null,
      source: "owner" as const,
      signalType: "preference" as const,
      summary: "语气需要更克制",
      payload: {},
      weight: 2,
      createdAt: new Date()
    };

    const feedbackInsert = {
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([feedbackRow])
    };

    const database = {
      insert: vi.fn((table) => {
        if (table === feedbackSignals) {
          return feedbackInsert;
        }

        throw new Error("unexpected table");
      })
    };

    const result = await writeFeedbackSignal(
      {
        teamId: "team_1",
        cycleId: "cycle_1",
        artifactId: "artifact_1",
        source: "owner",
        signalType: "preference",
        summary: "语气需要更克制",
        weight: 2
      },
      database as never
    );

    expect(result.signalType).toBe("preference");
    expect(feedbackInsert.values).toHaveBeenCalledWith(
      expect.objectContaining({
        source: "owner",
        signalType: "preference",
        weight: 2
      })
    );
  });
});
