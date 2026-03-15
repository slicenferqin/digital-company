import { desc, eq } from "drizzle-orm";

import { getDatabase } from "@/lib/db/client";
import { memoryEntries } from "@/lib/db/schema";

import type { CreateMemoryEntryInput, MemoryEntry, PlanningMemoryInput } from "./types";

function mapMemoryEntry(row: typeof memoryEntries.$inferSelect): MemoryEntry {
  return {
    id: row.id,
    teamId: row.teamId,
    cycleId: row.cycleId,
    sourceTaskId: row.sourceTaskId,
    sourceArtifactId: row.sourceArtifactId,
    authorMemberId: row.authorMemberId,
    type: row.type,
    title: row.title,
    summary: row.summary,
    bodyMarkdown: row.bodyMarkdown,
    tags: row.tags,
    importance: row.importance,
    metadata: row.metadata,
    effectiveFrom: row.effectiveFrom,
    effectiveTo: row.effectiveTo,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}

function mapPlanningMemoryInput(row: typeof memoryEntries.$inferSelect): PlanningMemoryInput {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    summary: row.summary,
    tags: row.tags,
    importance: row.importance
  };
}

export async function createMemoryEntry(input: CreateMemoryEntryInput, database = getDatabase()) {
  const [row] = await database
    .insert(memoryEntries)
    .values({
      teamId: input.teamId,
      cycleId: input.cycleId ?? null,
      sourceTaskId: input.sourceTaskId ?? null,
      sourceArtifactId: input.sourceArtifactId ?? null,
      authorMemberId: input.authorMemberId ?? null,
      type: input.type,
      title: input.title,
      summary: input.summary ?? null,
      bodyMarkdown: input.bodyMarkdown ?? null,
      tags: input.tags ?? [],
      importance: input.importance ?? 0,
      metadata: input.metadata ?? {},
      effectiveFrom: input.effectiveFrom ?? null,
      effectiveTo: input.effectiveTo ?? null
    })
    .returning();

  return mapMemoryEntry(row);
}

export async function fetchMemoryInputsForPlanning(
  teamId: string,
  database = getDatabase(),
  limit = 20
) {
  const now = new Date();

  const rows = await database
    .select()
    .from(memoryEntries)
    .where(eq(memoryEntries.teamId, teamId))
    .orderBy(desc(memoryEntries.importance), desc(memoryEntries.createdAt))
    .limit(limit);

  return rows
    .filter((row) => {
      const validFrom = row.effectiveFrom;
      const validTo = row.effectiveTo;

      if (validFrom && validFrom > now) {
        return false;
      }

      if (validTo && validTo < now) {
        return false;
      }

      return true;
    })
    .map(mapPlanningMemoryInput);
}
