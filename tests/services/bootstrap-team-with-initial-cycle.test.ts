import { describe, expect, it, vi } from "vitest";

import { bootstrapTeamWithInitialCycle } from "../../lib/services/bootstrap-team-with-initial-cycle";

describe("bootstrap team with initial cycle", () => {
  it("creates a real first-cycle object set for the workbench", async () => {
    const bootstrapTeam = vi.fn().mockResolvedValue({
      profile: {
        sourceMode: "manual",
        businessName: "Acme"
      },
      team: {
        id: "team_1",
        name: "Acme 内容增长团队",
        businessName: "Acme",
        businessPositioning: "AI 销售自动化",
        brandVoice: "直接、克制、务实",
        targetAudience: "Founder-led B2B 团队负责人",
        coreOffer: "持续交付的数字内容增长团队",
        primaryChannels: ["公众号", "小红书"],
        status: "draft",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      teamConfig: {
        id: "cfg_1",
        teamId: "team_1",
        approvalMode: "manual",
        brandRules: {},
        forbiddenPatterns: [],
        channelRules: {},
        costBudgetPerCycleCents: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      roles: [
        { id: "role_strategy", name: "Strategist" },
        { id: "role_research", name: "Researcher" },
        { id: "role_writer", name: "Writer" },
        { id: "role_editor", name: "Editor" }
      ],
      members: [
        { id: "member_strategy", roleId: "role_strategy" },
        { id: "member_research", roleId: "role_research" },
        { id: "member_writer", roleId: "role_writer" },
        { id: "member_editor", roleId: "role_editor" }
      ]
    });

    const createPreferenceProfile = vi.fn().mockResolvedValue({
      id: "pref_1",
      teamId: "team_1",
      profileType: "brand",
      name: "brand:founding-guidelines",
      preferences: {},
      source: "bootstrap_initial_cycle",
      version: 1,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    const runCyclePlanningGraph = vi.fn().mockResolvedValue({
      cycle: {
        id: "cycle_1",
        teamId: "team_1",
        cycleType: "weekly",
        goalSummary: "goal",
        priorityFocus: "AI 销售自动化",
        status: "draft",
        startAt: new Date(),
        endAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      projects: [],
      tasks: [
        {
          id: "task_strategy",
          projectId: "project_1",
          taskType: "strategy_card",
          inputContext: {}
        },
        {
          id: "task_research",
          projectId: "project_2",
          taskType: "topic_brief",
          inputContext: {}
        },
        {
          id: "task_article",
          projectId: "project_3",
          taskType: "article_draft",
          inputContext: {
            writingGuidelines: ["首段先给结论"]
          }
        }
      ]
    });

    const createArtifactDraft = vi
      .fn()
      .mockResolvedValueOnce({
        id: "artifact_strategy",
        teamId: "team_1",
        cycleId: "cycle_1",
        projectId: "project_1",
        taskId: "task_strategy",
        artifactType: "strategy_card",
        title: "策略卡",
        version: 1,
        status: "draft",
        authorMemberId: "member_strategy",
        reviewerMemberId: "member_editor",
        summary: "策略卡",
        bodyMarkdown: "# 策略卡",
        storageUri: null,
        metadata: {},
        reviewedAt: null,
        publishedAt: null,
        createdAt: new Date(),
        updatedAt: new Date()
      });

    const updateArtifactStatus = vi.fn().mockResolvedValue({
      id: "artifact_strategy",
      teamId: "team_1",
      cycleId: "cycle_1",
      projectId: "project_1",
      taskId: "task_strategy",
      artifactType: "strategy_card",
      title: "策略卡",
      version: 1,
      status: "approved",
      authorMemberId: "member_strategy",
      reviewerMemberId: "member_editor",
      summary: "策略卡",
      bodyMarkdown: "# 策略卡",
      storageUri: null,
      metadata: {},
      reviewedAt: new Date(),
      publishedAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const runResearchGraph = vi.fn().mockResolvedValue({
      artifact: {
        id: "artifact_research",
        teamId: "team_1",
        cycleId: "cycle_1",
        projectId: "project_2",
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
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    const runProductionGraph = vi.fn().mockResolvedValue({
      draftArtifact: {
        id: "artifact_article_v1"
      },
      finalArtifact: {
        id: "artifact_article_v2",
        teamId: "team_1",
        cycleId: "cycle_1",
        projectId: "project_3",
        taskId: "task_article",
        artifactType: "article_draft",
        title: "旗舰长文",
        version: 2,
        status: "draft",
        authorMemberId: "member_writer",
        reviewerMemberId: "member_editor",
        summary: "长文摘要",
        bodyMarkdown: "# 长文",
        storageUri: null,
        metadata: {},
        reviewedAt: null,
        publishedAt: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      versionTrail: [
        { id: "artifact_article_v1" },
        { id: "artifact_article_v2" }
      ]
    });

    const runBriefingGraph = vi.fn().mockResolvedValue({
      briefing: {
        id: "briefing_1",
        title: "今日简报"
      },
      linkedDecision: {
        id: "decision_1",
        status: "pending"
      }
    });

    const result = await bootstrapTeamWithInitialCycle(
      {
        mode: "manual",
        businessName: "Acme",
        businessPositioning: "AI 销售自动化",
        brandVoice: "直接、克制、务实",
        targetAudience: "Founder-led B2B 团队负责人",
        coreOffer: "持续交付的数字内容增长团队",
        primaryChannels: ["公众号", "小红书"]
      },
      {
        bootstrapTeam,
        createPreferenceProfile,
        runCyclePlanningGraph,
        createArtifactDraft,
        updateArtifactStatus,
        runResearchGraph,
        runProductionGraph,
        runBriefingGraph
      } as never
    );

    expect(runCyclePlanningGraph).toHaveBeenCalledTimes(1);
    expect(runResearchGraph).toHaveBeenCalledTimes(1);
    expect(runProductionGraph).toHaveBeenCalledWith(
      expect.objectContaining({
        writingGuidelines: expect.arrayContaining(["首段先给结论"])
      }),
      expect.any(Object)
    );
    expect(runBriefingGraph).toHaveBeenCalledTimes(1);
    expect(result.initialCycle.id).toBe("cycle_1");
    expect(result.initialBriefing?.id).toBe("briefing_1");
    expect(result.initialDecision?.id).toBe("decision_1");
    expect(result.initialArtifacts).toHaveLength(4);
  });
});
