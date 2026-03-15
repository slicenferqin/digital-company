import type { ResearchGraphDependencies, ResearchState } from "../state";

function renderResearchBody(state: ResearchState) {
  const lines = [
    `# 研究摘要：${state.query}`,
    "",
    "## 关键信号"
  ];

  for (const source of state.sources.slice(0, 5)) {
    lines.push(`- **${source.title}**：${source.snippet || "该来源未返回可摘要内容。"}`);
  }

  if (state.providerResult?.answer) {
    lines.push("", "## 提供方答案", "", state.providerResult.answer);
  }

  lines.push("", "## 来源列表");

  state.sources.forEach((source, index) => {
    lines.push(
      `${index + 1}. [${source.title}](${source.url})${source.domain ? ` · ${source.domain}` : ""}`
    );
  });

  return lines.join("\n");
}

export function createSummarizeFindingsNode(dependencies: ResearchGraphDependencies) {
  return async function summarizeFindings(state: ResearchState) {
    const headlineSources = state.sources.slice(0, 3).map((source) => source.title);
    const summaryText =
      headlineSources.length > 0
        ? `已围绕「${state.query}」收集 ${state.sources.length} 个来源，重点包括：${headlineSources.join("、")}。`
        : `已执行「${state.query}」研究，但未收集到有效来源。`;
    const bodyMarkdown = renderResearchBody(state);
    const artifact = await dependencies.createArtifactDraft({
      teamId: state.teamId,
      cycleId: state.cycleId,
      projectId: state.projectId ?? undefined,
      taskId: state.taskId ?? undefined,
      artifactType: "research_summary",
      title: state.artifactTitle ?? `研究摘要：${state.query}`,
      summary: summaryText,
      bodyMarkdown,
      metadata: {
        query: state.query,
        provider: state.providerResult?.provider ?? state.providerKey,
        requestId: state.providerResult?.requestId ?? null,
        sources: state.sources,
        providerMetadata: state.providerResult?.rawMetadata ?? {},
        nodeCosts: [
          ...state.nodeCosts,
          {
            nodeKey: "summarize_findings",
            provider: "local",
            metric: "usd",
            amount: 0,
            notes: "Deterministic local summarization"
          }
        ]
      }
    });

    return {
      summary: {
        summary: summaryText,
        bodyMarkdown
      },
      artifact,
      nodeCosts: [
        ...state.nodeCosts,
        {
          nodeKey: "summarize_findings",
          provider: "local",
          metric: "usd",
          amount: 0,
          notes: "Deterministic local summarization"
        }
      ]
    };
  };
}
