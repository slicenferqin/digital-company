import { describe, expect, it, vi } from "vitest";

import { advanceCycleExecution } from "../../lib/services/cycle-execution";

describe("cycle execution service", () => {
  it("creates a social post pack after owner decisions are cleared", async () => {
    const now = new Date("2026-03-16T08:00:00.000Z");

    const result = await advanceCycleExecution(
      {
        cycleId: "cycle_1"
      },
      {
        getCycleById: vi.fn().mockResolvedValue({
          id: "cycle_1",
          teamId: "team_1",
          cycleType: "weekly",
          goalSummary: "围绕主资产继续推进分发",
          priorityFocus: "持续团队",
          status: "draft",
          startAt: now,
          endAt: now,
          createdAt: now,
          updatedAt: now
        }),
        getTeamById: vi.fn().mockResolvedValue({
          id: "team_1",
          primaryChannels: ["公众号", "小红书"]
        }),
        listMembersByTeamId: vi.fn().mockResolvedValue([
          {
            id: "member_distribution",
            name: "Distribution Operator"
          }
        ]),
        listTasksForCycle: vi.fn().mockResolvedValue([
          {
            id: "task_article",
            teamId: "team_1",
            cycleId: "cycle_1",
            projectId: "project_write",
            assignedMemberId: null,
            taskType: "article_draft",
            title: "完成 1 篇旗舰长文初稿",
            inputContext: {},
            status: "pending",
            blockedReason: null,
            requiresOwnerApproval: false,
            priority: 95,
            dueAt: null,
            startedAt: null,
            completedAt: null,
            createdAt: now,
            updatedAt: now
          },
          {
            id: "task_distribution",
            teamId: "team_1",
            cycleId: "cycle_1",
            projectId: "project_dist",
            assignedMemberId: null,
            taskType: "social_post_pack",
            title: "生成 3 条渠道适配短内容",
            inputContext: {},
            status: "pending",
            blockedReason: null,
            requiresOwnerApproval: false,
            priority: 80,
            dueAt: null,
            startedAt: null,
            completedAt: null,
            createdAt: now,
            updatedAt: now
          }
        ]),
        listArtifactsForCycle: vi.fn().mockResolvedValue([
          {
            id: "artifact_article_v2",
            teamId: "team_1",
            cycleId: "cycle_1",
            projectId: "project_write",
            taskId: "task_article",
            artifactType: "article_draft",
            title: "旗舰长文",
            version: 2,
            status: "draft",
            authorMemberId: "member_writer",
            reviewerMemberId: "member_editor",
            summary: "主资产已经 ready",
            bodyMarkdown: "# 主资产",
            storageUri: null,
            metadata: {},
            reviewedAt: null,
            publishedAt: null,
            createdAt: now,
            updatedAt: now
          }
        ]),
        listBriefingsForCycle: vi.fn().mockResolvedValue([
          {
            id: "briefing_1"
          }
        ]),
        listDecisionsForCycle: vi.fn().mockResolvedValue([
          {
            id: "decision_1",
            status: "approved"
          }
        ]),
        updateTaskStatus: vi.fn().mockImplementation(async ({ taskId, status }) => ({
          id: taskId,
          status
        })),
        updateCycleStatus: vi.fn().mockImplementation(async ({ cycleId, status }) => ({
          id: cycleId,
          teamId: "team_1",
          cycleType: "weekly",
          goalSummary: "围绕主资产继续推进分发",
          priorityFocus: "持续团队",
          status,
          startAt: now,
          endAt: now,
          createdAt: now,
          updatedAt: now
        })),
        createArtifactDraft: vi.fn().mockResolvedValue({
          id: "artifact_social_v1",
          teamId: "team_1",
          cycleId: "cycle_1",
          projectId: "project_dist",
          taskId: "task_distribution",
          artifactType: "social_post",
          title: "渠道短帖包：持续团队",
          version: 1,
          status: "draft",
          authorMemberId: "member_distribution",
          reviewerMemberId: null,
          summary: "短帖包",
          bodyMarkdown: "# 短帖包",
          storageUri: null,
          metadata: {},
          reviewedAt: null,
          publishedAt: null,
          createdAt: now,
          updatedAt: now
        }),
        updateArtifactStatus: vi.fn().mockResolvedValue({
          id: "artifact_social_v1",
          teamId: "team_1",
          cycleId: "cycle_1",
          projectId: "project_dist",
          taskId: "task_distribution",
          artifactType: "social_post",
          title: "渠道短帖包：持续团队",
          version: 1,
          status: "approved",
          authorMemberId: "member_distribution",
          reviewerMemberId: null,
          summary: "短帖包",
          bodyMarkdown: "# 短帖包",
          storageUri: null,
          metadata: {},
          reviewedAt: now,
          publishedAt: null,
          createdAt: now,
          updatedAt: now
        }),
        runBriefingGraph: vi.fn()
      } as never
    );

    expect(result.cycle.status).toBe("active");
    expect(result.createdArtifacts).toHaveLength(1);
    expect(result.createdArtifacts[0]?.artifactType).toBe("social_post");
    expect(result.noOpReason).toBeNull();
  });

  it("returns a no-op reason when owner decisions are still pending", async () => {
    const now = new Date("2026-03-16T08:00:00.000Z");
    const createArtifactDraft = vi.fn();

    const result = await advanceCycleExecution(
      {
        cycleId: "cycle_1"
      },
      {
        getCycleById: vi.fn().mockResolvedValue({
          id: "cycle_1",
          teamId: "team_1",
          cycleType: "weekly",
          goalSummary: "围绕主资产继续推进分发",
          priorityFocus: "持续团队",
          status: "active",
          startAt: now,
          endAt: now,
          createdAt: now,
          updatedAt: now
        }),
        getTeamById: vi.fn().mockResolvedValue({
          id: "team_1",
          primaryChannels: ["公众号"]
        }),
        listMembersByTeamId: vi.fn().mockResolvedValue([]),
        listTasksForCycle: vi.fn().mockResolvedValue([]),
        listArtifactsForCycle: vi.fn().mockResolvedValue([]),
        listBriefingsForCycle: vi.fn().mockResolvedValue([]),
        listDecisionsForCycle: vi.fn().mockResolvedValue([
          {
            id: "decision_1",
            status: "pending"
          }
        ]),
        updateTaskStatus: vi.fn(),
        updateCycleStatus: vi.fn(),
        createArtifactDraft,
        updateArtifactStatus: vi.fn(),
        runBriefingGraph: vi.fn()
      } as never
    );

    expect(result.noOpReason).toContain("待老板拍板");
    expect(createArtifactDraft).not.toHaveBeenCalled();
  });
});
