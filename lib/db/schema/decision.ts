import { jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { briefings } from "./briefing";
import { cycles } from "./cycle";
import { members, teams } from "./team";

export const decisionTypeEnum = pgEnum("decision_type", [
  "approval",
  "priority",
  "policy",
  "publish",
  "other"
]);
export const decisionStatusEnum = pgEnum("decision_status", [
  "pending",
  "approved",
  "rejected",
  "superseded"
]);

export const decisions = pgTable("decisions", {
  id: uuid("id").defaultRandom().primaryKey(),
  teamId: uuid("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
  cycleId: uuid("cycle_id").references(() => cycles.id, { onDelete: "set null" }),
  relatedBriefingId: uuid("related_briefing_id").references(() => briefings.id, {
    onDelete: "set null"
  }),
  requestedByMemberId: uuid("requested_by_member_id").references(() => members.id, {
    onDelete: "set null"
  }),
  type: decisionTypeEnum("type").notNull().default("approval"),
  title: text("title").notNull(),
  summary: text("summary"),
  contextMarkdown: text("context_markdown"),
  status: decisionStatusEnum("status").notNull().default("pending"),
  resolution: text("resolution"),
  resolutionPayload: jsonb("resolution_payload")
    .$type<Record<string, unknown>>()
    .notNull()
    .default({}),
  decidedAt: timestamp("decided_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});
