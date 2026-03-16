import { eq } from "drizzle-orm";

import { getDatabase } from "@/lib/db/client";
import { decisions } from "@/lib/db/schema";

import type { CreateDecisionInput, Decision, UpdateDecisionInput } from "./types";

function mapDecision(row: typeof decisions.$inferSelect): Decision {
  return {
    id: row.id,
    teamId: row.teamId,
    cycleId: row.cycleId,
    relatedBriefingId: row.relatedBriefingId,
  requestedByMemberId: row.requestedByMemberId,
  type: row.type,
  title: row.title,
  summary: row.summary,
  contextMarkdown: row.contextMarkdown,
  status: row.status,
  workflowThreadId: row.workflowThreadId,
  workflowName: row.workflowName,
  workflowStatus: row.workflowStatus,
  resolution: row.resolution,
  resolutionPayload: row.resolutionPayload,
    decidedAt: row.decidedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}

export async function createDecision(input: CreateDecisionInput, database = getDatabase()) {
  const [row] = await database
    .insert(decisions)
    .values({
      teamId: input.teamId,
      cycleId: input.cycleId ?? null,
      relatedBriefingId: input.relatedBriefingId ?? null,
      requestedByMemberId: input.requestedByMemberId ?? null,
      type: input.type ?? "approval",
      title: input.title,
      summary: input.summary ?? null,
      contextMarkdown: input.contextMarkdown ?? null,
      workflowThreadId: input.workflowThreadId ?? null,
      workflowName: input.workflowName ?? null,
      workflowStatus: input.workflowStatus ?? "not_started"
    })
    .returning();

  return mapDecision(row);
}

export async function getDecisionById(decisionId: string, database = getDatabase()) {
  const [row] = await database.select().from(decisions).where(eq(decisions.id, decisionId)).limit(1);
  return row ? mapDecision(row) : null;
}

export async function listDecisionsForCycle(cycleId: string, database = getDatabase()) {
  const rows = await database.select().from(decisions).where(eq(decisions.cycleId, cycleId));
  return rows.map(mapDecision);
}

export async function updateDecision(input: UpdateDecisionInput, database = getDatabase()) {
  const [row] = await database
    .update(decisions)
    .set({
      status: input.status,
      workflowThreadId: input.workflowThreadId,
      workflowName: input.workflowName,
      workflowStatus: input.workflowStatus,
      resolution: input.resolution,
      resolutionPayload: input.resolutionPayload,
      decidedAt: input.decidedAt,
      updatedAt: new Date()
    })
    .where(eq(decisions.id, input.decisionId))
    .returning();

  return row ? mapDecision(row) : null;
}
