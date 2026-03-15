import { describe, expect, it, vi } from "vitest";

import { createTeam } from "../../lib/domain/team/repository";
import { teamConfigs, teams } from "../../lib/db/schema";

describe("team repository", () => {
  it("creates a team and default config in one transaction", async () => {
    const teamRow = {
      id: "team_1",
      name: "内容增长团队",
      businessName: "Acme",
      businessPositioning: "AI 销售自动化",
      brandVoice: "清晰直接",
      targetAudience: "B2B 创始人",
      coreOffer: "自动化销售工作流",
      primaryChannels: ["公众号", "小红书"],
      status: "draft" as const,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const configRow = {
      id: "cfg_1",
      teamId: "team_1",
      approvalMode: "manual" as const,
      brandRules: {},
      forbiddenPatterns: [],
      channelRules: {},
      costBudgetPerCycleCents: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const teamInsert = {
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([teamRow])
    };
    const configInsert = {
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([configRow])
    };

    const tx = {
      insert: vi.fn((table) => {
        if (table === teams) {
          return teamInsert;
        }

        if (table === teamConfigs) {
          return configInsert;
        }

        throw new Error("unexpected table");
      })
    };

    const database = {
      transaction: vi.fn((handler) => handler(tx))
    };

    const result = await createTeam(
      {
        name: "内容增长团队",
        businessName: "Acme",
        businessPositioning: "AI 销售自动化",
        brandVoice: "清晰直接",
        targetAudience: "B2B 创始人",
        coreOffer: "自动化销售工作流",
        primaryChannels: ["公众号", "小红书"]
      },
      database as never
    );

    expect(database.transaction).toHaveBeenCalledTimes(1);
    expect(tx.insert).toHaveBeenCalledTimes(2);
    expect(result.team.id).toBe("team_1");
    expect(result.teamConfig.teamId).toBe("team_1");
    expect(teamInsert.values).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "内容增长团队",
        businessName: "Acme"
      })
    );
  });
});
