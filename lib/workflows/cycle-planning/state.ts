import { Annotation } from "@langchain/langgraph";

import type { Cycle, CycleType, Project, ProjectType, Task } from "@/lib/domain/cycle/types";
import type { PlanningMemoryInput } from "@/lib/domain/memory/types";
import type { Member, PreferenceProfile, Team } from "@/lib/domain/team/types";

export interface PlannedTaskDraft {
  taskType: string;
  title: string;
  priority: number;
  requiresOwnerApproval: boolean;
  inputContext?: Record<string, unknown>;
}

export interface PlannedProjectDraft {
  type: ProjectType;
  title: string;
  goal: string;
  priority: number;
  tasks: PlannedTaskDraft[];
}

export interface CyclePlanDraft {
  cycleType: CycleType;
  goalSummary: string;
  priorityFocus: string;
  rationale: string[];
  projects: PlannedProjectDraft[];
}

export interface CyclePlanningInput {
  teamId: string;
  startAt: string;
  endAt: string;
  requestedCycleType?: CycleType;
  requestedGoalSummary?: string;
  requestedPriorityFocus?: string;
}

const replaceReducer = <T>(defaultValue: T) =>
  Annotation<T>({
    reducer: (_, next) => next,
    default: () => defaultValue
  });

const replaceArrayReducer = <T>() =>
  Annotation<T[]>({
    reducer: (_, next) => next,
    default: () => []
  });

export const CyclePlanningStateAnnotation = Annotation.Root({
  teamId: Annotation<string>,
  startAt: Annotation<string>,
  endAt: Annotation<string>,
  requestedCycleType: replaceReducer<CycleType | null>(null),
  requestedGoalSummary: replaceReducer<string | null>(null),
  requestedPriorityFocus: replaceReducer<string | null>(null),
  team: replaceReducer<Team | null>(null),
  members: replaceArrayReducer<Member>(),
  preferenceProfiles: replaceArrayReducer<PreferenceProfile>(),
  memoryInputs: replaceArrayReducer<PlanningMemoryInput>(),
  cyclePlan: replaceReducer<CyclePlanDraft | null>(null),
  cycle: replaceReducer<Cycle | null>(null),
  projects: replaceArrayReducer<Project>(),
  tasks: replaceArrayReducer<Task>()
});

export type CyclePlanningState = typeof CyclePlanningStateAnnotation.State;
export type CyclePlanningStateUpdate = typeof CyclePlanningStateAnnotation.Update;

export interface CyclePlanningDependencies {
  getTeamById: typeof import("@/lib/domain/team/repository").getTeamById;
  listMembersByTeamId: typeof import("@/lib/domain/team/repository").listMembersByTeamId;
  listPreferenceProfilesByTeamId: typeof import("@/lib/domain/team/repository").listPreferenceProfilesByTeamId;
  fetchMemoryInputsForPlanning: typeof import("@/lib/domain/memory/repository").fetchMemoryInputsForPlanning;
  createCycle: typeof import("@/lib/domain/cycle/repository").createCycle;
  createProject: typeof import("@/lib/domain/cycle/repository").createProject;
  createTask: typeof import("@/lib/domain/cycle/repository").createTask;
}
