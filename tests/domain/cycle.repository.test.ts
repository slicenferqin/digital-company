import { describe, expect, it, vi } from "vitest";

import { createCycle } from "../../lib/domain/cycle/repository";
import { cycles } from "../../lib/db/schema";

describe("cycle repository", () => {
  it("creates a cycle with explicit time bounds", async () => {
    const cycleRow = {
      id: "cycle_1",
      teamId: "team_1",
      cycleType: "weekly" as const,
      goalSummary: "连续产出一批可审核内容",
      priorityFocus: "AI 销售自动化",
      status: "draft" as const,
      startAt: new Date("2026-03-16T00:00:00.000Z"),
      endAt: new Date("2026-03-22T23:59:59.000Z"),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const insertChain = {
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([cycleRow])
    };

    const database = {
      insert: vi.fn((table) => {
        if (table === cycles) {
          return insertChain;
        }

        throw new Error("unexpected table");
      })
    };

    const result = await createCycle(
      {
        teamId: "team_1",
        goalSummary: "连续产出一批可审核内容",
        priorityFocus: "AI 销售自动化",
        startAt: cycleRow.startAt,
        endAt: cycleRow.endAt
      },
      database as never
    );

    expect(result.id).toBe("cycle_1");
    expect(database.insert).toHaveBeenCalledWith(cycles);
    expect(insertChain.values).toHaveBeenCalledWith(
      expect.objectContaining({
        teamId: "team_1",
        cycleType: "weekly"
      })
    );
  });
});
