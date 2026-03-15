import { integer, jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { cycles, projects, tasks } from "./cycle";
import { members, teams } from "./team";

export const artifactTypeEnum = pgEnum("artifact_type", [
  "strategy_card",
  "topic_brief",
  "research_summary",
  "article_draft",
  "social_post",
  "retrospective",
  "memo",
  "other"
]);
export const artifactStatusEnum = pgEnum("artifact_status", [
  "draft",
  "in_review",
  "approved",
  "rejected",
  "published",
  "archived"
]);
export const artifactReviewStatusEnum = pgEnum("artifact_review_status", [
  "pending",
  "approved",
  "changes_requested",
  "rejected"
]);
export const feedbackSourceEnum = pgEnum("feedback_source", [
  "owner",
  "editor",
  "system",
  "performance"
]);
export const feedbackSignalTypeEnum = pgEnum("feedback_signal_type", [
  "quality",
  "preference",
  "correction",
  "positive",
  "negative"
]);

export const artifacts = pgTable("artifacts", {
  id: uuid("id").defaultRandom().primaryKey(),
  teamId: uuid("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
  cycleId: uuid("cycle_id")
    .notNull()
    .references(() => cycles.id, { onDelete: "cascade" }),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
  taskId: uuid("task_id").references(() => tasks.id, { onDelete: "set null" }),
  artifactType: artifactTypeEnum("artifact_type").notNull(),
  title: text("title").notNull(),
  version: integer("version").notNull().default(1),
  status: artifactStatusEnum("status").notNull().default("draft"),
  authorMemberId: uuid("author_member_id").references(() => members.id, { onDelete: "set null" }),
  reviewerMemberId: uuid("reviewer_member_id").references(() => members.id, {
    onDelete: "set null"
  }),
  summary: text("summary"),
  bodyMarkdown: text("body_markdown"),
  storageUri: text("storage_uri"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});

export const artifactReviews = pgTable("artifact_reviews", {
  id: uuid("id").defaultRandom().primaryKey(),
  artifactId: uuid("artifact_id")
    .notNull()
    .references(() => artifacts.id, { onDelete: "cascade" }),
  teamId: uuid("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
  reviewerMemberId: uuid("reviewer_member_id").references(() => members.id, {
    onDelete: "set null"
  }),
  status: artifactReviewStatusEnum("status").notNull().default("pending"),
  feedbackSummary: text("feedback_summary"),
  checklist: jsonb("checklist").$type<Record<string, unknown>>().notNull().default({}),
  reviewNotesMarkdown: text("review_notes_markdown"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});

export const feedbackSignals = pgTable("feedback_signals", {
  id: uuid("id").defaultRandom().primaryKey(),
  teamId: uuid("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
  cycleId: uuid("cycle_id").references(() => cycles.id, { onDelete: "set null" }),
  taskId: uuid("task_id").references(() => tasks.id, { onDelete: "set null" }),
  artifactId: uuid("artifact_id").references(() => artifacts.id, { onDelete: "set null" }),
  memberId: uuid("member_id").references(() => members.id, { onDelete: "set null" }),
  source: feedbackSourceEnum("source").notNull(),
  signalType: feedbackSignalTypeEnum("signal_type").notNull(),
  summary: text("summary").notNull(),
  payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default({}),
  weight: integer("weight").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});
