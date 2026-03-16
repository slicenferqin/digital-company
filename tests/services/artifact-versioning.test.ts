import { describe, expect, it, vi } from "vitest";

import { applyDraftReviewResult } from "../../lib/services/artifact-versioning";

describe("artifact versioning service", () => {
  it("creates a draft rework version instead of auto-approving after changes requested", async () => {
    const artifact = {
      id: "artifact_v1",
      teamId: "team_1",
      cycleId: "cycle_1",
      projectId: "project_1",
      taskId: "task_1",
      artifactType: "article_draft" as const,
      title: "旗舰长文",
      version: 1,
      status: "draft" as const,
      authorMemberId: "writer_1",
      reviewerMemberId: "editor_1",
      summary: "第一版摘要",
      bodyMarkdown: "第一版正文",
      storageUri: null,
      metadata: {},
      reviewedAt: null,
      publishedAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const createArtifactReview = vi.fn().mockResolvedValue({
      id: "review_1"
    });
    const updateArtifactStatus = vi.fn().mockResolvedValue({
      ...artifact,
      status: "rejected" as const
    });
    const createArtifactVersion = vi.fn().mockResolvedValue({
      ...artifact,
      id: "artifact_v2",
      version: 2,
      status: "draft" as const,
      bodyMarkdown: "修订版正文"
    });

    const result = await applyDraftReviewResult(
      artifact,
      {
        verdict: "changes_requested",
        blockingIssues: ["需要补齐下一步动作"],
        comments: ["请补齐老板拍板所需动作"],
        summary: "需要一轮返工",
        revisedBodyMarkdown: "修订版正文"
      },
      {
        createArtifactReview,
        updateArtifactStatus,
        createArtifactVersion
      } as never
    );

    expect(updateArtifactStatus).toHaveBeenCalledWith(
      expect.objectContaining({
        artifactId: "artifact_v1",
        status: "rejected"
      })
    );
    expect(createArtifactVersion).toHaveBeenCalledWith(
      expect.objectContaining({
        version: 2,
        status: "draft"
      })
    );
    expect(result.finalArtifact.status).toBe("draft");
  });
});
