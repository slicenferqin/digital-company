import type { ResearchProvider, ResearchSearchInput, ResearchSearchResult, ResearchSource } from "./base";

export class StubResearchProvider implements ResearchProvider {
  readonly providerName = "stub";

  constructor(
    private readonly options: {
      sources: ResearchSource[];
      answer?: string;
      nodeCostAmount?: number;
    }
  ) {}

  async search(input: ResearchSearchInput): Promise<ResearchSearchResult> {
    return {
      provider: this.providerName,
      query: input.query,
      answer: this.options.answer ?? null,
      requestId: "stub_request",
      rawMetadata: {
        maxResults: input.maxResults ?? this.options.sources.length
      },
      nodeCosts: [
        {
          nodeKey: "collect_sources",
          provider: this.providerName,
          metric: "requests",
          amount: this.options.nodeCostAmount ?? 1,
          notes: "Stubbed provider request"
        }
      ],
      sources: this.options.sources.slice(0, input.maxResults ?? this.options.sources.length)
    };
  }
}
