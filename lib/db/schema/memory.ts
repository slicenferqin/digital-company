import { sql } from "drizzle-orm";
import { integer, jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { artifacts } from "./artifact";
import { cycles, tasks } from "./cycle";
import { members, teams } from "./team";

const emptyTextArray = sql`'{}'::text[]`;

export const memoryTypeEnum = pgEnum("memory_type", [
  "rule",
  "preference",
  "experience",
  "feedback",
  "summary"
]);

export const memoryEntries = pgTable("memory_entries", {
  id: uuid("id").defaultRandom().primaryKey(),
  teamId: uuid("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
  cycleId: uuid("cycle_id").references(() => cycles.id, { onDelete: "set null" }),
  sourceTaskId: uuid("source_task_id").references(() => tasks.id, { onDelete: "set null" }),
  sourceArtifactId: uuid("source_artifact_id").references(() => artifacts.id, {
    onDelete: "set null"
  }),
  authorMemberId: uuid("author_member_id").references(() => members.id, { onDelete: "set null" }),
  type: memoryTypeEnum("type").notNull(),
  title: text("title").notNull(),
  summary: text("summary"),
  bodyMarkdown: text("body_markdown"),
  tags: text("tags").array().notNull().default(emptyTextArray),
  importance: integer("importance").notNull().default(0),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
  effectiveFrom: timestamp("effective_from", { withTimezone: true }),
  effectiveTo: timestamp("effective_to", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});
