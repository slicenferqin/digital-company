import { createArtifactDraft, updateArtifactStatus } from "@/lib/domain/artifact/repository";
import type { Artifact } from "@/lib/domain/artifact/types";
import { getCycleById, listTasksForCycle, updateCycleStatus } from "@/lib/domain/cycle/repository";
import type { Cycle, Task } from "@/lib/domain/cycle/types";
import { getTeamById, listMembersByTeamId } from "@/lib/domain/team/repository";
import type { Member, Team } from "@/lib/domain/team/types";
import { captureArtifactFeedback, type CaptureArtifactFeedbackInput } from "@/lib/services/feedback-capture";
import { runBriefingGraph } from "@/lib/workflows/briefing/graph";
import type { BriefingEvent } from "@/lib/workflows/briefing/state";
import { runCyclePlanningGraph } from "@/lib/workflows/cycle-planning/graph";
import { runProductionGraph } from "@/lib/workflows/production/graph";
import { StubResearchProvider } from "@/lib/workflows/research/providers/stub";
import { runResearchGraph } from "@/lib/workflows/research/graph";

function plusDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function findMemberByName(members: Member[], name: string) {
  return members.find((member) => member.name === name) ?? null;
}

function getTaskByType(tasks: Task[], taskType: string) {
  return tasks.find((task) => task.taskType === taskType) ?? null;
}

function defaultFeedbackNote(note?: string) {
  return note?.trim() || "延续更直接、克制、先给结论的写法。";
}

function buildStrategyBody(team: Team, cycle: Cycle, feedbackNote: string) {
  return [
    `# 第二周期策略卡：${cycle.priorityFocus}`,
    "",
    "## 反馈吸收",
    `- 老板反馈：${feedbackNote}`,
    `- 品牌语气：${team.brandVoice ?? "待补充"}`,
    "",
    "## 第二周期动作",
    "- 在延续主线的同时减少解释成本",
    "- 优先把老板反馈落进写作与审核规则",
    "- 争取降低本周期的老板介入频率"
  ].join("\n");
}

function buildResearchSources(priorityFocus: string, feedbackNote: string) {
  return [
    {
      title: `${priorityFocus} 第二周期用户关注点`,
      url: "https://example.com/next-cycle-customer-signal",
      snippet: `用户对该主题的期待正在收敛到：${feedbackNote}`,
      publishedAt: null,
      author: "Digital Company Seed",
      domain: "example.com",
      score: 0.91
    },
    {
      title: `${priorityFocus} 第二周期内容切入角度`,
      url: "https://example.com/next-cycle-angle",
      snippet: "更直接的论点表达和更少背景铺垫，有助于降低老板重复修改。",
      publishedAt: null,
      author: "Digital Company Seed",
      domain: "example.com",
      score: 0.87
    }
  ];
}

function buildArticleBody(input: {
  cycle: Cycle;
  strategyArtifact: Artifact;
  researchArtifact: Artifact;
  feedbackNote: string;
}) {
  return [
    `# 第二周期长文：${input.cycle.priorityFocus}`,
    "",
    "## 本轮已吸收的老板反馈",
    `- ${input.feedbackNote}`,
    "",
    "## 为什么这一轮会更顺",
    `- 策略卡已提前对齐：${input.strategyArtifact.summary ?? input.cycle.goalSummary}`,
    `- 研究摘要已把注意力收敛到：${input.researchArtifact.summary ?? "更少背景铺垫，更快进入主张"}`,
    "- 写作会把老板的稳定偏好前置到 draft 生成，而不是等审核后返工",
    "",
    "## 本轮写作原则",
    "- 首段先给结论",
    "- 避免夸张表达",
    "- 所有段落都服务老板真正关心的经营判断"
  ].join("\n");
}

