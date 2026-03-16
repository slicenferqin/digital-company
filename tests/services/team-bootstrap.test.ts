import { describe, expect, it, vi } from "vitest";

import { bootstrapTeam } from "../../lib/services/team-bootstrap";

describe("team bootstrap service", () => {
  it("creates a founding team from a manual business profile", async () => {
    const createTeamMock = vi.fn().mockResolvedValue({
      team: {
        id: "team_1",
        name: "Acme 内容增长团队",
        businessName: "Acme",
        businessPositioning: "AI 销售自动化",
        brandVoice: "清晰直接",
        targetAudience: "B2B 创始人",
        coreOffer: "自动化销售流程",
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
      }
    });

    const createRoleMock = vi
      .fn()
      .mockImplementation(async ({ teamId, name, department, responsibilities, approvalScope, headcountLimit, sortOrder }) => ({
        id: `${name.toLowerCase().replace(/\s+/g, "_")}_role`,
        teamId,
        name,
        department,
        responsibilities,
        approvalScope,
        headcountLimit,
        sortOrder,
        createdAt: new Date(),
        updatedAt: new Date()
      }));

    const createMemberMock = vi
      .fn()
      .mockImplementation(async ({ teamId, roleId, name, personaSummary, strengths, weaknesses, specialtyTags }) => ({
        id: `${name.toLowerCase().replace(/\s+/g, "_")}_member`,
        teamId,
        roleId,
        name,
        personaSummary: personaSummary ?? null,
        strengths: strengths ?? [],
        weaknesses: weaknesses ?? [],
        specialtyTags: specialtyTags ?? [],
        currentLoad: 0,
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date()
      }));

    const result = await bootstrapTeam(
      {
        mode: "manual",
        businessName: "Acme",
        businessPositioning: "AI 销售自动化",
        brandVoice: "清晰直接",
        targetAudience: "B2B 创始人",
        coreOffer: "自动化销售流程",
        primaryChannels: ["公众号", "小红书"]
      },
      {
        createTeam: createTeamMock,
        createRole: createRoleMock,
        createMember: createMemberMock
      }
    );

    expect(createTeamMock).toHaveBeenCalledTimes(1);
    expect(createRoleMock).toHaveBeenCalledTimes(7);
    expect(createMemberMock).toHaveBeenCalledTimes(8);
    expect(result.team.name).toBe("Acme 内容增长团队");
    expect(result.roles.map((role) => role.name)).toEqual([
      "GM",
      "Chief of Staff",
      "Strategist",
      "Researcher",
      "Writer",
      "Editor",
      "Distribution Operator"
    ]);
    expect(result.members).toHaveLength(8);
    expect(result.members.map((member) => member.name)).toContain("Trend Scout");
    expect(result.profile.sourceMode).toBe("manual");
  });

  it("supports reverse-engineered bootstrap payloads", async () => {
    const createTeamMock = vi.fn().mockResolvedValue({
      team: {
        id: "team_2",
        name: "Beta 内容增长团队",
        businessName: "Beta",
        businessPositioning: null,
        brandVoice: null,
        targetAudience: null,
        coreOffer: null,
        primaryChannels: [],
        status: "draft",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      teamConfig: {
        id: "cfg_2",
        teamId: "team_2",
        approvalMode: "manual",
        brandRules: {},
        forbiddenPatterns: [],
        channelRules: {},
        costBudgetPerCycleCents: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    const createRoleMock = vi.fn().mockResolvedValue({
      id: "role_1",
      teamId: "team_2",
      name: "GM",
      department: "management",
      responsibilities: [],
      approvalScope: [],
      headcountLimit: 1,
      sortOrder: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const createMemberMock = vi.fn().mockResolvedValue({
      id: "member_1",
      teamId: "team_2",
      roleId: "role_1",
      name: "GM",
      personaSummary: null,
      strengths: [],
      weaknesses: [],
      specialtyTags: [],
      currentLoad: 0,
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const result = await bootstrapTeam(
      {
        mode: "reverse_engineered",
        sourceUrl: "https://example.com",
        sourceNotes: "从官网和历史文章抽取",
        extractedProfile: {
          businessName: "Beta",
          primaryChannels: []
        }
      },
      {
        createTeam: createTeamMock,
        createRole: createRoleMock,
        createMember: createMemberMock
      }
    );

    expect(result.profile.sourceMode).toBe("reverse_engineered");
    expect(result.profile.sourceUrl).toBe("https://example.com");
    expect(createRoleMock).toHaveBeenCalledTimes(7);
    expect(createMemberMock).toHaveBeenCalledTimes(8);
  });
});
