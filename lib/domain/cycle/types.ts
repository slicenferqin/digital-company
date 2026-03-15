export type CycleType = "weekly" | "campaign" | "custom";
export type CycleStatus = "draft" | "planned" | "active" | "paused" | "completed" | "cancelled";
export type ProjectType =
  | "strategy"
  | "research"
  | "writing"
  | "editing"
  | "distribution"
  | "retrospective";
export type ProjectStatus = "planned" | "active" | "completed" | "cancelled";
export type TaskStatus = "pending" | "in_progress" | "blocked" | "in_review" | "completed" | "cancelled";

export interface Cycle {
  id: string;
  teamId: string;
  cycleType: CycleType;
  goalSummary: string;
  priorityFocus: string;
  status: CycleStatus;
  startAt: Date;
  endAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  teamId: string;
  cycleId: string;
  type: ProjectType;
  title: string;
  goal: string;
  priority: number;
  ownerMemberId: string | null;
  status: ProjectStatus;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  teamId: string;
  cycleId: string;
  projectId: string;
  assignedMemberId: string | null;
  taskType: string;
  title: string;
  inputContext: Record<string, unknown>;
  status: TaskStatus;
  blockedReason: string | null;
  requiresOwnerApproval: boolean;
  priority: number;
  dueAt: Date | null;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCycleInput {
  teamId: string;
  cycleType?: CycleType;
  goalSummary: string;
  priorityFocus: string;
  status?: CycleStatus;
  startAt: Date;
  endAt: Date;
}

export interface CreateProjectInput {
  teamId: string;
  cycleId: string;
  type?: ProjectType;
  title: string;
  goal: string;
  priority?: number;
  ownerMemberId?: string;
  status?: ProjectStatus;
  metadata?: Record<string, unknown>;
}

export interface CreateTaskInput {
  teamId: string;
  cycleId: string;
  projectId: string;
  assignedMemberId?: string;
  taskType: string;
  title: string;
  inputContext?: Record<string, unknown>;
  status?: TaskStatus;
  blockedReason?: string;
  requiresOwnerApproval?: boolean;
  priority?: number;
  dueAt?: Date;
}
