export type TeamStatus = "draft" | "active" | "paused" | "archived";
export type ApprovalMode = "manual" | "progressive" | "auto";
export type RoleDepartment =
  | "management"
  | "strategy"
  | "research"
  | "writing"
  | "editing"
  | "distribution"
  | "operations";
export type MemberStatus = "active" | "idle" | "paused" | "archived";
export type EscalationTarget = "manager" | "chief_of_staff" | "owner";
export type PreferenceProfileType = "owner" | "brand" | "channel" | "team";

export type JsonMap = Record<string, unknown>;

export interface Team {
  id: string;
  name: string;
  businessName: string;
  businessPositioning: string | null;
  brandVoice: string | null;
  targetAudience: string | null;
  coreOffer: string | null;
  primaryChannels: string[];
  status: TeamStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamConfig {
  id: string;
  teamId: string;
  approvalMode: ApprovalMode;
  brandRules: JsonMap;
  forbiddenPatterns: string[];
  channelRules: JsonMap;
  costBudgetPerCycleCents: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Role {
  id: string;
  teamId: string;
  name: string;
  department: RoleDepartment;
  responsibilities: string[];
  headcountLimit: number;
  approvalScope: string[];
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Member {
  id: string;
  teamId: string;
  roleId: string;
  name: string;
  personaSummary: string | null;
  strengths: string[];
  weaknesses: string[];
  specialtyTags: string[];
  currentLoad: number;
  status: MemberStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface EscalationPolicy {
  id: string;
  teamId: string;
  roleId: string | null;
  name: string;
  triggerType: string;
  triggerConfig: JsonMap;
  escalationTarget: EscalationTarget;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PreferenceProfile {
  id: string;
  teamId: string;
  profileType: PreferenceProfileType;
  name: string;
  preferences: JsonMap;
  source: string | null;
  version: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePreferenceProfileInput {
  teamId: string;
  profileType: PreferenceProfileType;
  name: string;
  preferences: JsonMap;
  source?: string;
  version?: number;
  active?: boolean;
}

export interface CreateTeamInput {
  name: string;
  businessName: string;
  businessPositioning?: string;
  brandVoice?: string;
  targetAudience?: string;
  coreOffer?: string;
  primaryChannels?: string[];
  status?: TeamStatus;
  config?: Partial<Pick<TeamConfig, "approvalMode" | "brandRules" | "forbiddenPatterns" | "channelRules" | "costBudgetPerCycleCents">>;
}

export interface CreateRoleInput {
  teamId: string;
  name: string;
  department: RoleDepartment;
  responsibilities?: string[];
  headcountLimit?: number;
  approvalScope?: string[];
  sortOrder?: number;
}

export interface CreateMemberInput {
  teamId: string;
  roleId: string;
  name: string;
  personaSummary?: string;
  strengths?: string[];
  weaknesses?: string[];
  specialtyTags?: string[];
  currentLoad?: number;
  status?: MemberStatus;
}
