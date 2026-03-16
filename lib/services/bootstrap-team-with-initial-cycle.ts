import { createArtifactDraft, updateArtifactStatus } from "@/lib/domain/artifact/repository";
import type { Artifact } from "@/lib/domain/artifact/types";
import type { Briefing } from "@/lib/domain/briefing/types";
import type { Cycle, Project, Task } from "@/lib/domain/cycle/types";
import type { Decision } from "@/lib/domain/decision/types";
import { createPreferenceProfile } from "@/lib/domain/team/repository";
import type {
  Member,
  PreferenceProfile,
  Role,
  Team
} from "@/lib/domain/team/types";
import { teamBootstrapInputSchema, type TeamBootstrapInput } from "@/lib/services/business-profile";
import { applyDraftReviewResult } from "@/lib/services/artifact-versioning";
import { bootstrapTeam, type BootstrapTeamResult } from "@/lib/services/team-bootstrap";
import { runBriefingGraph } from "@/lib/workflows/briefing/graph";
import type { BriefingEvent } from "@/lib/workflows/briefing/state";
import { runCyclePlanningGraph } from "@/lib/workflows/cycle-planning/graph";
import { runProductionGraph } from "@/lib/workflows/production/graph";
import { StubResearchProvider } from "@/lib/workflows/research/providers/stub";
import { runResearchGraph } from "@/lib/workflows/research/graph";

const FIRST_CYCLE_DURATION_DAYS = 7;

function plusDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function readStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function findRoleIdByName(roles: Role[], roleName: string) {
  return roles.find((role) => role.name === roleName)?.id ?? null;
}

function findMemberByRoleName(roles: Role[], members: Member[], roleName: string) {
  const roleId = findRoleIdByName(roles, roleName);

  if (!roleId) {
    return null;
  }

  return members.find((member) => member.roleId === roleId) ?? null;
}

function getTaskByType(tasks: Task[], taskType: string) {
  return tasks.find((task) => task.taskType === taskType) ?? null;
}

function buildDefaultGuidelines(team: Team) {
  const guidelines: string[] = [];

  if (team.brandVoice) {
    guidelines.push(`保持${team.brandVoice}的品牌语气`);

    if (team.brandVoice.includes("直接")) {
      guidelines.push("首段先给结论");
    }

    if (team.brandVoice.includes("克制")) {
      guidelines.push("避免夸张表达");
    }
  }

  if (team.targetAudience) {
    guidelines.push(`始终围绕${team.targetAudience}的真实经营问题展开`);
  }

  return [...new Set(guidelines)];
}

function buildStrategyCardBody(team: Team, cycle: Cycle) {
  return [
    `# 本周期策略卡：${cycle.priorityFocus}`,
    "",
    "## 经营目标",
    `- 周期目标：${cycle.goalSummary}`,
    `- 业务定位：${team.businessPositioning ?? team.coreOffer ?? team.businessName}`,
    `- 目标受众：${team.targetAudience ?? "待补充"}`,
    "",
    "## 渠道重点",
    ...(team.primaryChannels.length > 0
      ? team.primaryChannels.map((channel) => `- ${channel}`)
      : ["- 待补充渠道策略"]),
    "",
    "## 本周期交付要求",
    "- 至少形成 1 个策略卡、1 个研究摘要、1 个旗舰长文 draft、1 份秘书长简报",
    "- 老板只在需要拍板时介入，不参与过程调度"
  ].join("\n");
}

function buildSeedArticleDraft(team: Team, cycle: Cycle, strategyArtifact: Artifact, researchArtifact: Artifact) {
  return [
    `# ${cycle.priorityFocus}：为什么应该从临时 team 升级到持续内容团队`,
    "",
    "## 背景",
    `本周期策略卡已经明确：${strategyArtifact.summary ?? cycle.goalSummary}`,
    `研究摘要进一步指出：${researchArtifact.summary ?? "当前用户更关心持续交付与复盘能力。"}`,
    "",
    "## 核心论点",
    `- ${team.targetAudience ?? "目标用户"}需要的不是一次性文章，而是持续优化的内容生产系统`,
    "- 持续团队能保留上下文、减少重复解释、逐步降低返工成本",
    "- 老板真正关心的是交付与拍板接口，而不是 agent 运行细节",
    "",
    "## 组织方式",
    "- 策略、研究、写作、编辑、分发按周期推进",
    "- 秘书长负责把过程压缩成简报与待决策事项",
    "- 审核不过直接进入返工，不自动伪装成通过"
  ].join("\n");
}

