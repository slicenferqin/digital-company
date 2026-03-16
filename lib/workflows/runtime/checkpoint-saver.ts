import type { RunnableConfig } from "@langchain/core/runnables";
import type { Checkpoint, CheckpointMetadata } from "@langchain/langgraph";
import { BaseCheckpointSaver, copyCheckpoint } from "@langchain/langgraph";
import { and, desc, eq } from "drizzle-orm";

import { getDatabase } from "@/lib/db/client";
import { workflowCheckpoints } from "@/lib/db/schema";

type WorkflowPendingWrite = [string, string, unknown];

type StoredCheckpointRecord = {
  workflowName: string;
  threadId: string;
  checkpointNamespace: string;
  checkpointId: string;
  checkpointJson: Checkpoint;
  metadataJson: CheckpointMetadata;
  parentCheckpointId: string | null;
  pendingWritesJson: WorkflowPendingWrite[];
};

interface WorkflowCheckpointPersistence {
  get(
    threadId: string,
    checkpointNamespace: string,
    checkpointId?: string
  ): Promise<StoredCheckpointRecord | undefined>;
  list(
    threadId: string,
    checkpointNamespace: string
  ): AsyncGenerator<StoredCheckpointRecord>;
  put(record: StoredCheckpointRecord): Promise<void>;
  putWrites(
    threadId: string,
    checkpointNamespace: string,
    checkpointId: string,
    writes: WorkflowPendingWrite[]
  ): Promise<void>;
}

export class InMemoryWorkflowCheckpointPersistence implements WorkflowCheckpointPersistence {
  private readonly records = new Map<string, StoredCheckpointRecord>();

  private createKey(threadId: string, checkpointNamespace: string, checkpointId: string) {
    return `${threadId}::${checkpointNamespace}::${checkpointId}`;
  }

  async get(threadId: string, checkpointNamespace: string, checkpointId?: string) {
    if (checkpointId) {
      return this.records.get(this.createKey(threadId, checkpointNamespace, checkpointId));
    }

    const matches = [...this.records.values()]
      .filter(
        (record) =>
          record.threadId === threadId && record.checkpointNamespace === checkpointNamespace
      )
      .sort((left, right) => right.checkpointId.localeCompare(left.checkpointId));

    return matches[0];
  }

  async *list(threadId: string, checkpointNamespace: string) {
    const matches = [...this.records.values()]
      .filter(
        (record) =>
          record.threadId === threadId && record.checkpointNamespace === checkpointNamespace
      )
      .sort((left, right) => right.checkpointId.localeCompare(left.checkpointId));

    for (const record of matches) {
      yield record;
    }
  }

  async put(record: StoredCheckpointRecord) {
    this.records.set(
      this.createKey(record.threadId, record.checkpointNamespace, record.checkpointId),
      record
    );
  }

  async putWrites(
    threadId: string,
    checkpointNamespace: string,
    checkpointId: string,
    writes: WorkflowPendingWrite[]
  ) {
    const key = this.createKey(threadId, checkpointNamespace, checkpointId);
    const existing = this.records.get(key);

    if (!existing) {
      return;
    }

    existing.pendingWritesJson = dedupeWrites([...existing.pendingWritesJson, ...writes]);
    this.records.set(key, existing);
  }
}

class PostgresWorkflowCheckpointPersistence implements WorkflowCheckpointPersistence {
  async get(threadId: string, checkpointNamespace: string, checkpointId?: string) {
    const db = getDatabase();

    const query = db
      .select()
      .from(workflowCheckpoints)
      .where(
        checkpointId
          ? and(
              eq(workflowCheckpoints.threadId, threadId),
              eq(workflowCheckpoints.checkpointNamespace, checkpointNamespace),
              eq(workflowCheckpoints.checkpointId, checkpointId)
            )
          : and(
              eq(workflowCheckpoints.threadId, threadId),
              eq(workflowCheckpoints.checkpointNamespace, checkpointNamespace)
            )
      )
      .orderBy(desc(workflowCheckpoints.updatedAt))
      .limit(1);

    const [row] = await query;
    return row ? mapWorkflowCheckpointRow(row) : undefined;
  }

