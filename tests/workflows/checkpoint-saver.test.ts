import { describe, expect, it } from "vitest";

import type { RunnableConfig } from "@langchain/core/runnables";
import type { Checkpoint } from "@langchain/langgraph";

import {
  DurableWorkflowCheckpointSaver,
  InMemoryWorkflowCheckpointPersistence
} from "../../lib/workflows/runtime/checkpoint-saver";

describe("durable workflow checkpoint saver", () => {
  it("persists and loads checkpoints through the persistence interface", async () => {
    const saver = new DurableWorkflowCheckpointSaver(
      "review-feedback",
      new InMemoryWorkflowCheckpointPersistence()
    );

    const config: RunnableConfig = {
      configurable: {
        thread_id: "thread_1"
      }
    };

    const checkpoint: Checkpoint = {
      v: 1,
      id: "checkpoint_1",
      ts: new Date().toISOString(),
      channel_values: {
        decisionId: "decision_1"
      },
      channel_versions: {},
      versions_seen: {},
      pending_sends: []
    };

    const nextConfig = await saver.put(config, checkpoint, {
      source: "input",
      step: 0,
      writes: null,
      parents: {}
    });

    await saver.putWrites(nextConfig, [["ownerChoice", { action: "approve" }]], "task_1");

    const tuple = await saver.getTuple(nextConfig);

    expect(tuple?.checkpoint.id).toBe("checkpoint_1");
    expect(tuple?.metadata).toEqual({
      source: "input",
      step: 0,
      writes: null,
      parents: {}
    });
    expect(tuple?.pendingWrites).toEqual([
      ["task_1", "ownerChoice", { action: "approve" }]
    ]);
  });
});
