import { sql } from "drizzle-orm";
import { jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { cycles } from "./cycle";
import { members, teams } from "./team";

const emptyTextArray = sql`'{}'::text[]`;

export const briefingTypeEnum = pgEnum("briefing_type", [
  "daily",
  "weekly",
  "cycle",
  "escalation",
  "decision"
]);
export const briefingStatusEnum = pgEnum("briefing_status", ["draft", "published", "archived"]);

export const briefings = pgTable("briefings", {
  id: uuid("id").defaultRandom().primaryKey(),
  teamId: uuid("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
  cycleId: uuid("cycle_id").references(() => cycles.id, { onDelete: "set null" }),
  authorMemberId: uuid("author_member_id").references(() => members.id, { onDelete: "set null" }),
  type: briefingTypeEnum("type").notNull(),
  status: briefingStatusEnum("status").notNull().default("draft"),
  title: text("title").notNull(),
  summary: text("summary"),
  bodyMarkdown: text("body_markdown"),
  highlights: text("highlights").array().notNull().default(emptyTextArray),
  risks: text("risks").array().notNull().default(emptyTextArray),
  actionItems: text("action_items").array().notNull().default(emptyTextArray),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});
