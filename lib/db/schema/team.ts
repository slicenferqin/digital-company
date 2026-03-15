import { sql } from "drizzle-orm";
import { boolean, integer, jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

const emptyTextArray = sql`'{}'::text[]`;

export const teamStatusEnum = pgEnum("team_status", ["draft", "active", "paused", "archived"]);
export const approvalModeEnum = pgEnum("approval_mode", ["manual", "progressive", "auto"]);
export const roleDepartmentEnum = pgEnum("role_department", [
  "management",
  "strategy",
  "research",
  "writing",
  "editing",
  "distribution",
  "operations"
]);
export const memberStatusEnum = pgEnum("member_status", ["active", "idle", "paused", "archived"]);
export const escalationTargetEnum = pgEnum("escalation_target", [
  "manager",
  "chief_of_staff",
  "owner"
]);
export const preferenceProfileTypeEnum = pgEnum("preference_profile_type", [
  "owner",
  "brand",
  "channel",
  "team"
]);

export const teams = pgTable("teams", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  businessName: text("business_name").notNull(),
  businessPositioning: text("business_positioning"),
  brandVoice: text("brand_voice"),
  targetAudience: text("target_audience"),
  coreOffer: text("core_offer"),
  primaryChannels: text("primary_channels").array().notNull().default(emptyTextArray),
  status: teamStatusEnum("status").notNull().default("draft"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});

export const teamConfigs = pgTable("team_configs", {
  id: uuid("id").defaultRandom().primaryKey(),
  teamId: uuid("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
  approvalMode: approvalModeEnum("approval_mode").notNull().default("manual"),
  brandRules: jsonb("brand_rules").$type<Record<string, unknown>>().notNull().default({}),
  forbiddenPatterns: text("forbidden_patterns").array().notNull().default(emptyTextArray),
  channelRules: jsonb("channel_rules").$type<Record<string, unknown>>().notNull().default({}),
  costBudgetPerCycleCents: integer("cost_budget_per_cycle_cents").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});

export const roles = pgTable("roles", {
  id: uuid("id").defaultRandom().primaryKey(),
  teamId: uuid("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  department: roleDepartmentEnum("department").notNull(),
  responsibilities: text("responsibilities").array().notNull().default(emptyTextArray),
  headcountLimit: integer("headcount_limit").notNull().default(1),
  approvalScope: text("approval_scope").array().notNull().default(emptyTextArray),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});

export const members = pgTable("members", {
  id: uuid("id").defaultRandom().primaryKey(),
  teamId: uuid("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
  roleId: uuid("role_id")
    .notNull()
    .references(() => roles.id, { onDelete: "restrict" }),
  name: text("name").notNull(),
  personaSummary: text("persona_summary"),
  strengths: text("strengths").array().notNull().default(emptyTextArray),
  weaknesses: text("weaknesses").array().notNull().default(emptyTextArray),
  specialtyTags: text("specialty_tags").array().notNull().default(emptyTextArray),
  currentLoad: integer("current_load").notNull().default(0),
  status: memberStatusEnum("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});

export const escalationPolicies = pgTable("escalation_policies", {
  id: uuid("id").defaultRandom().primaryKey(),
  teamId: uuid("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
  roleId: uuid("role_id").references(() => roles.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  triggerType: text("trigger_type").notNull(),
  triggerConfig: jsonb("trigger_config").$type<Record<string, unknown>>().notNull().default({}),
  escalationTarget: escalationTargetEnum("escalation_target").notNull().default("owner"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});

export const preferenceProfiles = pgTable("preference_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  teamId: uuid("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
  profileType: preferenceProfileTypeEnum("profile_type").notNull(),
  name: text("name").notNull(),
  preferences: jsonb("preferences").$type<Record<string, unknown>>().notNull().default({}),
  source: text("source"),
  version: integer("version").notNull().default(1),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});
