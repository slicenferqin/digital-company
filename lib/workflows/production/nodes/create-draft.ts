import type { ProductionGraphDependencies, ProductionState } from "../state";

function renderLeadParagraph(state: ProductionState) {
  if (state.summary?.trim()) {
    return `结论：${state.summary.trim()}`;
  }

  return `结论：${state.title} 应优先服务当前周期重点，并保持可审核、可复用、可迭代。`;
}

function applyWritingGuidelines(state: ProductionState) {
  const baseBody = state.bodyMarkdown.trim();
  const normalizedRules = state.writingGuidelines
    .map((item) => item.trim())
    .filter(Boolean);

  if (normalizedRules.length === 0) {
    return baseBody;
  }

  const blocks: string[] = [];

  if (normalizedRules.some((item) => item.includes("首段先给结论") || item.includes("先给结论"))) {
    blocks.push(renderLeadParagraph(state));
  }

  blocks.push(`> 写作规则：${normalizedRules.join("；")}`);
  blocks.push(baseBody);

  return blocks.join("\n\n");
}

export function createDraftNode(dependencies: ProductionGraphDependencies) {
  return async function createDraft(state: ProductionState) {
    const bodyMarkdown = applyWritingGuidelines(state);
    const draftArtifact = await dependencies.createArtifactDraft({
      teamId: state.teamId,
      cycleId: state.cycleId,
      projectId: state.projectId ?? undefined,
      taskId: state.taskId ?? undefined,
      artifactType: state.artifactType,
      title: state.title,
      authorMemberId: state.authorMemberId ?? undefined,
      reviewerMemberId: state.reviewerMemberId ?? undefined,
      summary: state.summary ?? undefined,
      bodyMarkdown,
      metadata: {
        writingGuidelines: state.writingGuidelines,
        reviewGuidelines: state.reviewGuidelines
      }
    });

    return {
      draftArtifact,
      versionTrail: [draftArtifact]
    };
  };
}
