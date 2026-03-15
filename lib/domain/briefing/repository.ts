import { getDatabase } from "@/lib/db/client";
import { briefings } from "@/lib/db/schema";

import type { Briefing, CreateBriefingInput } from "./types";

function mapBriefing(row: typeof briefings.$inferSelect): Briefing {
  return {
    id: row.id,
    teamId: row.teamId,
    cycleId: row.cycleId,
    authorMemberId: row.authorMemberId,
    type: row.type,
    status: row.status,
    title: row.title,
    summary: row.summary,
    bodyMarkdown: row.bodyMarkdown,
    highlights: row.highlights,
    risks: row.risks,
    actionItems: row.actionItems,
    metadata: row.metadata,
    publishedAt: row.publishedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}

export async function createBriefing(input: CreateBriefingInput, database = getDatabase()) {
  const [row] = await database
    .insert(briefings)
    .values({
      teamId: input.teamId,
      cycleId: input.cycleId ?? null,
      authorMemberId: input.authorMemberId ?? null,
      type: input.type,
      status: input.status ?? "draft",
      title: input.title,
      summary: input.summary ?? null,
      bodyMarkdown: input.bodyMarkdown ?? null,
      highlights: input.highlights ?? [],
      risks: input.risks ?? [],
      actionItems: input.actionItems ?? [],
      metadata: input.metadata ?? {},
      publishedAt: input.publishedAt ?? null
    })
    .returning();

  return mapBriefing(row);
}
