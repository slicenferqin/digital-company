import { describe, expect, it, vi } from "vitest";

import { launchNextCycleFromArtifactFeedback } from "../../lib/services/launch-next-cycle";

describe("launch next cycle service", () => {
  it("captures feedback and creates a next cycle with feedback-aware artifacts", async () => {
    const now = new Date("2026-03-16T08:00:00.000Z");

    const result = await launchNextCycleFromArtifactFeedback(
      {
        cycleId: "cycle_1",
        feedback: {
          artifactId: "artifact_social_v1",
          action: "published",
          reasonCode: "style",
          note: "下一周期继续首段先给结论。"
        }
      },
      {
        captureArtifactFeedback: vi.fn().mockResolvedValue({
          artifact: {
            id: "artifact_social_v1",
            teamId: "team_1",
            cycleId: "cycle_1"
          }
        }),
        getCycleById: vi.fn().mockResolvedValue({
          id: "cycle_1",
          teamId: "team_1",
          cycleType: "weekly",
          goalSummary: "当前周期",
          priorityFocus: "持续团队",
          status: "active",
          startAt: now,
          endAt: now,
          createdAt: now,
          updatedAt: now
        }),
        getTeamById: vi.fn().mockResolvedValue({
          id: "team_1",
          brandVoice: "直接、克制、务实"
        }),
        listMembersByTeamId: vi.fn().mockResolvedValue([
          {
            id: "member_strategy",
            name: "Strategist"
          },
          {
            id: "member_writer",
            name: "Writer"
          },
          {
            id: "member_editor",
            name: "Editor"
          }
        ]),
        listTasksForCycle: vi.fn(),
        updateCycleStatus: vi
          .fn()
          .mockResolvedValueOnce({
            id: "cycle_1",
            teamId: "team_1",
            cycleType: "weekly",
            goalSummary: "当前周期",
            priorityFocus: "持续团队",
            status: "completed",
            startAt: now,
            endAt: now,
            createdAt: now,
            updatedAt: now
          })
          .mockResolvedValueOnce({
            id: "cycle_2",
            teamId: "team_1",
            cycleType: "weekly",
            goalSummary: "下一周期",
            priorityFocus: "持续团队",
            status: "active",
            startAt: now,
            endAt: now,
            createdAt: now,
            updatedAt: now
          }),
        runCyclePlanningGraph: vi.fn().mockResolvedValue({
          cycle: {
            id: "cycle_2",
            teamId: "team_1",
            cycleType: "weekly",
            goalSummary: "下一周期",
            priorityFocus: "持续团队",
            status: "draft",
            startAt: now,
            endAt: now,
            createdAt: now,
            updatedAt: now
          },
          tasks: [
            {
              id: "task_strategy",
              projectId: "project_strategy",
              taskType: "strategy_card",
              inputContext: {}
            },
            {
              id: "task_research",
              projectId: "project_research",
              taskType: "topic_brief",
              inputContext: {}
            },
            {
              id: "task_article",
              projectId: "project_article",
              taskType: "article_draft",
              inputContext: {
                writingGuidelines: ["下一周期继续首段先给结论。"]
              }
            }
          ]
        }),
        createArtifactDraft: vi.fn().mockResolvedValue({
          id: "artifact_strategy_v1",
          teamId: "team_1",
          cycleId: "cycle_2",
          projectId: "project_strategy",
          taskId: "task_strategy",
          artifactType: "strategy_card",
          title: "第二周期策略卡",
          version: 1,
          status: "draft",
          authorMemberId: "member_strategy",
          reviewerMemberId: "member_editor",
          summary: "已吸收老板反馈：下一周期继续首段先给结论。",
          bodyMarkdown: "# 第二周期策略卡",
          storageUri: null,
          metadata: {},
          reviewedAt: null,
          publishedAt: null,
          createdAt: now,
          updatedAt: now
        }),
        updateArtifactStatus: vi.fn().mockResolvedValue({
          id: "artifact_strategy_v1",
          teamId: "team_1",
          cycleId: "cycle_2",
          projectId: "project_strategy",
          taskId: "task_strategy",
          artifactType: "strategy_card",
          title: "第二周期策略卡",
          version: 1,
          status: "approved",
          authorMemberId: "member_strategy",
          reviewerMemberId: "member_editor",
          summary: "已吸收老板反馈：下一周期继续首段先给结论。",
          bodyMarkdown: "# 第二周期策略卡",
          storageUri: null,
          metadata: {},
          reviewedAt: now,
          publishedAt: null,
          createdAt: now,
          updatedAt: now
        }),
        runResearchGraph: vi.fn().mockResolvedValue({
          artifact: {
            id: "artifact_research_v1",
            teamId: "team_1",
            cycleId: "cycle_2",
            projectId: "project_research",
            taskId: "task_research",
            artifactType: "research_summary",
            title: "研究摘要",
            version: 1,
            status: "draft",
            authorMemberId: null,
            reviewerMemberId: null,
            summary: "研究摘要",
            bodyMarkdown: "# 研究摘要",
            storageUri: null,
            metadata: {},
            reviewedAt: null,
            publishedAt: null,
            createdAt: now,
            updatedAt: now
          }
        }),
        runProductionGraph: vi.fn().mockResolvedValue({
          draftArtifact: {
            id: "artifact_article_v1"
          },
          finalArtifact: {
            id: "artifact_article_v1",
            teamId: "team_1",
            cycleId: "cycle_2",
            projectId: "project_article",
            taskId: "task_article",
            artifactType: "article_draft",
            title: "第二周期长文",
            version: 1,
            status: "approved",
            authorMemberId: "member_writer",
            reviewerMemberId: "member_editor",
            summary: "已吸收老板反馈：下一周期继续首段先给结论。",
            bodyMarkdown: "# 第二周期长文",
            storageUri: null,
            metadata: {},
            reviewedAt: now,
            publishedAt: null,
            createdAt: now,
            updatedAt: now
          },
          versionTrail: []
        }),
        runBriefingGraph: vi.fn().mockResolvedValue({})
      } as never
    );

    expect(result.previousCycle.id).toBe("cycle_1");
    expect(result.nextCycle.id).toBe("cycle_2");
    expect(result.nextArtifacts[0]?.summary).toContain("下一周期继续首段先给结论");
    expect(result.nextArtifacts[2]?.summary).toContain("下一周期继续首段先给结论");
  });
});
