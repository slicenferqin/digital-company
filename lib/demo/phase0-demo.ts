import { randomUUID } from "node:crypto";

import { buildBriefingGraph } from "@/lib/workflows/briefing/graph";
import { buildCyclePlanningGraph } from "@/lib/workflows/cycle-planning/graph";
import type { Artifact, ArtifactReview } from "@/lib/domain/artifact/types";
import type { Briefing } from "@/lib/domain/briefing/types";
import type { Cycle, Project, Task } from "@/lib/domain/cycle/types";
import type { Decision } from "@/lib/domain/decision/types";
import type {
  Member,
  PreferenceProfile,
  Role,
  Team,
  TeamConfig
} from "@/lib/domain/team/types";
import { buildProductionGraph } from "@/lib/workflows/production/graph";
import { buildResearchGraph } from "@/lib/workflows/research/graph";
import { StubResearchProvider } from "@/lib/workflows/research/providers/stub";
import {
  buildDecisionWorkflowThreadId,
  resumeDecisionReviewWorkflow
} from "@/lib/services/decision-workflow";
import {
  resumeReviewFeedbackGraph,
  startReviewFeedbackGraph
} from "@/lib/workflows/review-feedback/graph";
import { bootstrapTeam } from "@/lib/services/team-bootstrap";

type DemoSession = {
  sessionId: string;
  threadId: string;
  team: Team;
  teamConfig: TeamConfig;
  roles: Role[];
  members: Member[];
  cycles: Cycle[];
  projects: Project[];
  tasks: Task[];
  artifacts: Artifact[];
  artifactReviews: ArtifactReview[];
  briefings: Briefing[];
  decisions: Decision[];
  preferenceProfiles: PreferenceProfile[];
  memoryEntries: Array<{
    id: string;
    teamId: string;
    cycleId: string | null;
    title: string;
    summary: string | null;
  }>;
  status: "pending_owner" | "approved";
};

type DemoStore = Map<string, DemoSession>;

declare global {
  var __digitalCompanyDemoStore: DemoStore | undefined;
}

function getDemoStore() {
  if (!globalThis.__digitalCompanyDemoStore) {
    globalThis.__digitalCompanyDemoStore = new Map();
  }

  return globalThis.__digitalCompanyDemoStore;
}

function createId(prefix: string) {
  return `${prefix}_${randomUUID().slice(0, 8)}`;
}

function createDraftReviewer() {
  return {
    async reviewDraft() {
      return {
        verdict: "changes_requested" as const,
        blockingIssues: ["开头表达还不够聚焦"],
        comments: ["先用更直接的结论开场，再展开背景。"],
        summary: "需要一轮修订",
        revisedBodyMarkdown:
          "# 修订版长文\n\n先给出结论，再展开为什么持续团队比一次性 workflow 更有价值。"
      };
    }
  };
}

