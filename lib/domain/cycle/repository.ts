import { eq } from "drizzle-orm";

import { getDatabase } from "@/lib/db/client";
import { cycles, projects, tasks } from "@/lib/db/schema";

import type { CreateCycleInput, CreateProjectInput, CreateTaskInput, Cycle, Project, Task } from "./types";

function mapCycle(row: typeof cycles.$inferSelect): Cycle {
  return {
    id: row.id,
    teamId: row.teamId,
    cycleType: row.cycleType,
    goalSummary: row.goalSummary,
    priorityFocus: row.priorityFocus,
    status: row.status,
    startAt: row.startAt,
    endAt: row.endAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}

function mapProject(row: typeof projects.$inferSelect): Project {
  return {
    id: row.id,
    teamId: row.teamId,
    cycleId: row.cycleId,
    type: row.type,
    title: row.title,
    goal: row.goal,
    priority: row.priority,
    ownerMemberId: row.ownerMemberId,
    status: row.status,
    metadata: row.metadata,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}

function mapTask(row: typeof tasks.$inferSelect): Task {
  return {
    id: row.id,
    teamId: row.teamId,
    cycleId: row.cycleId,
    projectId: row.projectId,
    assignedMemberId: row.assignedMemberId,
    taskType: row.taskType,
    title: row.title,
    inputContext: row.inputContext,
    status: row.status,
    blockedReason: row.blockedReason,
    requiresOwnerApproval: row.requiresOwnerApproval,
    priority: row.priority,
    dueAt: row.dueAt,
    startedAt: row.startedAt,
    completedAt: row.completedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}

export async function createCycle(input: CreateCycleInput, database = getDatabase()) {
  const [row] = await database
    .insert(cycles)
    .values({
      teamId: input.teamId,
      cycleType: input.cycleType ?? "weekly",
      goalSummary: input.goalSummary,
      priorityFocus: input.priorityFocus,
      status: input.status ?? "draft",
      startAt: input.startAt,
      endAt: input.endAt
    })
    .returning();

  return mapCycle(row);
}

export async function createProject(input: CreateProjectInput, database = getDatabase()) {
  const [row] = await database
    .insert(projects)
    .values({
      teamId: input.teamId,
      cycleId: input.cycleId,
      type: input.type ?? "strategy",
      title: input.title,
      goal: input.goal,
      priority: input.priority ?? 0,
      ownerMemberId: input.ownerMemberId ?? null,
      status: input.status ?? "planned",
      metadata: input.metadata ?? {}
    })
    .returning();

  return mapProject(row);
}

export async function createTask(input: CreateTaskInput, database = getDatabase()) {
  const [row] = await database
    .insert(tasks)
    .values({
      teamId: input.teamId,
      cycleId: input.cycleId,
      projectId: input.projectId,
      assignedMemberId: input.assignedMemberId ?? null,
      taskType: input.taskType,
      title: input.title,
      inputContext: input.inputContext ?? {},
      status: input.status ?? "pending",
      blockedReason: input.blockedReason ?? null,
      requiresOwnerApproval: input.requiresOwnerApproval ?? false,
      priority: input.priority ?? 0,
      dueAt: input.dueAt ?? null
    })
    .returning();

  return mapTask(row);
}

export async function listTasksForCycle(cycleId: string, database = getDatabase()) {
  const rows = await database.select().from(tasks).where(eq(tasks.cycleId, cycleId));
  return rows.map(mapTask);
}
