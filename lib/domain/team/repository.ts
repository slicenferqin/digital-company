import { and, eq } from "drizzle-orm";

import { getDatabase } from "@/lib/db/client";
import { members, preferenceProfiles, roles, teamConfigs, teams } from "@/lib/db/schema";

import type {
  CreateMemberInput,
  CreatePreferenceProfileInput,
  CreateRoleInput,
  CreateTeamInput,
  Member,
  PreferenceProfile,
  Role,
  Team,
  TeamConfig
} from "./types";

function mapTeam(row: typeof teams.$inferSelect): Team {
  return {
    id: row.id,
    name: row.name,
    businessName: row.businessName,
    businessPositioning: row.businessPositioning,
    brandVoice: row.brandVoice,
    targetAudience: row.targetAudience,
    coreOffer: row.coreOffer,
    primaryChannels: row.primaryChannels,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}

function mapTeamConfig(row: typeof teamConfigs.$inferSelect): TeamConfig {
  return {
    id: row.id,
    teamId: row.teamId,
    approvalMode: row.approvalMode,
    brandRules: row.brandRules,
    forbiddenPatterns: row.forbiddenPatterns,
    channelRules: row.channelRules,
    costBudgetPerCycleCents: row.costBudgetPerCycleCents,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}

function mapRole(row: typeof roles.$inferSelect): Role {
  return {
    id: row.id,
    teamId: row.teamId,
    name: row.name,
    department: row.department,
    responsibilities: row.responsibilities,
    headcountLimit: row.headcountLimit,
    approvalScope: row.approvalScope,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}

function mapMember(row: typeof members.$inferSelect): Member {
  return {
    id: row.id,
    teamId: row.teamId,
    roleId: row.roleId,
    name: row.name,
    personaSummary: row.personaSummary,
    strengths: row.strengths,
    weaknesses: row.weaknesses,
    specialtyTags: row.specialtyTags,
    currentLoad: row.currentLoad,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}

export async function createTeam(input: CreateTeamInput, database = getDatabase()) {
  return database.transaction(async (tx) => {
    const [teamRow] = await tx
      .insert(teams)
      .values({
        name: input.name,
        businessName: input.businessName,
        businessPositioning: input.businessPositioning ?? null,
        brandVoice: input.brandVoice ?? null,
        targetAudience: input.targetAudience ?? null,
        coreOffer: input.coreOffer ?? null,
        primaryChannels: input.primaryChannels ?? [],
        status: input.status ?? "draft"
      })
      .returning();

    const [configRow] = await tx
      .insert(teamConfigs)
      .values({
        teamId: teamRow.id,
        approvalMode: input.config?.approvalMode ?? "manual",
        brandRules: input.config?.brandRules ?? {},
        forbiddenPatterns: input.config?.forbiddenPatterns ?? [],
        channelRules: input.config?.channelRules ?? {},
        costBudgetPerCycleCents: input.config?.costBudgetPerCycleCents ?? 0
      })
      .returning();

    return {
      team: mapTeam(teamRow),
      teamConfig: mapTeamConfig(configRow)
    };
  });
}

export async function createRole(input: CreateRoleInput, database = getDatabase()) {
  const [row] = await database
    .insert(roles)
    .values({
      teamId: input.teamId,
      name: input.name,
      department: input.department,
      responsibilities: input.responsibilities ?? [],
      headcountLimit: input.headcountLimit ?? 1,
      approvalScope: input.approvalScope ?? [],
      sortOrder: input.sortOrder ?? 0
    })
    .returning();

  return mapRole(row);
}

export async function createMember(input: CreateMemberInput, database = getDatabase()) {
  const [row] = await database
    .insert(members)
    .values({
      teamId: input.teamId,
      roleId: input.roleId,
      name: input.name,
      personaSummary: input.personaSummary ?? null,
      strengths: input.strengths ?? [],
      weaknesses: input.weaknesses ?? [],
      specialtyTags: input.specialtyTags ?? [],
      currentLoad: input.currentLoad ?? 0,
      status: input.status ?? "active"
    })
    .returning();

  return mapMember(row);
}

export async function getTeamById(teamId: string, database = getDatabase()) {
  const [row] = await database.select().from(teams).where(eq(teams.id, teamId)).limit(1);
  return row ? mapTeam(row) : null;
}

export async function listMembersByTeamId(teamId: string, database = getDatabase()) {
  const rows = await database.select().from(members).where(eq(members.teamId, teamId));
  return rows.map(mapMember);
}

export async function listPreferenceProfilesByTeamId(teamId: string, database = getDatabase()) {
  const rows = await database.select().from(preferenceProfiles).where(eq(preferenceProfiles.teamId, teamId));
  return rows.map((row) => ({
    id: row.id,
    teamId: row.teamId,
    profileType: row.profileType,
    name: row.name,
    preferences: row.preferences,
    source: row.source,
    version: row.version,
    active: row.active,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  }));
}

export async function deactivatePreferenceProfiles(
  teamId: string,
  profileType: PreferenceProfile["profileType"],
  name: string,
  database = getDatabase()
) {
  const rows = await database
    .update(preferenceProfiles)
    .set({
      active: false,
      updatedAt: new Date()
    })
    .where(
      and(
        eq(preferenceProfiles.teamId, teamId),
        eq(preferenceProfiles.profileType, profileType),
        eq(preferenceProfiles.name, name)
      )
    )
    .returning();

  return rows.length;
}

export async function createPreferenceProfile(
  input: CreatePreferenceProfileInput,
  database = getDatabase()
) {
  const [row] = await database
    .insert(preferenceProfiles)
    .values({
      teamId: input.teamId,
      profileType: input.profileType,
      name: input.name,
      preferences: input.preferences,
      source: input.source ?? null,
      version: input.version ?? 1,
      active: input.active ?? true
    })
    .returning();

  return {
    id: row.id,
    teamId: row.teamId,
    profileType: row.profileType,
    name: row.name,
    preferences: row.preferences,
    source: row.source,
    version: row.version,
    active: row.active,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}