async function runDemoBootstrap(sessionId: string, threadId: string): Promise<DemoSession> {
  const teams: Team[] = [];
  const teamConfigs: TeamConfig[] = [];
  const roles: Role[] = [];
  const members: Member[] = [];
  const cycles: Cycle[] = [];
  const projects: Project[] = [];
  const tasks: Task[] = [];
  const artifacts: Artifact[] = [];
  const artifactReviews: ArtifactReview[] = [];
  const briefings: Briefing[] = [];
  const decisions: Decision[] = [];
  const preferenceProfiles: PreferenceProfile[] = [];
  const memoryEntries: DemoSession["memoryEntries"] = [];

  const bootstrapResult = await bootstrapTeam(
    {
      mode: "manual",
      businessName: "Acme",
      businessPositioning: "AI 销售自动化",
      brandVoice: "直接、克制、务实",
      targetAudience: "Founder-led B2B 团队负责人",
      coreOffer: "持续交付的数字内容增长团队",
      primaryChannels: ["公众号", "小红书"]
    },
    {
      createTeam: async (input) => {
        const now = new Date();
        const team: Team = {
          id: createId("team"),
          name: input.name,
          businessName: input.businessName,
          businessPositioning: input.businessPositioning ?? null,
          brandVoice: input.brandVoice ?? null,
          targetAudience: input.targetAudience ?? null,
          coreOffer: input.coreOffer ?? null,
          primaryChannels: input.primaryChannels ?? [],
          status: input.status ?? "draft",
          createdAt: now,
          updatedAt: now
        };
        const teamConfig: TeamConfig = {
          id: createId("team_cfg"),
          teamId: team.id,
          approvalMode: input.config?.approvalMode ?? "manual",
          brandRules: input.config?.brandRules ?? {},
          forbiddenPatterns: input.config?.forbiddenPatterns ?? [],
          channelRules: input.config?.channelRules ?? {},
          costBudgetPerCycleCents: input.config?.costBudgetPerCycleCents ?? 0,
          createdAt: now,
          updatedAt: now
        };
        teams.push(team);
        teamConfigs.push(teamConfig);
        return { team, teamConfig };
      },
      createRole: async (input) => {
        const now = new Date();
        const role: Role = {
          id: createId("role"),
          teamId: input.teamId,
          name: input.name,
          department: input.department,
          responsibilities: input.responsibilities ?? [],
          headcountLimit: input.headcountLimit ?? 1,
          approvalScope: input.approvalScope ?? [],
          sortOrder: input.sortOrder ?? 0,
          createdAt: now,
          updatedAt: now
        };
        roles.push(role);
        return role;
      },
      createMember: async (input) => {
        const now = new Date();
        const member: Member = {
          id: createId("member"),
          teamId: input.teamId,
          roleId: input.roleId,
          name: input.name,
          personaSummary: input.personaSummary ?? null,
          strengths: input.strengths ?? [],
          weaknesses: input.weaknesses ?? [],
          specialtyTags: input.specialtyTags ?? [],
          currentLoad: input.currentLoad ?? 0,
          status: input.status ?? "active",
          createdAt: now,
          updatedAt: now
        };
        members.push(member);
        return member;
      }
    }
  );

  const cyclePlanningGraph = buildCyclePlanningGraph({
    getTeamById: async (teamId) => teams.find((item) => item.id === teamId) ?? null,
    listMembersByTeamId: async (teamId) => members.filter((item) => item.teamId === teamId),
    listPreferenceProfilesByTeamId: async (teamId) =>
      preferenceProfiles.filter((item) => item.teamId === teamId),
    fetchMemoryInputsForPlanning: async () => [
      {
        id: createId("memory_seed"),
        type: "preference",
        title: "老板偏好更直接的开场",
        summary: "首段先说结论，不绕背景。",
        tags: ["brand"],
        importance: 10
      }
    ],
    createCycle: async (input) => {
      const now = new Date();
      const cycle: Cycle = {
        id: createId("cycle"),
        teamId: input.teamId,
        cycleType: input.cycleType ?? "weekly",
        goalSummary: input.goalSummary,
        priorityFocus: input.priorityFocus,
        status: input.status ?? "draft",
        startAt: input.startAt,
        endAt: input.endAt,
        createdAt: now,
        updatedAt: now
      };
      cycles.push(cycle);
      return cycle;
    },
    createProject: async (input) => {
      const now = new Date();
      const project: Project = {
        id: createId("project"),
        teamId: input.teamId,
        cycleId: input.cycleId,
        type: input.type ?? "strategy",
        title: input.title,
        goal: input.goal,
        priority: input.priority ?? 0,
        ownerMemberId: input.ownerMemberId ?? null,
        status: input.status ?? "planned",
        metadata: input.metadata ?? {},
        createdAt: now,
        updatedAt: now
      };
      projects.push(project);
      return project;
    },
    createTask: async (input) => {
      const now = new Date();
      const task: Task = {
        id: createId("task"),
        teamId: input.teamId,
        cycleId: input.cycleId,
        projectId: input.projectId,
        assignedMemberId: input.assignedMemberId ?? null,
        taskType: input.taskType,
        title: input.title,
        inputContext: input.inputContext ?? {},
        status: input.status ?? "pending",
        blockedReason: input.blockedReason ?? null,
        requiresOwnerApproval: input.requiresOwnerApproval ?? false,
        priority: input.priority ?? 0,
        dueAt: input.dueAt ?? null,
        startedAt: null,
        completedAt: null,
        createdAt: now,
        updatedAt: now
      };
      tasks.push(task);
      return task;
    }
  });

  const planningResult = await cyclePlanningGraph.invoke({
    teamId: bootstrapResult.team.id,
    startAt: "2026-03-16T00:00:00.000Z",
    endAt: "2026-03-22T23:59:59.000Z",
    requestedCycleType: null,
    requestedGoalSummary: null,
    requestedPriorityFocus: "AI 销售自动化"
  });

  const createArtifactDraft = async (input: {
    teamId: string;
    cycleId: string;
    projectId?: string;
    taskId?: string;
    artifactType: Artifact["artifactType"];
    title: string;
    authorMemberId?: string;
    reviewerMemberId?: string;
    summary?: string;
    bodyMarkdown?: string;
    storageUri?: string;
    metadata?: Record<string, unknown>;
  }) => {
    const now = new Date();
    const artifact: Artifact = {
      id: createId("artifact"),
      teamId: input.teamId,
      cycleId: input.cycleId,
      projectId: input.projectId ?? null,
      taskId: input.taskId ?? null,
      artifactType: input.artifactType,
      title: input.title,
      version: 1,
      status: "draft",
      authorMemberId: input.authorMemberId ?? null,
      reviewerMemberId: input.reviewerMemberId ?? null,
      summary: input.summary ?? null,
      bodyMarkdown: input.bodyMarkdown ?? null,
      storageUri: input.storageUri ?? null,
      metadata: input.metadata ?? {},
      reviewedAt: null,
      publishedAt: null,
      createdAt: now,
      updatedAt: now
    };
    artifacts.push(artifact);
    return artifact;
  };

  const researchGraph = buildResearchGraph({
    providers: {
      stub: new StubResearchProvider({
        answer: "Founder-led B2B 团队更需要持续内容团队，而不是一次性 workflow。",
        sources: [
          {
            title: "Founder-led growth notes",
            url: "https://example.com/founder-growth",
            snippet: "Founder-led 团队需要稳定产出，而不是零散内容生成。",
            publishedAt: "2026-03-01T00:00:00.000Z",
            author: "Jane Doe",
            domain: "example.com",
            score: 0.9
          },
          {
            title: "Content ops benchmark",
            url: "https://example.com/content-ops",
            snippet: "高表现团队依赖可复用 brief、审核标准和周节奏。",
            publishedAt: "2026-03-02T00:00:00.000Z",
            author: "John Doe",
            domain: "example.com",
            score: 0.87
          }
        ]
      })
    },
    createArtifactDraft
  });

  await researchGraph.invoke({
    teamId: bootstrapResult.team.id,
    cycleId: planningResult.cycle!.id,
    query: "Founder-led B2B content teams",
    providerKey: "stub",
    projectId: planningResult.projects[0]?.id ?? null,
    taskId: null,
    artifactTitle: "研究摘要：Founder-led B2B content teams",
    maxResults: 5,
    includeDomains: []
  });

  const productionGraph = buildProductionGraph({
    createArtifactDraft,
    reviewer: createDraftReviewer(),
    applyDraftReviewResult: async (artifact, reviewResult) => {
      const reviewRecord: ArtifactReview = {
        id: createId("artifact_review"),
        artifactId: artifact.id,
        teamId: artifact.teamId,
        reviewerMemberId: artifact.reviewerMemberId,
        status: reviewResult.verdict === "approved" ? "approved" : "changes_requested",
        feedbackSummary: reviewResult.summary ?? null,
        checklist: {
          blockingIssues: reviewResult.blockingIssues,
          comments: reviewResult.comments
        },
        reviewNotesMarkdown: reviewResult.comments.join("\n"),
        reviewedAt: new Date(),
        createdAt: new Date()
      };
      artifactReviews.push(reviewRecord);

      const revisedArtifact: Artifact = {
        ...artifact,
        id: createId("artifact"),
        version: artifact.version + 1,
        status: "approved",
        bodyMarkdown: reviewResult.revisedBodyMarkdown ?? artifact.bodyMarkdown,
        metadata: {
          ...artifact.metadata,
          versionLineage: {
            previousArtifactId: artifact.id,
            parentVersion: artifact.version,
            currentVersion: artifact.version + 1
          }
        },
        updatedAt: new Date(),
        reviewedAt: new Date()
      };
      artifacts.push(revisedArtifact);

      return {
        review: reviewResult,
        finalArtifact: revisedArtifact,
        createdVersion: revisedArtifact
      };
    }
  });

  const productionResult = await productionGraph.invoke({
    teamId: bootstrapResult.team.id,
    cycleId: planningResult.cycle!.id,
    artifactType: "article_draft",
    title: "旗舰长文：为什么不是再做一个 agent workflow",
    bodyMarkdown: "# 长文初稿\n\n先讲为什么 persistent team 是关键。",
    summary: "解释 persistent team 与 workflow 的差异",
    projectId: planningResult.projects[1]?.id ?? null,
    taskId: planningResult.tasks.find((task) => task.taskType === "article_draft")?.id ?? null,
    authorMemberId: members.find((member) => member.name === "Writer")?.id ?? null,
    reviewerMemberId: members.find((member) => member.name === "Editor")?.id ?? null
  });

  const briefingGraph = buildBriefingGraph({
    listBriefingsForCycle: async (cycleId) => briefings.filter((item) => item.cycleId === cycleId),
    createBriefing: async (input) => {
      const now = new Date();
      const briefing: Briefing = {
        id: createId("briefing"),
        teamId: input.teamId,
        cycleId: input.cycleId ?? null,
        authorMemberId: input.authorMemberId ?? null,
        type: input.type,
        status: input.status ?? "draft",
        title: input.title,
        summary: input.summary ?? null,
        bodyMarkdown: input.bodyMarkdown ?? null,
        highlights: input.highlights ?? [],
        risks: input.risks ?? [],
        actionItems: input.actionItems ?? [],
        metadata: input.metadata ?? {},
        publishedAt: input.publishedAt ?? null,
        createdAt: now,
        updatedAt: now
      };
      briefings.push(briefing);
      return briefing;
    },
    createDecision: async (input) => {
      const now = new Date();
      const decision: Decision = {
        id: createId("decision"),
        teamId: input.teamId,
        cycleId: input.cycleId ?? null,
        relatedBriefingId: input.relatedBriefingId ?? null,
        requestedByMemberId: input.requestedByMemberId ?? null,
        type: input.type ?? "approval",
        title: input.title,
        summary: input.summary ?? null,
        contextMarkdown: input.contextMarkdown ?? null,
        status: "pending",
        workflowThreadId: null,
        workflowName: null,
        workflowStatus: "not_started",
        resolution: null,
        resolutionPayload: {},
        decidedAt: null,
        createdAt: now,
        updatedAt: now
      };
      decisions.push(decision);
      return decision;
    },
    initializeDecisionReviewWorkflow: async ({ decisionId, teamId }) => {
      const decision = decisions.find((item) => item.id === decisionId);

      if (!decision) {
        throw new Error(`Decision not found: ${decisionId}`);
      }

      const threadId = buildDecisionWorkflowThreadId(decisionId);
      const workflow = await startReviewFeedbackGraph(
        {
          teamId,
          decisionId
        },
        threadId,
        {
          getDecisionById: async (currentDecisionId) =>
            decisions.find((item) => item.id === currentDecisionId) ?? null
        }
      );

      decision.workflowThreadId = threadId;
      decision.workflowName = "review-feedback";
      decision.workflowStatus = "awaiting_owner";
      decision.updatedAt = new Date();

      return {
        threadId,
        workflow
      };
    }
  });

  await briefingGraph.invoke({
    teamId: bootstrapResult.team.id,
    cycleId: planningResult.cycle!.id,
    type: "daily",
    escalationThreshold: 4,
    events: [
      {
        id: createId("event"),
        kind: "artifact_ready",
        severity: "info",
        occurredAt: new Date().toISOString(),
        title: "旗舰长文已形成可审核版本",
        summary: `已产出交付：${productionResult.finalArtifact?.title ?? "旗舰长文"}`,
        artifactId: productionResult.finalArtifact?.id
      },
      {
        id: createId("event"),
        kind: "owner_approval_needed",
        severity: "critical",
        occurredAt: new Date().toISOString(),
        title: "等待老板确认发布节奏",
        summary: "秘书长建议老板确认长文发布节奏与渠道优先级。",
        taskId: planningResult.tasks.find((task) => task.requiresOwnerApproval)?.id
      }
    ]
  });

  return {
    sessionId,
    threadId,
    team: bootstrapResult.team,
    teamConfig: bootstrapResult.teamConfig,
    roles: bootstrapResult.roles,
    members: bootstrapResult.members,
    cycles,
    projects,
    tasks,
    artifacts,
    artifactReviews,
    briefings,
    decisions,
    preferenceProfiles,
    memoryEntries,
    status: "pending_owner"
  };
}

