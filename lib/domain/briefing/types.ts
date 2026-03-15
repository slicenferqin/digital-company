export type BriefingType = "daily" | "weekly" | "cycle" | "escalation" | "decision";
export type BriefingStatus = "draft" | "published" | "archived";

export interface Briefing {
  id: string;
  teamId: string;
  cycleId: string | null;
  authorMemberId: string | null;
  type: BriefingType;
  status: BriefingStatus;
  title: string;
  summary: string | null;
  bodyMarkdown: string | null;
  highlights: string[];
  risks: string[];
  actionItems: string[];
  metadata: Record<string, unknown>;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBriefingInput {
  teamId: string;
  cycleId?: string;
  authorMemberId?: string;
  type: BriefingType;
  status?: BriefingStatus;
  title: string;
  summary?: string;
  bodyMarkdown?: string;
  highlights?: string[];
  risks?: string[];
  actionItems?: string[];
  metadata?: Record<string, unknown>;
  publishedAt?: Date;
}