  async *list(threadId: string, checkpointNamespace: string) {
    const db = getDatabase();
    const rows = await db
      .select()
      .from(workflowCheckpoints)
      .where(
        and(
          eq(workflowCheckpoints.threadId, threadId),
          eq(workflowCheckpoints.checkpointNamespace, checkpointNamespace)
        )
      )
      .orderBy(desc(workflowCheckpoints.updatedAt));

    for (const row of rows) {
      yield mapWorkflowCheckpointRow(row);
    }
  }

  async put(record: StoredCheckpointRecord) {
    const db = getDatabase();
    const existing = await this.get(
      record.threadId,
      record.checkpointNamespace,
      record.checkpointId
    );

    if (existing) {
      await db
        .update(workflowCheckpoints)
        .set({
          workflowName: record.workflowName,
          checkpointJson: record.checkpointJson as unknown as Record<string, unknown>,
          metadataJson: record.metadataJson as Record<string, unknown>,
          parentCheckpointId: record.parentCheckpointId,
          pendingWritesJson: record.pendingWritesJson,
          updatedAt: new Date()
        })
        .where(
          and(
            eq(workflowCheckpoints.threadId, record.threadId),
            eq(workflowCheckpoints.checkpointNamespace, record.checkpointNamespace),
            eq(workflowCheckpoints.checkpointId, record.checkpointId)
          )
        );

      return;
    }

    await db.insert(workflowCheckpoints).values({
      workflowName: record.workflowName,
      threadId: record.threadId,
      checkpointNamespace: record.checkpointNamespace,
      checkpointId: record.checkpointId,
      checkpointJson: record.checkpointJson as unknown as Record<string, unknown>,
      metadataJson: record.metadataJson as Record<string, unknown>,
      parentCheckpointId: record.parentCheckpointId,
      pendingWritesJson: record.pendingWritesJson
    });
  }

  async putWrites(
    threadId: string,
    checkpointNamespace: string,
    checkpointId: string,
    writes: WorkflowPendingWrite[]
  ) {
    const db = getDatabase();
    const existing = await this.get(threadId, checkpointNamespace, checkpointId);

    if (!existing) {
      return;
    }

    await db
      .update(workflowCheckpoints)
      .set({
        pendingWritesJson: dedupeWrites([...existing.pendingWritesJson, ...writes]),
        updatedAt: new Date()
      })
      .where(
        and(
          eq(workflowCheckpoints.threadId, threadId),
          eq(workflowCheckpoints.checkpointNamespace, checkpointNamespace),
          eq(workflowCheckpoints.checkpointId, checkpointId)
        )
      );
  }
}

