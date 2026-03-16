import { createMember, createRole, createTeam } from "@/lib/domain/team/repository";
import type {
  CreateMemberInput,
  CreateRoleInput,
  Member,
  Role,
  RoleDepartment,
  Team,
  TeamConfig
} from "@/lib/domain/team/types";

import {
  parseTeamBootstrapInput,
  resolveBusinessProfile,
  type TeamBootstrapInput
} from "./business-profile";

type BootstrapDependencies = {
  createTeam: typeof createTeam;
  createRole: typeof createRole;
  createMember: typeof createMember;
};

const defaultDependencies: BootstrapDependencies = {
  createTeam,
  createRole,
  createMember
};

type FoundingRoleBlueprint = {
  role: Omit<CreateRoleInput, "teamId">;
  members: Array<Omit<CreateMemberInput, "teamId" | "roleId">>;
};

const foundingRoleBlueprints: FoundingRoleBlueprint[] = [
  {
    role: {
      name: "GM",
      department: "management",
      responsibilities: ["设定本周期主线", "对齐团队优先级", "管理跨角色协作"],
      approvalScope: ["cycle_plan", "priority_shift"],
      headcountLimit: 1,
      sortOrder: 10
    },
    members: [
      {
        name: "GM",
        personaSummary: "对业务目标负责，负责把内容增长目标拆成可执行方向。",
        strengths: ["目标拆解", "优先级判断"],
        weaknesses: ["不直接产出最终内容"],
        specialtyTags: ["management", "execution"]
      }
    ]
  },
  {
    role: {
      name: "Chief of Staff",
      department: "management",
      responsibilities: ["压缩简报", "组织纪要", "升级风险与待决策事项"],
      approvalScope: ["briefing", "escalation"],
      headcountLimit: 1,
      sortOrder: 20
    },
    members: [
      {
        name: "Chief of Staff",
        personaSummary: "承上启下，把团队过程翻译成老板能快速消费的管理材料。",
        strengths: ["信息压缩", "风险升级"],
        weaknesses: ["不负责深度研究"],
        specialtyTags: ["briefing", "coordination"]
      }
    ]
  },
  {
    role: {
      name: "Strategist",
      department: "strategy",
      responsibilities: ["制定周期策略", "定义选题方向", "管理内容主张"],
      approvalScope: ["content_strategy"],
      headcountLimit: 1,
      sortOrder: 30
    },
    members: [
      {
        name: "Strategist",
        personaSummary: "把业务目标翻译成内容策略与渠道重点。",
        strengths: ["策略规划", "内容选题"],
        weaknesses: ["不做终稿抛光"],
        specialtyTags: ["strategy", "topic"]
      }
    ]
  },
  {
    role: {
      name: "Researcher",
      department: "research",
      responsibilities: ["研究用户问题", "整理行业信息", "沉淀研究摘要"],
      approvalScope: [],
      headcountLimit: 2,
      sortOrder: 40
    },
    members: [
      {
        name: "Researcher",
        personaSummary: "持续收集可支撑选题和写作的事实、素材与洞察。",
        strengths: ["资料收集", "结构化摘要"],
        weaknesses: ["不对最终品牌表达负责"],
        specialtyTags: ["research", "insight"]
      },
      {
        name: "Trend Scout",
        personaSummary: "补充新近趋势、渠道话题与竞争观察，为研究提供第二视角。",
        strengths: ["趋势扫描", "热点提炼"],
        weaknesses: ["不负责沉淀最终研究文档"],
        specialtyTags: ["research", "trend"]
      }
    ]
  },
  {
    role: {
      name: "Writer",
      department: "writing",
      responsibilities: ["产出长文初稿", "生成短内容草稿", "根据 brief 组织结构"],
      approvalScope: [],
      headcountLimit: 1,
      sortOrder: 50
    },
    members: [
      {
        name: "Writer",
        personaSummary: "把 brief 和研究结果转成可审核的内容草稿。",
        strengths: ["起草", "结构组织"],
        weaknesses: ["不负责最终审核标准"],
        specialtyTags: ["writing", "draft"]
      }
    ]
  },
  {
    role: {
      name: "Editor",
      department: "editing",
      responsibilities: ["审核内容质量", "控制品牌一致性", "减少返工"],
      approvalScope: ["quality_gate"],
      headcountLimit: 1,
      sortOrder: 60
    },
    members: [
      {
        name: "Editor",
        personaSummary: "为交付把关，确保内容质量、品牌边界与可发布性。",
        strengths: ["质量控制", "风格校准"],
        weaknesses: ["不负责前期研究扩展"],
        specialtyTags: ["editing", "review"]
      }
    ]
  },
  {
    role: {
      name: "Distribution Operator",
      department: "distribution",
      responsibilities: ["整理发布清单", "生成渠道改写", "准备分发素材"],
      approvalScope: [],
      headcountLimit: 1,
      sortOrder: 70
    },
    members: [
      {
        name: "Distribution Operator",
        personaSummary: "把通过审核的内容进一步适配到渠道分发动作。",
        strengths: ["渠道适配", "执行清单"],
        weaknesses: ["不负责主线策略"],
        specialtyTags: ["distribution", "ops"]
      }
    ]
  }
];

function buildRoleInput(teamId: string, role: FoundingRoleBlueprint["role"]): CreateRoleInput {
  return {
    teamId,
    name: role.name,
    department: role.department as RoleDepartment,
    responsibilities: role.responsibilities,
    approvalScope: role.approvalScope,
    headcountLimit: role.headcountLimit,
    sortOrder: role.sortOrder
  };
}

function buildMemberInput(
  teamId: string,
  roleId: string,
  member: FoundingRoleBlueprint["members"][number]
): CreateMemberInput {
  return {
    teamId,
    roleId,
    name: member.name,
    personaSummary: member.personaSummary,
    strengths: member.strengths,
    weaknesses: member.weaknesses,
    specialtyTags: member.specialtyTags
  };
}

export interface BootstrapTeamResult {
  profile: ReturnType<typeof resolveBusinessProfile>;
  team: Team;
  teamConfig: TeamConfig;
  roles: Role[];
  members: Member[];
}

export async function bootstrapTeam(
  input: TeamBootstrapInput,
  dependencies: BootstrapDependencies = defaultDependencies
): Promise<BootstrapTeamResult> {
  const parsedInput = parseTeamBootstrapInput(input);
  const profile = resolveBusinessProfile(parsedInput);

  const { team, teamConfig } = await dependencies.createTeam({
    name: profile.teamName,
    businessName: profile.businessName,
    businessPositioning: profile.businessPositioning ?? undefined,
    brandVoice: profile.brandVoice ?? undefined,
    targetAudience: profile.targetAudience ?? undefined,
    coreOffer: profile.coreOffer ?? undefined,
    primaryChannels: profile.primaryChannels
  });

  const createdRoles: Role[] = [];
  const createdMembers: Member[] = [];

  for (const blueprint of foundingRoleBlueprints) {
    const role = await dependencies.createRole(buildRoleInput(team.id, blueprint.role));
    createdRoles.push(role);

    for (const memberBlueprint of blueprint.members) {
      const member = await dependencies.createMember(
        buildMemberInput(team.id, role.id, memberBlueprint)
      );
      createdMembers.push(member);
    }
  }

  return {
    profile,
    team,
    teamConfig,
    roles: createdRoles,
    members: createdMembers
  };
}
