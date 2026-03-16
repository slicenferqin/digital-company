import type { Project, Task } from "@/lib/domain/cycle/types";
import type { Member } from "@/lib/domain/team/types";

import type { CyclePlanningDependencies, CyclePlanningState } from "../state";

function findMember(
  members: Member[],
  options: {
    byName?: string;
    byTag?: string;
  }
) {
  if (options.byName) {
    const exact = members.find((member) => member.name === options.byName);
    if (exact) {
      return exact;
    }
  }

  if (options.byTag) {
    const tagged = members.find((member) => member.specialtyTags.includes(options.byTag!));
    if (tagged) {
      return tagged;
    }
  }

  return null;
}

function resolveAssignedMemberId(members: Member[], taskType: string) {
  if (taskType === "strategy_card") {
    return findMember(members, { byName: "Strategist", byTag: "strategy" })?.id;
  }

  if (taskType === "topic_brief") {
    return findMember(members, { byName: "Trend Scout", byTag: "trend" })?.id
      ?? findMember(members, { byName: "Researcher", byTag: "research" })?.id;
  }

  if (taskType === "article_draft") {
    return findMember(members, { byName: "Writer", byTag: "writing" })?.id;
  }

  if (taskType === "preference_calibration") {
    return findMember(members, { byName: "Editor", byTag: "editing" })?.id;
  }

  if (taskType === "social_post_pack") {
    return findMember(members, { byName: "Distribution Operator", byTag: "distribution" })?.id;
  }

  if (taskType === "cycle_briefing") {
    return findMember(members, { byName: "Chief of Staff", byTag: "briefing" })?.id;
  }

  return null;
}

export function createProjectsAndTasksNode(dependencies: CyclePlanningDependencies) {
  return async function createProjectsAndTasks(state: CyclePlanningState) {
    if (!state.cyclePlan) {
      throw new Error("Cycle plan must exist before persistence");
    }

    const cycle = await dependencies.createCycle({
      teamId: state.teamId,
      cycleType: state.cyclePlan.cycleType,
      goalSummary: state.cyclePlan.goalSummary,
      priorityFocus: state.cyclePlan.priorityFocus,
      startAt: new Date(state.startAt),
      endAt: new Date(state.endAt),
      status: "draft"
    });

    const persistedProjects: Project[] = [];
    const persistedTasks: Task[] = [];

    for (const projectDraft of state.cyclePlan.projects) {
      const project = await dependencies.createProject({
        teamId: state.teamId,
        cycleId: cycle.id,
        type: projectDraft.type,
        title: projectDraft.title,
        goal: projectDraft.goal,
        priority: projectDraft.priority,
        status: "planned",
        metadata: {
          rationale: state.cyclePlan.rationale
        }
      });

      persistedProjects.push(project);

      for (const taskDraft of projectDraft.tasks) {
        const assignedMemberId = resolveAssignedMemberId(state.members, taskDraft.taskType);
        const task = await dependencies.createTask({
          teamId: state.teamId,
          cycleId: cycle.id,
          projectId: project.id,
          assignedMemberId: assignedMemberId ?? undefined,
          taskType: taskDraft.taskType,
          title: taskDraft.title,
          priority: taskDraft.priority,
          requiresOwnerApproval: taskDraft.requiresOwnerApproval,
          inputContext: {
            projectGoal: projectDraft.goal,
            cyclePriorityFocus: state.cyclePlan.priorityFocus,
            ...(taskDraft.inputContext ?? {})
          }
        });

        persistedTasks.push(task);
      }
    }

    return {
      cycle,
      projects: persistedProjects,
      tasks: persistedTasks
    };
  };
}
