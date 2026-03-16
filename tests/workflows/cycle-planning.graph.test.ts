import { describe, expect, it, vi } from "vitest";

import { buildCyclePlanningGraph } from "../../lib/workflows/cycle-planning/graph";

describe("cycle planning graph", () => {
  it("loads context, generates a draft plan, and persists cycle projects and tasks", async () => {
    const getTeamById = vi.fn().mockResolvedValue({
      id: "team_1",
      name: "Acme 内容增长团队",
      businessName: "Acme",
      businessPositioning: "AI 销售自动化",
      brandVoice: "清晰直接",
      targetAudience: "B2B 创始人",
      coreOffer: "AI 销售自动化",
      primaryChannels: ["公众号", "小红书"],
      status: "draft",
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const listMembersByTeamId = vi.fn().mockResolvedValue([
      {
        id: "member_strategy",
        teamId: "team_1",
        roleId: "role_strategy",
        name: "Strategist",
        personaSummary: null,
        strengths: [],
        weaknesses: [],
        specialtyTags: ["strategy"],
        currentLoad: 0,
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "member_research",
        teamId: "team_1",
        roleId: "role_research",
        name: "Researcher",
        personaSummary: null,
        strengths: [],
        weaknesses: [],
        specialtyTags: ["research"],
        currentLoad: 0,
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "member_trend",
        teamId: "team_1",
        roleId: "role_research",
        name: "Trend Scout",
        personaSummary: null,
        strengths: [],
        weaknesses: [],
        specialtyTags: ["research", "trend"],
        currentLoad: 0,
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "member_writer",
        teamId: "team_1",
        roleId: "role_writer",
        name: "Writer",
        personaSummary: null,
        strengths: [],
        weaknesses: [],
        specialtyTags: ["writing"],
        currentLoad: 0,
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "member_editor",
        teamId: "team_1",
        roleId: "role_editor",
        name: "Editor",
        personaSummary: null,
        strengths: [],
        weaknesses: [],
        specialtyTags: ["editing"],
        currentLoad: 0,
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "member_cos",
        teamId: "team_1",
        roleId: "role_cos",
        name: "Chief of Staff",
        personaSummary: null,
        strengths: [],
        weaknesses: [],
        specialtyTags: ["briefing"],
        currentLoad: 0,
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "member_distribution",
        teamId: "team_1",
        roleId: "role_distribution",
        name: "Distribution Operator",
        personaSummary: null,
        strengths: [],
        weaknesses: [],
        specialtyTags: ["distribution"],
        currentLoad: 0,
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
    const listPreferenceProfilesByTeamId = vi.fn().mockResolvedValue([
      {
        id: "pref_1",
        teamId: "team_1",
        profileType: "owner",
        name: "owner:brand_voice",
        preferences: {
          note: "语气需要更克制",
          editBehaviorHints: ["首段先给结论"]
        },
        source: "feedback_capture",
        version: 1,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    const fetchMemoryInputsForPlanning = vi.fn().mockResolvedValue([
      {
        id: "memory_1",
        type: "preference",
        title: "老板偏好更克制的表达",
        summary: "避免夸张表达",
        tags: ["brand"],
        importance: 10
      }
    ]);

    const createCycle = vi.fn().mockResolvedValue({
      id: "cycle_1",
      teamId: "team_1",
      cycleType: "weekly",
      goalSummary: "围绕 AI 销售自动化 连续产出一批可审核、可复用、可持续优化的内容资产。",
      priorityFocus: "AI 销售自动化",
      status: "draft",
      startAt: new Date("2026-03-16T00:00:00.000Z"),
      endAt: new Date("2026-03-22T23:59:59.000Z"),
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const createProject = vi
      .fn()
      .mockImplementation(async ({ title, ...rest }) => ({
        id: `${title.replace(/\s+/g, "_")}_id`,
        title,
        ...rest,
        createdAt: new Date(),
        updatedAt: new Date()
      }));

    let taskCounter = 0;
    const createTask = vi.fn().mockImplementation(async ({ title, ...rest }) => {
      taskCounter += 1;
      return {
        id: `task_${taskCounter}`,
        title,
        blockedReason: null,
        dueAt: null,
        startedAt: null,
        completedAt: null,
        status: "pending",
        ...rest,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    });

    const graph = buildCyclePlanningGraph({
      getTeamById,
      listMembersByTeamId,
      listPreferenceProfilesByTeamId,
      fetchMemoryInputsForPlanning,
      createCycle,
      createProject,
      createTask
    });

    const result = await graph.invoke({
      teamId: "team_1",
      startAt: "2026-03-16T00:00:00.000Z",
      endAt: "2026-03-22T23:59:59.000Z",
      requestedPriorityFocus: "AI 销售自动化",
      requestedGoalSummary: null,
      requestedCycleType: null
    });

    expect(getTeamById).toHaveBeenCalledWith("team_1");
    expect(fetchMemoryInputsForPlanning).toHaveBeenCalledWith("team_1");
    expect(createCycle).toHaveBeenCalledTimes(1);
    expect(createProject).toHaveBeenCalledTimes(4);
    expect(createTask).toHaveBeenCalledTimes(6);
    expect(result.cycle?.id).toBe("cycle_1");
    expect(result.projects).toHaveLength(4);
    expect(result.tasks).toHaveLength(6);
    expect(result.cyclePlan?.priorityFocus).toBe("AI 销售自动化");
    expect(result.cyclePlan?.rationale[2]).toContain("老板偏好更克制的表达");
    expect(result.cyclePlan?.rationale[3]).toContain("语气需要更克制");
    expect(createTask).toHaveBeenCalledWith(
      expect.objectContaining({
        taskType: "preference_calibration",
        assignedMemberId: "member_editor",
        inputContext: expect.objectContaining({
          writingGuidelines: expect.arrayContaining(["语气需要更克制", "首段先给结论"])
        })
      })
    );
    expect(createTask).toHaveBeenCalledWith(
      expect.objectContaining({
        taskType: "topic_brief",
        assignedMemberId: "member_trend"
      })
    );
    expect(createTask).toHaveBeenCalledWith(
      expect.objectContaining({
        taskType: "article_draft",
        assignedMemberId: "member_writer"
      })
    );
  });
});
