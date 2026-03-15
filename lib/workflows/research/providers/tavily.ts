import {
  extractDomain,
  ResearchProviderError,
  type ResearchProvider,
  type ResearchSearchInput,
  type ResearchSearchResult
} from "./base";

type TavilySearchResponse = {
  query?: string;
  answer?: string;
  request_id?: string;
  response_time?: number;
  results?: Array<{
    title?: string;
    url?: string;
    content?: string;
    published_date?: string;
    score?: number;
  }>;
};

export class TavilyResearchProvider implements ResearchProvider {
  readonly providerName = "tavily";

  constructor(
    private readonly options: {
      apiKey: string;
      endpoint?: string;
      searchDepth?: "basic" | "advanced" | "fast" | "ultra-fast";
    }
  ) {}

  async search(input: ResearchSearchInput): Promise<ResearchSearchResult> {
    if (!this.options.apiKey) {
      throw new ResearchProviderError("Missing Tavily API key");
    }

    const response = await fetch(this.options.endpoint ?? "https://api.tavily.com/search", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.options.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        query: input.query,
        max_results: input.maxResults ?? 5,
        search_depth: this.options.searchDepth ?? "basic",
        include_answer: "basic",
        include_domains: input.includeDomains
      })
    });

    if (!response.ok) {
      const body = await response.text();
      throw new ResearchProviderError(`Tavily request failed: ${response.status} ${body}`);
    }

    const data = (await response.json()) as TavilySearchResponse;
    const searchDepth = this.options.searchDepth ?? "basic";
    const credits = searchDepth === "advanced" ? 2 : 1;

    return {
      provider: this.providerName,
      query: data.query ?? input.query,
      answer: data.answer ?? null,
      requestId: data.request_id ?? null,
      rawMetadata: {
        responseTime: data.response_time ?? null,
        searchDepth
      },
      nodeCosts: [
        {
          nodeKey: "collect_sources",
          provider: this.providerName,
          metric: "credits",
          amount: credits,
          notes: `Tavily ${searchDepth} search`
        }
      ],
      sources: (data.results ?? [])
        .filter((result) => result.url && result.title)
        .map((result) => ({
          title: result.title ?? "Untitled source",
          url: result.url ?? "",
          snippet: result.content ?? "",
          publishedAt: result.published_date ?? null,
          author: null,
          domain: result.url ? extractDomain(result.url) : null,
          score: typeof result.score === "number" ? result.score : null
        }))
    };
  }
}