function buildSeedResearchSources(priorityFocus: string) {
  return [
    {
      title: `${priorityFocus} 用户常见疑问`,
      url: "https://example.com/customer-questions",
      snippet: "高意向用户更关心实际交付、持续复盘与团队可控性。",
      publishedAt: null,
      author: "Digital Company Seed",
      domain: "example.com",
      score: 0.92
    },
    {
      title: `${priorityFocus} 内容增长最佳实践`,
      url: "https://example.com/content-ops",
      snippet: "内容团队需要稳定的选题、审核与分发闭环，而不是单次任务式执行。",
      publishedAt: null,
      author: "Digital Company Seed",
      domain: "example.com",
      score: 0.88
    },
    {
      title: `${priorityFocus} 多周期优化信号`,
      url: "https://example.com/iteration-signals",
      snippet: "第二周期的价值在于减少返工、积累偏好、逐步提高资产通过率。",
      publishedAt: null,
      author: "Digital Company Seed",
      domain: "example.com",
      score: 0.84
    }
  ];
}

function buildBriefingEvents(input: {
  strategyArtifact: Artifact;
  researchArtifact: Artifact;
  articleArtifact: Artifact;
  articleTask: Task | null;
}): BriefingEvent[] {
  const occurredAt = new Date().toISOString();
  const escalationTitle = "旗舰长文发布角度待老板确认";

  return [
    {
      id: `${input.strategyArtifact.id}:ready`,
      kind: "artifact_ready",
      severity: "info",
      occurredAt,
      title: "本周期策略卡已形成",
      summary: input.strategyArtifact.summary ?? "策略卡已落库，可作为本周期主线依据。",
      artifactId: input.strategyArtifact.id,
      taskId: input.strategyArtifact.taskId ?? undefined
    },
    {
      id: `${input.researchArtifact.id}:ready`,
      kind: "artifact_ready",
      severity: "info",
      occurredAt,
      title: "研究摘要已完成",
      summary: input.researchArtifact.summary ?? "研究摘要已整理完成，可支撑选题与写作。",
      artifactId: input.researchArtifact.id,
      taskId: input.researchArtifact.taskId ?? undefined
    },
    {
      id: `${input.articleArtifact.id}:approval`,
      kind: "owner_approval_needed",
      severity: "critical",
      occurredAt,
      title: escalationTitle,
      summary: "编辑认为主资产需要老板确认首屏主张与发布节奏后再继续推进。",
      artifactId: input.articleArtifact.id,
      taskId: input.articleTask?.id
    },
    {
      id: `${input.articleArtifact.id}:blocked`,
      kind: "task_blocked",
      severity: "warning",
      occurredAt,
      title: escalationTitle,
      summary: "长文返工已形成，但发布相关决策未拍板，无法进入渠道分发。",
      artifactId: input.articleArtifact.id,
      taskId: input.articleTask?.id
    }
  ];
}

function createSeedDraftReviewer(team: Team) {
  return {
    async reviewDraft(input: {
      artifact: Artifact;
      bodyMarkdown: string;
      summary: string | null;
      writingGuidelines: string[];
      reviewGuidelines: string[];
    }) {
      const blockingIssues: string[] = [];
      const comments: string[] = [];
      const activeRules = [...new Set([...input.writingGuidelines, ...input.reviewGuidelines])];

      if (
        activeRules.some((rule) => rule.includes("首段先给结论") || rule.includes("先给结论")) &&
        !input.bodyMarkdown.startsWith("结论：")
      ) {
        blockingIssues.push("首段还没有直接给出结论");
      }

      if (
        activeRules.some((rule) => rule.includes("避免夸张表达")) &&
        /(颠覆|革命性|疯狂增长)/.test(input.bodyMarkdown)
      ) {
        blockingIssues.push("正文仍包含过度夸张表达");
      }

      if (!input.bodyMarkdown.includes("## 下一步动作")) {
        blockingIssues.push("缺少明确的下一步动作，无法直接进入老板拍板");
      }

      comments.push(`已按品牌语气「${team.brandVoice ?? "待补充"}」执行首轮审核。`);
      comments.push("当前版本更像可讨论 draft，而不是可直接发布的终稿。");

      if (blockingIssues.length === 0) {
        return {
          verdict: "approved" as const,
          blockingIssues,
          comments,
          summary: "通过审核"
        };
      }

      return {
        verdict: "changes_requested" as const,
        blockingIssues,
        comments,
        summary: "需补齐老板拍板所需的动作建议后再进入下一轮审核",
        revisedBodyMarkdown: `${input.bodyMarkdown}\n\n## 下一步动作\n- 明确老板需要确认的主张边界\n- 确认发布时间与首发渠道\n- 完成二次编辑后再申请审核`
      };
    }
  };
}