function dedupeWrites(
  writes: WorkflowPendingWrite[]
): WorkflowPendingWrite[] {
  const seen = new Set<string>();

  return writes.filter((write) => {
    const key = JSON.stringify(write);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function mapWorkflowCheckpointRow(
  row: typeof workflowCheckpoints.$inferSelect
): StoredCheckpointRecord {
  return {
    workflowName: row.workflowName,
    threadId: row.threadId,
    checkpointNamespace: row.checkpointNamespace,
    checkpointId: row.checkpointId,
    checkpointJson: row.checkpointJson as unknown as Checkpoint,
    metadataJson: row.metadataJson as CheckpointMetadata,
    parentCheckpointId: row.parentCheckpointId,
    pendingWritesJson: (row.pendingWritesJson as WorkflowPendingWrite[]) ?? []
  };
}

function getRunnableCheckpointId(config: RunnableConfig) {
  return config.configurable?.checkpoint_id as string | undefined;
}

export class DurableWorkflowCheckpointSaver extends BaseCheckpointSaver {
  constructor(
    private readonly workflowName: string,
    private readonly persistence: WorkflowCheckpointPersistence = new PostgresWorkflowCheckpointPersistence()
  ) {
    super();
  }

  async getTuple(config: RunnableConfig) {
    const threadId = config.configurable?.thread_id;
    const checkpointNamespace = config.configurable?.checkpoint_ns ?? "";

    if (!threadId) {
      return undefined;
    }

    const record = await this.persistence.get(
      threadId,
      checkpointNamespace,
      getRunnableCheckpointId(config)
    );

    if (!record) {
      return undefined;
    }

    const tuple: {
      config: RunnableConfig;
      checkpoint: Checkpoint;
      metadata: CheckpointMetadata;
      pendingWrites: WorkflowPendingWrite[];
      parentConfig?: RunnableConfig;
    } = {
      config: {
        configurable: {
          thread_id: record.threadId,
          checkpoint_ns: record.checkpointNamespace,
          checkpoint_id: record.checkpointId
        }
      },
      checkpoint: {
        ...record.checkpointJson,
        pending_sends: []
      },
      metadata: record.metadataJson,
      pendingWrites: record.pendingWritesJson
    };

    if (record.parentCheckpointId) {
      tuple.parentConfig = {
        configurable: {
          thread_id: record.threadId,
          checkpoint_ns: record.checkpointNamespace,
          checkpoint_id: record.parentCheckpointId
        }
      };
    }

    return tuple;
  }

  async *list(config: RunnableConfig) {
    const threadId = config.configurable?.thread_id;
    const checkpointNamespace = config.configurable?.checkpoint_ns ?? "";

    if (!threadId) {
      return;
    }

    for await (const record of this.persistence.list(threadId, checkpointNamespace)) {
      yield {
        config: {
          configurable: {
            thread_id: record.threadId,
            checkpoint_ns: record.checkpointNamespace,
            checkpoint_id: record.checkpointId
          }
        },
        checkpoint: {
          ...record.checkpointJson,
          pending_sends: []
        },
        metadata: record.metadataJson,
        pendingWrites: record.pendingWritesJson
      };
    }
  }

  async put(config: RunnableConfig, checkpoint: Checkpoint, metadata: CheckpointMetadata) {
    const preparedCheckpoint = JSON.parse(
      JSON.stringify(copyCheckpoint(checkpoint))
    ) as Record<string, unknown>;
    delete preparedCheckpoint.pending_sends;

    const threadId = config.configurable?.thread_id;
    const checkpointNamespace = config.configurable?.checkpoint_ns ?? "";

    if (!threadId) {
      throw new Error(
        'Failed to persist checkpoint: missing "thread_id" in configurable config.'
      );
    }

    await this.persistence.put({
      workflowName: this.workflowName,
      threadId,
      checkpointNamespace,
      checkpointId: checkpoint.id,
      checkpointJson: preparedCheckpoint as unknown as Checkpoint,
      metadataJson: metadata,
      parentCheckpointId: getRunnableCheckpointId(config) ?? null,
      pendingWritesJson: []
    });

    return {
      configurable: {
        thread_id: threadId,
        checkpoint_ns: checkpointNamespace,
        checkpoint_id: checkpoint.id
      }
    };
  }

  async putWrites(config: RunnableConfig, writes: Array<[string, unknown]>, taskId: string) {
    const threadId = config.configurable?.thread_id;
    const checkpointNamespace = config.configurable?.checkpoint_ns ?? "";
    const checkpointId = config.configurable?.checkpoint_id;

    if (!threadId || !checkpointId) {
      return;
    }

    const normalizedWrites = writes.map(
      ([channel, value]) => [taskId, channel, value] as WorkflowPendingWrite
    );

    await this.persistence.putWrites(
      threadId,
      checkpointNamespace,
      checkpointId,
      normalizedWrites
    );
  }
}

const saverCache = new Map<string, DurableWorkflowCheckpointSaver>();

export function getDurableWorkflowCheckpointSaver(workflowName: string) {
  if (!saverCache.has(workflowName)) {
    saverCache.set(workflowName, new DurableWorkflowCheckpointSaver(workflowName));
  }

  return saverCache.get(workflowName)!;
}
