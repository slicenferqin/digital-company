import { Annotation } from "@langchain/langgraph";

import type { Artifact } from "@/lib/domain/artifact/types";

import type {
  ResearchNodeCost,
  ResearchSearchResult,
  ResearchSource
} from "./providers/base";

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

export interface ResearchInput {
  teamId: string;
  cycleId: string;
  query: string;
  providerKey: string;
  projectId?: string;
  taskId?: string;
  artifactTitle?: string;
  maxResults?: number;
  includeDomains?: string[];
}

export interface ResearchSummary {
  summary: string;
  bodyMarkdown: string;
}

export const ResearchStateAnnotation = Annotation.Root({
  teamId: Annotation<string>,
  cycleId: Annotation<string>,
  query: Annotation<string>,
  providerKey: Annotation<string>,
  projectId: replaceReducer<string | null>(null),
  taskId: replaceReducer<string | null>(null),
  artifactTitle: replaceReducer<string | null>(null),
  maxResults: replaceReducer<number>(5),
  includeDomains: replaceArrayReducer<string>(),
  providerResult: replaceReducer<ResearchSearchResult | null>(null),
  sources: replaceArrayReducer<ResearchSource>(),
  nodeCosts: replaceArrayReducer<ResearchNodeCost>(),
  summary: replaceReducer<ResearchSummary | null>(null),
  artifact: replaceReducer<Artifact | null>(null)
});

export type ResearchState = typeof ResearchStateAnnotation.State;
export type ResearchStateUpdate = typeof ResearchStateAnnotation.Update;

export interface ResearchGraphDependencies {
  providers: Record<string, import("./providers/base").ResearchProvider>;
  createArtifactDraft: typeof import("@/lib/domain/artifact/repository").createArtifactDraft;
}
