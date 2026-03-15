import { boolean, integer, jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { members, teams } from "./team";

export const cycleTypeEnum = pgEnum("cycle_type", ["weekly", "campaign", "custom"]);
export const cycleStatusEnum = pgEnum("cycle_status", [
  "draft",
  "planned",
  "active",
  "paused",
  "completed",
  "cancelled"
]);
export const projectTypeEnum = pgEnum("project_type", [
  "strategy",
  "research",
  "writing",
  "editing",
  "distribution",
  "retrospective"
]);
export const projectStatusEnum = pgEnum("project_status", [
  "planned",
  "active",
  "completed",
  "cancelled"
]);
export const taskStatusEnum = pgEnum("task_status", [
  "pending",
  "in_progress",
  "blocked",
  "in_review",
  "completed",
  "cancelled"
]);

export const cycles = pgTable("cycles", {
  id: uuid("id").defaultRandom().primaryKey(),
  teamId: uuid("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
  cycleType: cycleTypeEnum("cycle_type").notNull().default("weekly"),
  goalSummary: text("goal_summary").notNull(),
  priorityFocus: text("priority_focus").notNull(),
  status: cycleStatusEnum("status").notNull().default("draft"),
  startAt: timestamp("start_at", { withTimezone: true }).notNull(),
  endAt: timestamp("end_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});

export const projects = pgTable("projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  teamId: uuid("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
  cycleId: uuid("cycle_id")
    .notNull()
    .references(() => cycles.id, { onDelete: "cascade" }),
  type: projectTypeEnum("type").notNull().default("strategy"),
  title: text("title").notNull(),
  goal: text("goal").notNull(),
  priority: integer("priority").notNull().default(0),
  ownerMemberId: uuid("owner_member_id").references(() => members.id, { onDelete: "set null" }),
  status: projectStatusEnum("status").notNull().default("planned"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});

export const tasks = pgTable("tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  teamId: uuid("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
  cycleId: uuid("cycle_id")
    .notNull()
    .references(() => cycles.id, { onDelete: "cascade" }),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  assignedMemberId: uuid("assigned_member_id").references(() => members.id, {
    onDelete: "set null"
  }),
  taskType: text("task_type").notNull(),
  title: text("title").notNull(),
  inputContext: jsonb("input_context").$type<Record<string, unknown>>().notNull().default({}),
  status: taskStatusEnum("status").notNull().default("pending"),
  blockedReason: text("blocked_reason"),
  requiresOwnerApproval: boolean("requires_owner_approval").notNull().default(false),
  priority: integer("priority").notNull().default(0),
  dueAt: timestamp("due_at", { withTimezone: true }),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});
