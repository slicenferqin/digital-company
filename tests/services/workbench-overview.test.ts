import { describe, expect, it, vi } from "vitest";

import { getWorkbenchOverview } from "../../lib/services/workbench-overview";

describe("workbench overview service", () => {
  it("aggregates team, cycle, briefing, decisions, artifacts, and metrics", async () => {
    const result = await getWorkbenchOverview(undefined, {
      findTeam: vi.fn().mockResolvedValue({
        id: "team_1",
        name: "Acme 内容增长团队",
        businessName: "Acme",
        businessPositioning: "AI 销售自动化",
        brandVoice: "克制直接",
        primaryChannels: ["公众号", "小红书"]
      }),
      listMembers: vi.fn().mockResolvedValue([
        { id: "member_1" },
        { id: "member_2" }
      ]),
      listCycles: vi.fn().mockResolvedValue([
        {
          id: "cycle_1",
          goalSummary: "产出一批可审核内容",
          priorityFocus: "AI 销售自动化",
          status: "completed",
          startAt: new Date("2026-03-01T00:00:00.000Z"),
          endAt: new Date("2026-03-07T00:00:00.000Z"),
          updatedAt: new Date("2026-03-02T00:00:00.000Z")
        }
      ]),
      listArtifacts: vi.fn().mockResolvedValue([
        {
          id: "artifact_1",
          cycleId: "cycle_1",
          title: "旗舰长文",
          artifactType: "article_draft",
          version: 2,
          status: "approved",
          summary: "一篇通过审核的长文"
        }
      ]),
      listDecisions: vi.fn().mockResolvedValue([
        {
          id: "decision_1",
          cycleId: "cycle_1",
          relatedBriefingId: "briefing_1",
          status: "pending",
          title: "确认发布节奏",
          summary: "需要老板拍板",
          workflowStatus: "awaiting_owner"
        }
      ]),
      listBriefings: vi.fn().mockResolvedValue([
        {
          id: "briefing_1",
          cycleId: "cycle_1",
          title: "今日简报：等待老板确认发布节奏",
          summary: "请确认发布节奏",
          type: "daily",
          publishedAt: new Date("2026-03-01T12:00:00.000Z")
        }
      ])
    } as never);

    expect(result?.team.name).toBe("Acme 内容增长团队");
    expect(result?.pulse.memberCount).toBe(2);
    expect(result?.pendingDecisions).toHaveLength(1);
    expect(result?.latestArtifacts[0]?.title).toBe("旗舰长文");
    expect(result?.metrics.artifactPassRate).toBe(1);
  });

  it("returns null when no team exists", async () => {
    const result = await getWorkbenchOverview(undefined, {
      findTeam: vi.fn().mockResolvedValue(null),
      listMembers: vi.fn(),
      listCycles: vi.fn(),
      listArtifacts: vi.fn(),
      listDecisions: vi.fn(),
      listBriefings: vi.fn()
    } as never);

    expect(result).toBeNull();
  });
});