export async function startPhase0Demo() {
  const sessionId = createId("demo");
  const threadId = `phase0-demo-${sessionId}`;
  const session = await runDemoBootstrap(sessionId, threadId);

  getDemoStore().set(sessionId, session);

  return {
    sessionId,
    team: session.team,
    cycle: session.cycles[0] ?? null,
    briefing: session.briefings[0] ?? null,
    artifact:
      session.artifacts.find((artifact) => artifact.status === "approved") ??
      session.artifacts[0] ??
      null,
    decision: session.decisions[0] ?? null,
    status: session.status
  };
}

export async function approvePhase0DemoDecision(sessionId: string) {
  const store = getDemoStore();
  const session = store.get(sessionId);

  if (!session) {
    throw new Error(`Demo session not found: ${sessionId}`);
  }

  const decision = session.decisions[0];

  if (!decision) {
    throw new Error("Demo session has no decision");
  }

  decision.status = "approved";
  decision.resolution = "approved";
  decision.resolutionPayload = {
    ownerAction: "approve"
  };
  decision.decidedAt = new Date();
  decision.updatedAt = new Date();

  const workflow = await resumeDecisionReviewWorkflow({
    decisionId: decision.id,
    ownerChoice: {
      action: "approve",
      note: "可以按建议节奏推进"
    }
  }, {
    getDecisionById: async (decisionId) =>
      session.decisions.find((item) => item.id === decisionId) ?? null,
    updateDecision: async (input) => {
      const currentDecision = session.decisions.find((item) => item.id === input.decisionId);

      if (!currentDecision) {
        throw new Error(`Decision not found: ${input.decisionId}`);
      }

      if (input.status !== undefined) currentDecision.status = input.status;
      if (input.workflowThreadId !== undefined) currentDecision.workflowThreadId = input.workflowThreadId;
      if (input.workflowName !== undefined) currentDecision.workflowName = input.workflowName;
      if (input.workflowStatus !== undefined) currentDecision.workflowStatus = input.workflowStatus;
      if (input.resolution !== undefined) currentDecision.resolution = input.resolution;
      if (input.resolutionPayload !== undefined) currentDecision.resolutionPayload = input.resolutionPayload;
      if (input.decidedAt !== undefined) currentDecision.decidedAt = input.decidedAt;
      currentDecision.updatedAt = new Date();

      return currentDecision;
    },
    startReviewFeedbackGraph: async () => {
      throw new Error("startReviewFeedbackGraph should not be called during resume");
    },
    resumeReviewFeedbackGraph: async (threadId, ownerChoice) =>
      resumeReviewFeedbackGraph(threadId, ownerChoice, {
        getDecisionById: async (decisionId: string) =>
          session.decisions.find((item) => item.id === decisionId) ?? null
      })
  });

  session.status = "approved";
  store.set(sessionId, session);

  return {
    sessionId,
    decision: session.decisions[0],
    workflowState: workflow.workflow.state.values,
    status: session.status
  };
}