export interface BootstrapTeamWithInitialCycleResult extends BootstrapTeamResult {
  initialCycle: Cycle;
  initialProjects: Project[];
  initialTasks: Task[];
  initialArtifacts: Artifact[];
  initialBriefing: Briefing | null;
  initialDecision: Decision | null;
  seededPreferences: PreferenceProfile[];
}

type BootstrapTeamWithInitialCycleDependencies = {
  bootstrapTeam: typeof bootstrapTeam;
  createPreferenceProfile: typeof createPreferenceProfile;
  runCyclePlanningGraph: typeof runCyclePlanningGraph;
  createArtifactDraft: typeof createArtifactDraft;
  updateArtifactStatus: typeof updateArtifactStatus;
  runResearchGraph: typeof runResearchGraph;
  runProductionGraph: typeof runProductionGraph;
  runBriefingGraph: typeof runBriefingGraph;
};

const defaultDependencies: BootstrapTeamWithInitialCycleDependencies = {
  bootstrapTeam,
  createPreferenceProfile,
  runCyclePlanningGraph,
  createArtifactDraft,
  updateArtifactStatus,
  runResearchGraph,
  runProductionGraph,
  runBriefingGraph
};

export async function bootstrapTeamWithInitialCycle(
  rawInput: TeamBootstrapInput,
  dependencies: BootstrapTeamWithInitialCycleDependencies = defaultDependencies
): Promise<BootstrapTeamWithInitialCycleResult> {
  const input = teamBootstrapInputSchema.parse(rawInput);
  const bootstrapResult = await dependencies.bootstrapTeam(input);
  const startAt = new Date();
  const endAt = plusDays(startAt, FIRST_CYCLE_DURATION_DAYS - 1);
  const defaultGuidelines = buildDefaultGuidelines(bootstrapResult.team);
  const seededPreferences: PreferenceProfile[] = [];

  if (defaultGuidelines.length > 0) {
    const seededPreference = await dependencies.createPreferenceProfile({
      teamId: bootstrapResult.team.id,
      profileType: "brand",
      name: "brand:founding-guidelines",
      preferences: {
        note: bootstrapResult.team.brandVoice ?? null,
        editBehaviorHints: defaultGuidelines,
        sourceMode: "bootstrap"
      },
      source: "bootstrap_initial_cycle",
      active: true
    });
    seededPreferences.push(seededPreference);
  }

  const cyclePlanningResult = await dependencies.runCyclePlanningGraph({
    teamId: bootstrapResult.team.id,
    startAt: startAt.toISOString(),
    endAt: endAt.toISOString(),
    requestedPriorityFocus:
      bootstrapResult.team.coreOffer ??
      bootstrapResult.team.businessPositioning ??
      bootstrapResult.team.businessName
  });

  if (!cyclePlanningResult.cycle) {
    throw new Error("Initial cycle was not created");
  }

  const strategist = findMemberByRoleName(bootstrapResult.roles, bootstrapResult.members, "Strategist");
  const writer = findMemberByRoleName(bootstrapResult.roles, bootstrapResult.members, "Writer");
  const editor = findMemberByRoleName(bootstrapResult.roles, bootstrapResult.members, "Editor");

  const strategyTask = getTaskByType(cyclePlanningResult.tasks, "strategy_card");
  const researchTask = getTaskByType(cyclePlanningResult.tasks, "topic_brief");
  const articleTask = getTaskByType(cyclePlanningResult.tasks, "article_draft");
  const writingGuidelines = [
    ...readStringArray(articleTask?.inputContext?.writingGuidelines),
    ...defaultGuidelines
  ];
  const dedupedGuidelines = [...new Set(writingGuidelines)];

  const strategyDraft = await dependencies.createArtifactDraft({
    teamId: bootstrapResult.team.id,
    cycleId: cyclePlanningResult.cycle.id,
    projectId: strategyTask?.projectId ?? undefined,
    taskId: strategyTask?.id ?? undefined,
    artifactType: "strategy_card",
    title: `本周期策略卡：${cyclePlanningResult.cycle.priorityFocus}`,
    authorMemberId: strategist?.id ?? undefined,
    reviewerMemberId: editor?.id ?? undefined,
    summary: `围绕 ${cyclePlanningResult.cycle.priorityFocus} 明确本周期主线、渠道重点与老板介入边界。`,
    bodyMarkdown: buildStrategyCardBody(bootstrapResult.team, cyclePlanningResult.cycle),
    metadata: {
      seededBy: "bootstrap_initial_cycle"
    }
  });

  const strategyArtifact =
    (await dependencies.updateArtifactStatus({
      artifactId: strategyDraft.id,
      status: "approved",
      reviewedAt: new Date(),
      metadata: {
        ...strategyDraft.metadata,
        seededBy: "bootstrap_initial_cycle",
        review: {
          verdict: "approved",
          comments: ["策略卡已作为 founding cycle 主线基准通过。"]
        }
      }
    })) ?? strategyDraft;

  const researchResult = await dependencies.runResearchGraph(
    {
      teamId: bootstrapResult.team.id,
      cycleId: cyclePlanningResult.cycle.id,
      query: `${cyclePlanningResult.cycle.priorityFocus} 用户问题与内容机会`,
      providerKey: "seed_stub",
      projectId: researchTask?.projectId ?? undefined,
      taskId: researchTask?.id ?? undefined,
      artifactTitle: `研究摘要：${cyclePlanningResult.cycle.priorityFocus} 用户问题与内容机会`,
      maxResults: 3
    },
    {
      providers: {
        seed_stub: new StubResearchProvider({
          sources: buildSeedResearchSources(cyclePlanningResult.cycle.priorityFocus),
          answer: "持续团队最大的优势在于保留上下文、积累偏好，并把复盘转成下一周期动作。"
        })
      },
      createArtifactDraft: dependencies.createArtifactDraft
    }
  );

  if (!researchResult.artifact) {
    throw new Error("Initial research artifact was not created");
  }

  const researchArtifact = researchResult.artifact;

  const articleResult = await dependencies.runProductionGraph(
    {
      teamId: bootstrapResult.team.id,
      cycleId: cyclePlanningResult.cycle.id,
      artifactType: "article_draft",
      title: `旗舰长文：${cyclePlanningResult.cycle.priorityFocus}`,
      summary: `解释为什么 ${cyclePlanningResult.cycle.priorityFocus} 更适合由持续团队而不是临时 team 承接。`,
      bodyMarkdown: buildSeedArticleDraft(
        bootstrapResult.team,
        cyclePlanningResult.cycle,
        strategyArtifact,
        researchArtifact
      ),
      writingGuidelines: dedupedGuidelines,
      reviewGuidelines: dedupedGuidelines,
      projectId: articleTask?.projectId ?? undefined,
      taskId: articleTask?.id ?? undefined,
      authorMemberId: writer?.id ?? undefined,
      reviewerMemberId: editor?.id ?? undefined
    },
    {
      createArtifactDraft: dependencies.createArtifactDraft,
      applyDraftReviewResult,
      reviewer: createSeedDraftReviewer(bootstrapResult.team)
    }
  );

  const latestArticleArtifact =
    articleResult.finalArtifact ??
    articleResult.versionTrail[articleResult.versionTrail.length - 1] ??
    articleResult.draftArtifact;

  if (!latestArticleArtifact) {
    throw new Error("Initial article artifact was not created");
  }

  const briefingResult = await dependencies.runBriefingGraph({
    teamId: bootstrapResult.team.id,
    cycleId: cyclePlanningResult.cycle.id,
    type: "daily",
    escalationThreshold: 4,
    events: buildBriefingEvents({
      strategyArtifact,
      researchArtifact,
      articleArtifact: latestArticleArtifact,
      articleTask
    })
  });

  return {
    ...bootstrapResult,
    initialCycle: cyclePlanningResult.cycle,
    initialProjects: cyclePlanningResult.projects,
    initialTasks: cyclePlanningResult.tasks,
    initialArtifacts: [
      strategyArtifact,
      researchArtifact,
      ...(articleResult.versionTrail ?? []).length > 0
        ? articleResult.versionTrail
        : articleResult.finalArtifact
          ? [articleResult.finalArtifact]
          : []
    ],
    initialBriefing: briefingResult.briefing,
    initialDecision: briefingResult.linkedDecision,
    seededPreferences
  };
}