function buildBriefingEvents(input: {
  strategyArtifact: Artifact;
  researchArtifact: Artifact;
  articleArtifact: Artifact;
  feedbackNote: string;
}): BriefingEvent[] {
  const occurredAt = new Date().toISOString();

  return [
    {
      id: `${input.strategyArtifact.id}:kickoff`,
      kind: "artifact_ready",
      severity: "info",
      occurredAt,
      title: "第二周期策略卡已发布",
      summary: input.strategyArtifact.summary ?? "第二周期主线已对齐。",
      artifactId: input.strategyArtifact.id,
      taskId: input.strategyArtifact.taskId ?? undefined
    },
    {
      id: `${input.researchArtifact.id}:kickoff`,
      kind: "artifact_ready",
      severity: "info",
      occurredAt,
      title: "第二周期研究摘要已形成",
      summary: input.researchArtifact.summary ?? "第二周期研究输入已到位。",
      artifactId: input.researchArtifact.id,
      taskId: input.researchArtifact.taskId ?? undefined
    },
    {
      id: `${input.articleArtifact.id}:feedback`,
      kind: "feedback_received",
      severity: "info",
      occurredAt,
      title: "第二周期已吸收老板反馈",
      summary: input.feedbackNote,
      artifactId: input.articleArtifact.id,
      taskId: input.articleArtifact.taskId ?? undefined
    }
  ];
}

type LaunchNextCycleDependencies = {
  captureArtifactFeedback: typeof captureArtifactFeedback;
  getCycleById: typeof getCycleById;
  getTeamById: typeof getTeamById;
  listMembersByTeamId: typeof listMembersByTeamId;
  listTasksForCycle: typeof listTasksForCycle;
  updateCycleStatus: typeof updateCycleStatus;
  runCyclePlanningGraph: typeof runCyclePlanningGraph;
  createArtifactDraft: typeof createArtifactDraft;
  updateArtifactStatus: typeof updateArtifactStatus;
  runResearchGraph: typeof runResearchGraph;
  runProductionGraph: typeof runProductionGraph;
  runBriefingGraph: typeof runBriefingGraph;
};

const defaultDependencies: LaunchNextCycleDependencies = {
  captureArtifactFeedback,
  getCycleById,
  getTeamById,
  listMembersByTeamId,
  listTasksForCycle,
  updateCycleStatus,
  runCyclePlanningGraph,
  createArtifactDraft,
  updateArtifactStatus,
  runResearchGraph,
  runProductionGraph,
  runBriefingGraph
};

export interface LaunchNextCycleResult {
  previousCycle: Cycle;
  nextCycle: Cycle;
  nextArtifacts: Artifact[];
  feedback: Awaited<ReturnType<typeof captureArtifactFeedback>>;
}

