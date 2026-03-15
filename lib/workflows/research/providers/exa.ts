import {
  extractDomain,
  ResearchProviderError,
  type ResearchProvider,
  type ResearchSearchInput,
  type ResearchSearchResult
} from "./base";

type ExaSearchResponse = {
  requestId?: string;
  searchType?: string;
  costDollars?: {
    total?: number;
  };
  results?: Array<{
    title?: string;
    url?: string;
    publishedDate?: string;
    author?: string;
    summary?: string;
    text?: string;
    highlights?: string[];
  }>;
};

export class ExaResearchProvider implements ResearchProvider {
  readonly providerName = "exa";

  constructor(
    private readonly options: {
      apiKey: string;
      endpoint?: string;
      searchType?: "auto" | "neural" | "fast" | "deep" | "deep-reasoning" | "instant";
    }
  ) {}

  async search(input: ResearchSearchInput): Promise<ResearchSearchResult> {
    if (!this.options.apiKey) {
      throw new ResearchProviderError("Missing Exa API key");
    }

    const response = await fetch(this.options.endpoint ?? "https://api.exa.ai/search", {
      method: "POST",
      headers: {
        "x-api-key": this.options.apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        query: input.query,
        type: this.options.searchType ?? "auto",
        numResults: input.maxResults ?? 5,
        includeDomains: input.includeDomains,
        contents: {
          highlights: {
            maxCharacters: 1200
          }
        }
      })
    });

    if (!response.ok) {
      const body = await response.text();
      throw new ResearchProviderError(`Exa request failed: ${response.status} ${body}`);
    }

    const data = (await response.json()) as ExaSearchResponse;
    const totalCost = data.costDollars?.total ?? 0;

    return {
      provider: this.providerName,
      query: input.query,
      answer: null,
      requestId: data.requestId ?? null,
      rawMetadata: {
        searchType: data.searchType ?? this.options.searchType ?? "auto"
      },
      nodeCosts: [
        {
          nodeKey: "collect_sources",
          provider: this.providerName,
          metric: "usd",
          amount: totalCost,
          notes: "Exa search request cost"
        }
      ],
      sources: (data.results ?? [])
        .filter((result) => result.url && result.title)
        .map((result) => ({
          title: result.title ?? "Untitled source",
          url: result.url ?? "",
          snippet:
            result.summary ?? result.highlights?.join(" ") ?? result.text ?? "",
          publishedAt: result.publishedDate ?? null,
          author: result.author ?? null,
          domain: result.url ? extractDomain(result.url) : null,
          score: null
        }))
    };
  }
}
