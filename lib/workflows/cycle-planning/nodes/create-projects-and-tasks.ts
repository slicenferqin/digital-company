import type { Project, Task } from "@/lib/domain/cycle/types";

import type { CyclePlanningDependencies, CyclePlanningState } from "../state";

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
        const task = await dependencies.createTask({
          teamId: state.teamId,
          cycleId: cycle.id,
          projectId: project.id,
          taskType: taskDraft.taskType,
          title: taskDraft.title,
          priority: taskDraft.priority,
          requiresOwnerApproval: taskDraft.requiresOwnerApproval,
          inputContext: {
            projectGoal: projectDraft.goal,
            cyclePriorityFocus: state.cyclePlan.priorityFocus
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
