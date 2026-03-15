export interface ResearchSearchInput {
  query: string;
  maxResults?: number;
  includeDomains?: string[];
}

export interface ResearchSource {
  title: string;
  url: string;
  snippet: string;
  publishedAt: string | null;
  author: string | null;
  domain: string | null;
  score: number | null;
}

export interface ResearchNodeCost {
  nodeKey: string;
  provider: string;
  metric: "credits" | "usd" | "requests";
  amount: number;
  notes?: string;
}

export interface ResearchSearchResult {
  provider: string;
  query: string;
  sources: ResearchSource[];
  answer: string | null;
  requestId: string | null;
  rawMetadata: Record<string, unknown>;
  nodeCosts: ResearchNodeCost[];
}

export interface ResearchProvider {
  providerName: string;
  search(input: ResearchSearchInput): Promise<ResearchSearchResult>;
}

export class ResearchProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ResearchProviderError";
  }
}

export function extractDomain(url: string) {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}
