import { createMemoryEntry } from "@/lib/domain/memory/repository";

export interface MemoryWritebackInput {
  teamId: string;
  cycleId?: string;
  sourceArtifactId?: string;
  title: string;
  summary: string;
  bodyMarkdown?: string;
  tags?: string[];
  importance?: number;
}

export async function writeFeedbackLessonToMemory(input: MemoryWritebackInput) {
  return createMemoryEntry({
    teamId: input.teamId,
    cycleId: input.cycleId,
    sourceArtifactId: input.sourceArtifactId,
    type: "feedback",
    title: input.title,
    summary: input.summary,
    bodyMarkdown: input.bodyMarkdown,
    tags: input.tags ?? ["feedback"],
    importance: input.importance ?? 5
  });
}
