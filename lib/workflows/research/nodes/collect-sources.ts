import type { ResearchGraphDependencies, ResearchState } from "../state";

export function createCollectSourcesNode(dependencies: ResearchGraphDependencies) {
  return async function collectSources(state: ResearchState) {
    const provider = dependencies.providers[state.providerKey];

    if (!provider) {
      throw new Error(`Unknown research provider: ${state.providerKey}`);
    }

    const providerResult = await provider.search({
      query: state.query,
      maxResults: state.maxResults,
      includeDomains: state.includeDomains
    });

    return {
      providerResult,
      sources: providerResult.sources,
      nodeCosts: providerResult.nodeCosts
    };
  };
}
