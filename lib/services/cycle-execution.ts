import {
  createArtifactDraft,
  listArtifactsForCycle,
  updateArtifactStatus
} from "@/lib/domain/artifact/repository";
import type { Artifact } from "@/lib/domain/artifact/types";
import { listBriefingsForCycle } from "@/lib/domain/briefing/repository";
import {
  getCycleById,
  listTasksForCycle,
  updateCycleStatus,
  updateTaskStatus
} from "@/lib/domain/cycle/repository";
import type { Cycle, Task } from "@/lib/domain/cycle/types";
import { listDecisionsForCycle } from "@/lib/domain/decision/repository";
import { getTeamById, listMembersByTeamId } from "@/lib/domain/team/repository";
import { runBriefingGraph } from "@/lib/workflows/briefing/graph";

type CycleExecutionDependencies = {
  getCycleById: typeof getCycleById;
  getTeamById: typeof getTeamById;
  listMembersByTeamId: typeof listMembersByTeamId;
  listTasksForCycle: typeof listTasksForCycle;
  listArtifactsForCycle: typeof listArtifactsForCycle;
  listBriefingsForCycle: typeof listBriefingsForCycle;
  listDecisionsForCycle: typeof listDecisionsForCycle;
  updateTaskStatus: typeof updateTaskStatus;
  updateCycleStatus: typeof updateCycleStatus;
  createArtifactDraft: typeof createArtifactDraft;
  updateArtifactStatus: typeof updateArtifactStatus;
  runBriefingGraph: typeof runBriefingGraph;
};

const defaultDependencies: CycleExecutionDependencies = {
  getCycleById,
  getTeamById,
  listMembersByTeamId,
  listTasksForCycle,
  listArtifactsForCycle,
  listBriefingsForCycle,
  listDecisionsForCycle,
  updateTaskStatus,
  updateCycleStatus,
  createArtifactDraft,
  updateArtifactStatus,
  runBriefingGraph
};

function latestArtifactByType(artifacts: Artifact[], artifactType: string) {
  return artifacts
    .filter((artifact) => artifact.artifactType === artifactType)
    .sort((left, right) => {
      if (right.updatedAt.getTime() !== left.updatedAt.getTime()) {
        return right.updatedAt.getTime() - left.updatedAt.getTime();
      }
      return right.version - left.version;
    })[0] ?? null;
}

function latestArtifactForTask(artifacts: Artifact[], taskId: string) {
  return artifacts
    .filter((artifact) => artifact.taskId === taskId)
    .sort((left, right) => {
      if (right.updatedAt.getTime() !== left.updatedAt.getTime()) {
        return right.updatedAt.getTime() - left.updatedAt.getTime();
      }
      return right.version - left.version;
    })[0] ?? null;
}

function buildSocialPackBody(input: {
  cycle: Cycle;
  articleArtifact: Artifact;
  channels: string[];
}) {
  const channels = input.channels.length > 0 ? input.channels : ["公众号", "小红书", "即刻"];
  const summary = input.articleArtifact.summary ?? input.cycle.goalSummary;

  return [
    `# 渠道短帖包：${input.cycle.priorityFocus}`,
    "",
    `主资产来源：${input.articleArtifact.title}`,
    "",
    ...channels.map((channel, index) =>
      [
        `## ${index + 1}. ${channel}`,
        `- 核心主张：${summary}`,
        "- 开场先给结论，再补 1 个经营层洞察",
        "- 结尾给出一个明确动作建议"
      ].join("\n")
    )
  ].join("\n\n");
}

function buildExecutionEvents(input: {
  task: Task;
  artifact: Artifact;
}) {
  const occurredAt = new Date().toISOString();

  return [
    {
      id: `${input.artifact.id}:ready`,
      kind: "artifact_ready" as const,
      severity: "info" as const,
      occurredAt,
      title: input.task.title,
      summary: input.artifact.summary ?? "分发资产已准备完成。",
      taskId: input.task.id,
      artifactId: input.artifact.id
    }
  ];
}

function findMemberIdByRoleName(
  members: Awaited<ReturnType<typeof listMembersByTeamId>>,
  roleName: string
) {
  return members.find((member) => member.name === roleName)?.id;
}

export interface AdvanceCycleExecutionResult {
  cycle: Cycle;
  updatedTasks: Task[];
  createdArtifacts: Artifact[];
  noOpReason: string | null;
}

