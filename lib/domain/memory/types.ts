export type MemoryType = "rule" | "preference" | "experience" | "feedback" | "summary";

export interface MemoryEntry {
  id: string;
  teamId: string;
  cycleId: string | null;
  sourceTaskId: string | null;
  sourceArtifactId: string | null;
  authorMemberId: string | null;
  type: MemoryType;
  title: string;
  summary: string | null;
  bodyMarkdown: string | null;
  tags: string[];
  importance: number;
  metadata: Record<string, unknown>;
  effectiveFrom: Date | null;
  effectiveTo: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMemoryEntryInput {
  teamId: string;
  cycleId?: string;
  sourceTaskId?: string;
  sourceArtifactId?: string;
  authorMemberId?: string;
  type: MemoryType;
  title: string;
  summary?: string;
  bodyMarkdown?: string;
  tags?: string[];
  importance?: number;
  metadata?: Record<string, unknown>;
  effectiveFrom?: Date;
  effectiveTo?: Date;
}

export interface PlanningMemoryInput {
  id: string;
  type: MemoryType;
  title: string;
  summary: string | null;
  tags: string[];
  importance: number;
}
