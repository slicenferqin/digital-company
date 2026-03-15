import { describe, expect, it, vi } from "vitest";

import { StubResearchProvider } from "../../lib/workflows/research/providers/stub";
import { buildResearchGraph } from "../../lib/workflows/research/graph";

describe("research graph", () => {
  it("collects sources, summarizes findings, and persists a research artifact", async () => {
    const provider = new StubResearchProvider({
      answer: "Found repeated signals around founder-led B2B content workflows.",
      sources: [
        {
          title: "Founder-led growth notes",
          url: "https://example.com/founder-growth",
          snippet: "Founder-led teams need consistent content output with low coordination overhead.",
          publishedAt: "2026-03-01T00:00:00.000Z",
          author: "Jane Doe",
          domain: "example.com",
          score: 0.9
        },
        {
          title: "B2B content operations benchmark",
          url: "https://example.com/content-ops",
          snippet: "High-performing teams maintain reusable briefs, review standards, and weekly operating cadence.",
          publishedAt: "2026-03-02T00:00:00.000Z",
          author: "John Doe",
          domain: "example.com",
          score: 0.88
        }
      ]
    });

    const createArtifactDraft = vi.fn().mockResolvedValue({
      id: "artifact_1",
      teamId: "team_1",
      cycleId: "cycle_1",
      projectId: null,
      taskId: null,
      artifactType: "research_summary",
      title: "研究摘要：Founder-led B2B content teams",
      version: 1,
      status: "draft",
      authorMemberId: null,
      reviewerMemberId: null,
      summary: "已围绕「Founder-led B2B content teams」收集 2 个来源，重点包括：Founder-led growth notes、B2B content operations benchmark。",
      bodyMarkdown: "# 研究摘要",
      storageUri: null,
      metadata: {},
      reviewedAt: null,
      publishedAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const graph = buildResearchGraph({
      providers: {
        stub: provider
      },
      createArtifactDraft
    });

    const result = await graph.invoke({
      teamId: "team_1",
      cycleId: "cycle_1",
      query: "Founder-led B2B content teams",
      providerKey: "stub",
      projectId: null,
      taskId: null,
      artifactTitle: null,
      maxResults: 5,
      includeDomains: []
    });

    expect(createArtifactDraft).toHaveBeenCalledTimes(1);
    expect(createArtifactDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        teamId: "team_1",
        cycleId: "cycle_1",
        artifactType: "research_summary",
        metadata: expect.objectContaining({
          provider: "stub",
          sources: expect.arrayContaining([
            expect.objectContaining({
              title: "Founder-led growth notes"
            })
          ]),
          nodeCosts: expect.arrayContaining([
            expect.objectContaining({
              nodeKey: "collect_sources"
            }),
            expect.objectContaining({
              nodeKey: "summarize_findings"
            })
          ])
        })
      })
    );
    expect(result.sources).toHaveLength(2);
    expect(result.summary?.summary).toContain("收集 2 个来源");
    expect(result.artifact?.id).toBe("artifact_1");
  });
});