export async function advanceCycleExecution(
  input: {
    cycleId: string;
  },
  dependencies: CycleExecutionDependencies = defaultDependencies
): Promise<AdvanceCycleExecutionResult> {
  const cycle = await dependencies.getCycleById(input.cycleId);

  if (!cycle) {
    throw new Error(`Cycle not found: ${input.cycleId}`);
  }

  const team = await dependencies.getTeamById(cycle.teamId);

  if (!team) {
    throw new Error(`Team not found for cycle: ${input.cycleId}`);
  }

  const [members, tasks, artifacts, briefings, decisions] = await Promise.all([
    dependencies.listMembersByTeamId(cycle.teamId),
    dependencies.listTasksForCycle(cycle.id),
    dependencies.listArtifactsForCycle(cycle.id),
    dependencies.listBriefingsForCycle(cycle.id),
    dependencies.listDecisionsForCycle(cycle.id)
  ]);

  const updatedTasks: Task[] = [];
  const createdArtifacts: Artifact[] = [];
  const now = new Date();
  let nextCycle = cycle;

  if (cycle.status === "draft" || cycle.status === "planned") {
    nextCycle =
      (await dependencies.updateCycleStatus({
        cycleId: cycle.id,
        status: "active"
      })) ?? cycle;
  }

  for (const task of tasks) {
    const linkedArtifact = latestArtifactForTask(artifacts, task.id);

    if (task.taskType === "strategy_card" && linkedArtifact) {
      const updatedTask =
        (await dependencies.updateTaskStatus({
          taskId: task.id,
          status: "completed",
          startedAt: task.startedAt ?? now,
          completedAt: task.completedAt ?? now
        })) ?? task;
      updatedTasks.push(updatedTask);
      continue;
    }

    if (task.taskType === "topic_brief" && linkedArtifact) {
      const updatedTask =
        (await dependencies.updateTaskStatus({
          taskId: task.id,
          status: "completed",
          startedAt: task.startedAt ?? now,
          completedAt: task.completedAt ?? now
        })) ?? task;
      updatedTasks.push(updatedTask);
      continue;
    }

    if (task.taskType === "article_draft" && linkedArtifact) {
      const updatedTask =
        (await dependencies.updateTaskStatus({
          taskId: task.id,
          status:
            linkedArtifact.status === "approved" || linkedArtifact.status === "published"
              ? "completed"
              : "in_review",
          startedAt: task.startedAt ?? now,
          completedAt:
            linkedArtifact.status === "approved" || linkedArtifact.status === "published"
              ? task.completedAt ?? now
              : null
        })) ?? task;
      updatedTasks.push(updatedTask);
      continue;
    }

    if (task.taskType === "cycle_briefing" && briefings.length > 0) {
      const updatedTask =
        (await dependencies.updateTaskStatus({
          taskId: task.id,
          status: "completed",
          startedAt: task.startedAt ?? now,
          completedAt: task.completedAt ?? now
        })) ?? task;
      updatedTasks.push(updatedTask);
      continue;
    }
  }

  const pendingDecisions = decisions.filter((decision) => decision.status === "pending");

  if (pendingDecisions.length > 0) {
    return {
      cycle: nextCycle,
      updatedTasks,
      createdArtifacts,
      noOpReason: "当前仍有待老板拍板事项，团队不会继续推进分发任务。"
    };
  }

  const socialTask = tasks.find((task) => task.taskType === "social_post_pack");
  const socialArtifact = socialTask ? latestArtifactForTask(artifacts, socialTask.id) : null;

  if (socialTask && !socialArtifact) {
    const latestArticle = latestArtifactByType(artifacts, "article_draft");

    if (latestArticle) {
      const operatorId = findMemberIdByRoleName(members, "Distribution Operator");
      const socialPackDraft = await dependencies.createArtifactDraft({
        teamId: cycle.teamId,
        cycleId: cycle.id,
        projectId: socialTask.projectId,
        taskId: socialTask.id,
        artifactType: "social_post",
        title: `渠道短帖包：${cycle.priorityFocus}`,
        authorMemberId: operatorId,
        summary: `已围绕 ${latestArticle.title} 生成一组可进入渠道改写的短帖包。`,
        bodyMarkdown: buildSocialPackBody({
          cycle,
          articleArtifact: latestArticle,
          channels: team.primaryChannels
        }),
        metadata: {
          sourceArtifactId: latestArticle.id,
          sourceTaskId: latestArticle.taskId
        }
      });

      const socialPackArtifact =
        (await dependencies.updateArtifactStatus({
          artifactId: socialPackDraft.id,
          status: "approved",
          reviewedAt: now,
          metadata: {
            ...socialPackDraft.metadata,
            executionSource: "cycle_execution"
          }
        })) ?? socialPackDraft;

      createdArtifacts.push(socialPackArtifact);

      const completedTask =
        (await dependencies.updateTaskStatus({
          taskId: socialTask.id,
          status: "completed",
          startedAt: socialTask.startedAt ?? now,
          completedAt: now
        })) ?? socialTask;
      updatedTasks.push(completedTask);

      const briefingTask = tasks.find((task) => task.taskType === "cycle_briefing");
      if (briefingTask && briefings.length === 0) {
        await dependencies.runBriefingGraph({
          teamId: cycle.teamId,
          cycleId: cycle.id,
          type: "daily",
          events: buildExecutionEvents({
            task: socialTask,
            artifact: socialPackArtifact
          }),
          escalationThreshold: 5
        });
      }
    }
  }

  const allTasks = tasks.map(
    (task) => updatedTasks.find((updatedTask) => updatedTask.id === task.id) ?? task
  );
  const hasOpenTasks = allTasks.some((task) => ["pending", "in_progress", "blocked", "in_review"].includes(task.status));

  if (!hasOpenTasks) {
    nextCycle =
      (await dependencies.updateCycleStatus({
        cycleId: cycle.id,
        status: "completed"
      })) ?? nextCycle;
  }

  return {
    cycle: nextCycle,
    updatedTasks,
    createdArtifacts,
    noOpReason:
      createdArtifacts.length === 0
        ? "当前没有可继续推进的新任务，或本周期仍在等待已有资产处理。"
        : null
  };
}
