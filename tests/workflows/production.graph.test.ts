import { describe, expect, it, vi } from "vitest";

import { buildProductionGraph } from "../../lib/workflows/production/graph";

describe("production graph", () => {
  it("creates a revised draft version when review requests changes", async () => {
    const draftArtifact = {
      id: "artifact_v1",
      teamId: "team_1",
      cycleId: "cycle_1",
      projectId: null,
      taskId: null,
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

    const revisedArtifact = {
      ...draftArtifact,
      id: "artifact_v2",
      version: 2,
      status: "draft" as const,
      bodyMarkdown: "第二版正文（已根据审核意见修订）",
      metadata: {
        versionLineage: {
          previousArtifactId: "artifact_v1",
          parentVersion: 1,
          currentVersion: 2
        }
      }
    };

    const createArtifactDraft = vi.fn().mockResolvedValue(draftArtifact);
    const reviewer = {
      reviewDraft: vi.fn().mockResolvedValue({
        verdict: "changes_requested" as const,
        blockingIssues: ["标题还不够聚焦"],
        comments: ["需要把开头改得更直接"],
        summary: "需要一轮修订",
        revisedBodyMarkdown: revisedArtifact.bodyMarkdown
      })
    };
    const applyDraftReviewResult = vi.fn().mockResolvedValue({
      review: {
        verdict: "changes_requested" as const,
        blockingIssues: ["标题还不够聚焦"],
        comments: ["需要把开头改得更直接"],
        summary: "需要一轮修订",
        revisedBodyMarkdown: revisedArtifact.bodyMarkdown
      },
      finalArtifact: revisedArtifact,
      createdVersion: revisedArtifact
    });

    const graph = buildProductionGraph({
      createArtifactDraft,
      reviewer,
      applyDraftReviewResult
    });

    const result = await graph.invoke({
      teamId: "team_1",
      cycleId: "cycle_1",
      artifactType: "article_draft",
      title: "旗舰长文",
      bodyMarkdown: "第一版正文",
      summary: "第一版摘要",
      projectId: null,
      taskId: null,
      authorMemberId: "writer_1",
      reviewerMemberId: "editor_1"
    });

    expect(createArtifactDraft).toHaveBeenCalledTimes(1);
    expect(reviewer.reviewDraft).toHaveBeenCalledTimes(1);
    expect(applyDraftReviewResult).toHaveBeenCalledWith(
      draftArtifact,
      expect.objectContaining({
        verdict: "changes_requested"
      })
    );
    expect(result.finalArtifact?.id).toBe("artifact_v2");
    expect(result.finalArtifact?.status).toBe("draft");
    expect(result.versionTrail).toHaveLength(2);
    expect(result.versionTrail[1]?.version).toBe(2);
  });

  it("approves the original draft when review passes directly", async () => {
    const draftArtifact = {
      id: "artifact_v1",
      teamId: "team_1",
      cycleId: "cycle_1",
      projectId: null,
      taskId: null,
      artifactType: "social_post" as const,
      title: "短内容",
      version: 1,
      status: "draft" as const,
      authorMemberId: "writer_1",
      reviewerMemberId: "editor_1",
      summary: "短内容摘要",
      bodyMarkdown: "短内容正文",
      storageUri: null,
      metadata: {},
      reviewedAt: null,
      publishedAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const createArtifactDraft = vi.fn().mockResolvedValue(draftArtifact);
    const reviewer = {
      reviewDraft: vi.fn().mockResolvedValue({
        verdict: "approved" as const,
        blockingIssues: [],
        comments: ["可直接进入下一步"],
        summary: "通过"
      })
    };
    const applyDraftReviewResult = vi.fn().mockResolvedValue({
      review: {
        verdict: "approved" as const,
        blockingIssues: [],
        comments: ["可直接进入下一步"],
        summary: "通过"
      },
      finalArtifact: {
        ...draftArtifact,
        status: "approved" as const
      },
      createdVersion: null
    });

    const graph = buildProductionGraph({
      createArtifactDraft,
      reviewer,
      applyDraftReviewResult
    });

    const result = await graph.invoke({
      teamId: "team_1",
      cycleId: "cycle_1",
      artifactType: "social_post",
      title: "短内容",
      bodyMarkdown: "短内容正文",
      summary: "短内容摘要",
      projectId: null,
      taskId: null,
      authorMemberId: "writer_1",
      reviewerMemberId: "editor_1"
    });

    expect(result.finalArtifact?.status).toBe("approved");
    expect(result.versionTrail).toHaveLength(1);
    expect(result.versionTrail[0]?.version).toBe(1);
  });

  it("applies writing guidelines to the draft and passes them into review", async () => {
    const createArtifactDraft = vi.fn().mockImplementation(async (input) => ({
      id: "artifact_guided_v1",
      teamId: input.teamId,
      cycleId: input.cycleId,
      projectId: input.projectId ?? null,
      taskId: input.taskId ?? null,
      artifactType: input.artifactType,
      title: input.title,
      version: 1,
      status: "draft" as const,
      authorMemberId: input.authorMemberId ?? null,
      reviewerMemberId: input.reviewerMemberId ?? null,
      summary: input.summary ?? null,
      bodyMarkdown: input.bodyMarkdown ?? null,
      storageUri: null,
      metadata: input.metadata ?? {},
      reviewedAt: null,
      publishedAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    const reviewer = {
      reviewDraft: vi.fn().mockResolvedValue({
        verdict: "approved" as const,
        blockingIssues: [],
        comments: ["规则已满足"],
        summary: "通过"
      })
    };
    const applyDraftReviewResult = vi.fn().mockImplementation(async (artifact) => ({
      review: {
        verdict: "approved" as const,
        blockingIssues: [],
        comments: ["规则已满足"],
        summary: "通过"
      },
      finalArtifact: {
        ...artifact,
        status: "approved" as const
      },
      createdVersion: null
    }));

    const graph = buildProductionGraph({
      createArtifactDraft,
      reviewer,
      applyDraftReviewResult
    });

    await graph.invoke({
      teamId: "team_1",
      cycleId: "cycle_1",
      artifactType: "article_draft",
      title: "旗舰长文",
      bodyMarkdown: "这是正文。",
      summary: "持续团队比临时 team 更能积累资产",
      writingGuidelines: ["首段先给结论", "避免夸张表达"],
      reviewGuidelines: ["首段先给结论", "避免夸张表达"],
      projectId: null,
      taskId: null,
      authorMemberId: "writer_1",
      reviewerMemberId: "editor_1"
    });

    expect(createArtifactDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        bodyMarkdown: expect.stringContaining("结论：持续团队比临时 team 更能积累资产"),
        metadata: expect.objectContaining({
          writingGuidelines: ["首段先给结论", "避免夸张表达"]
        })
      })
    );
    expect(reviewer.reviewDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        bodyMarkdown: expect.stringContaining("结论：持续团队比临时 team 更能积累资产"),
        writingGuidelines: ["首段先给结论", "避免夸张表达"],
        reviewGuidelines: ["首段先给结论", "避免夸张表达"]
      })
    );
  });
});