export async function launchNextCycleFromArtifactFeedback(
  input: {
    cycleId: string;
    feedback: CaptureArtifactFeedbackInput;
  },
  dependencies: LaunchNextCycleDependencies = defaultDependencies
): Promise<LaunchNextCycleResult> {
  const feedback = await dependencies.captureArtifactFeedback({
    ...input.feedback,
    note: defaultFeedbackNote(input.feedback.note)
  });

  const previousCycle = await dependencies.getCycleById(input.cycleId);

  if (!previousCycle) {
    throw new Error(`Cycle not found: ${input.cycleId}`);
  }

  const team = await dependencies.getTeamById(previousCycle.teamId);

  if (!team) {
    throw new Error(`Team not found for cycle: ${input.cycleId}`);
  }

  await dependencies.updateCycleStatus({
    cycleId: previousCycle.id,
    status: "completed"
  });

  const startAt = new Date(Math.max(Date.now(), previousCycle.endAt.getTime() + 1000));
  const endAt = plusDays(startAt, 6);
  const nextCycleResult = await dependencies.runCyclePlanningGraph({
    teamId: previousCycle.teamId,
    startAt: startAt.toISOString(),
    endAt: endAt.toISOString(),
    requestedPriorityFocus: previousCycle.priorityFocus
  });

  if (!nextCycleResult.cycle) {
    throw new Error("Next cycle was not created");
  }

  const nextCycle =
    (await dependencies.updateCycleStatus({
      cycleId: nextCycleResult.cycle.id,
      status: "active"
    })) ?? nextCycleResult.cycle;

  const members = await dependencies.listMembersByTeamId(previousCycle.teamId);
  const strategyTask = getTaskByType(nextCycleResult.tasks, "strategy_card");
  const researchTask = getTaskByType(nextCycleResult.tasks, "topic_brief");
  const articleTask = getTaskByType(nextCycleResult.tasks, "article_draft");
  const strategist = findMemberByName(members, "Strategist");
  const writer = findMemberByName(members, "Writer");
  const editor = findMemberByName(members, "Editor");
  const feedbackNote = defaultFeedbackNote(input.feedback.note);

  const strategyDraft = await dependencies.createArtifactDraft({
    teamId: previousCycle.teamId,
    cycleId: nextCycle.id,
    projectId: strategyTask?.projectId ?? undefined,
    taskId: strategyTask?.id ?? undefined,
    artifactType: "strategy_card",
    title: `第二周期策略卡：${nextCycle.priorityFocus}`,
    authorMemberId: strategist?.id ?? undefined,
    reviewerMemberId: editor?.id ?? undefined,
    summary: `已吸收老板反馈：${feedbackNote}`,
    bodyMarkdown: buildStrategyBody(team, nextCycle, feedbackNote),
    metadata: {
      launchMode: "owner_feedback"
    }
  });

  const strategyArtifact =
    (await dependencies.updateArtifactStatus({
      artifactId: strategyDraft.id,
      status: "approved",
      reviewedAt: new Date(),
      metadata: {
        ...strategyDraft.metadata,
        launchMode: "owner_feedback"
      }
    })) ?? strategyDraft;

  const researchResult = await dependencies.runResearchGraph(
    {
      teamId: previousCycle.teamId,
      cycleId: nextCycle.id,
      query: `${nextCycle.priorityFocus} 第二周期内容方向`,
      providerKey: "next_cycle_stub",
      projectId: researchTask?.projectId ?? undefined,
      taskId: researchTask?.id ?? undefined,
      artifactTitle: `研究摘要：${nextCycle.priorityFocus} 第二周期内容方向`,
      maxResults: 2
    },
    {
      providers: {
        next_cycle_stub: new StubResearchProvider({
          sources: buildResearchSources(nextCycle.priorityFocus, feedbackNote),
          answer: `第二周期应重点执行老板反馈：${feedbackNote}`
        })
      },
      createArtifactDraft: dependencies.createArtifactDraft
    }
  );

  if (!researchResult.artifact) {
    throw new Error("Next-cycle research artifact was not created");
  }

  const writingGuidelines = Array.isArray(articleTask?.inputContext?.writingGuidelines)
    ? articleTask.inputContext.writingGuidelines.filter(
        (item): item is string => typeof item === "string"
      )
    : [];

  const articleResult = await dependencies.runProductionGraph(
    {
      teamId: previousCycle.teamId,
      cycleId: nextCycle.id,
      artifactType: "article_draft",
      title: `第二周期长文：${nextCycle.priorityFocus}`,
      summary: `已吸收老板反馈：${feedbackNote}`,
      bodyMarkdown: buildArticleBody({
        cycle: nextCycle,
        strategyArtifact,
        researchArtifact: researchResult.artifact,
        feedbackNote
      }),
      writingGuidelines,
      reviewGuidelines: writingGuidelines,
      projectId: articleTask?.projectId ?? undefined,
      taskId: articleTask?.id ?? undefined,
      authorMemberId: writer?.id ?? undefined,
      reviewerMemberId: editor?.id ?? undefined
    },
    {
      createArtifactDraft: dependencies.createArtifactDraft,
      updateArtifactStatus: dependencies.updateArtifactStatus,
      applyDraftReviewResult: (await import("@/lib/services/artifact-versioning")).applyDraftReviewResult,
      reviewer: {
        async reviewDraft() {
          return {
            verdict: "approved" as const,
            blockingIssues: [],
            comments: ["第二周期首稿已按老板反馈对齐，可直接进入下一步。"],
            summary: "通过"
          };
        }
      }
    } as never
  );

  const latestArticle =
    articleResult.finalArtifact ??
    articleResult.versionTrail[articleResult.versionTrail.length - 1] ??
    articleResult.draftArtifact;

  if (!latestArticle) {
    throw new Error("Next-cycle article artifact was not created");
  }

  await dependencies.runBriefingGraph({
    teamId: previousCycle.teamId,
    cycleId: nextCycle.id,
    type: "daily",
    escalationThreshold: 999,
    events: buildBriefingEvents({
      strategyArtifact,
      researchArtifact: researchResult.artifact,
      articleArtifact: latestArticle,
      feedbackNote
    })
  });

  return {
    previousCycle,
    nextCycle,
    nextArtifacts: [strategyArtifact, researchResult.artifact, latestArticle],
    feedback
  };
}
