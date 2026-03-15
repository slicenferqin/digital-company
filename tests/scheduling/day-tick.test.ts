import { describe, expect, it, vi } from "vitest";

import { buildDayTickEntrypoints, enqueueDayTick } from "../../lib/scheduling/functions/day-tick";
import { schedulingEventNames } from "../../lib/scheduling/inngest";

describe("day tick scheduling", () => {
  it("builds the expected workflow entrypoints for a day tick", () => {
    const entrypoints = buildDayTickEntrypoints({
      teamId: "team_1",
      cycleId: "cycle_1",
      occurredAt: "2026-03-16T09:00:00.000Z",
      focusQuery: "Founder-led B2B content ops"
    });

    expect(entrypoints).toEqual([
      expect.objectContaining({
        workflow: "research",
        input: expect.objectContaining({
          teamId: "team_1",
          cycleId: "cycle_1",
          query: "Founder-led B2B content ops"
        })
      }),
      expect.objectContaining({
        workflow: "production",
        input: expect.objectContaining({
          teamId: "team_1",
          cycleId: "cycle_1"
        })
      }),
      expect.objectContaining({
        workflow: "briefing",
        input: expect.objectContaining({
          teamId: "team_1",
          cycleId: "cycle_1",
          type: "daily"
        })
      })
    ]);
  });

  it("enqueues a day tick event through the sender abstraction", async () => {
    const sender = {
      send: vi.fn().mockResolvedValue({
        ids: ["evt_1"]
      })
    };

    await enqueueDayTick(
      {
        teamId: "team_1",
        cycleId: "cycle_1",
        occurredAt: "2026-03-16T09:00:00.000Z"
      },
      sender
    );

    expect(sender.send).toHaveBeenCalledWith({
      name: schedulingEventNames.dayTick,
      data: {
        teamId: "team_1",
        cycleId: "cycle_1",
        occurredAt: "2026-03-16T09:00:00.000Z"
      }
    });
  });
});
