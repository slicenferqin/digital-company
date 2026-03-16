import { index, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

export const workflowCheckpoints = pgTable(
  "workflow_checkpoints",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workflowName: text("workflow_name").notNull(),
    threadId: text("thread_id").notNull(),
    checkpointNamespace: text("checkpoint_namespace").notNull().default(""),
    checkpointId: text("checkpoint_id").notNull(),
    checkpointJson: jsonb("checkpoint_json").$type<Record<string, unknown>>().notNull(),
    metadataJson: jsonb("metadata_json").$type<Record<string, unknown>>().notNull().default({}),
    parentCheckpointId: text("parent_checkpoint_id"),
    pendingWritesJson: jsonb("pending_writes_json")
      .$type<Array<[string, string, unknown]>>()
      .notNull()
      .default([]),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    threadCheckpointUniqueIdx: uniqueIndex("workflow_checkpoints_thread_checkpoint_idx").on(
      table.threadId,
      table.checkpointNamespace,
      table.checkpointId
    ),
    workflowThreadUpdatedIdx: index("workflow_checkpoints_thread_updated_idx").on(
      table.workflowName,
      table.threadId,
      table.updatedAt
    )
  })
);
