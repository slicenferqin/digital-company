import { describe, expect, it, vi } from "vitest";

import { runCycleExecutionWorkflow } from "../../lib/workflows/cycle-execution/workflow";

describe("cycle execution workflow", () => {
  it("delegates day-tick execution to the real cycle execution service", async () => {
    const advanceCycleExecution = vi.fn().mockResolvedValue({
      cycle: {
        id: "cycle_1",
        status: "active"
      },
      updatedTasks: [],
      createdArtifacts: [],
      noOpReason: null
    });

    const result = await runCycleExecutionWorkflow(
      {
        teamId: "team_1",
        cycleId: "cycle_1",
        occurredAt: "2026-03-16T09:00:00.000Z"
      },
      {
        advanceCycleExecution
      }
    );

    expect(advanceCycleExecution).toHaveBeenCalledWith({
      cycleId: "cycle_1"
    });
    expect(result.cycle.id).toBe("cycle_1");
  });
});
