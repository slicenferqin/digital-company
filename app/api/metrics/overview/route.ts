import { getDatabase } from "@/lib/db/client";
import { artifacts, briefings, cycles, decisions } from "@/lib/db/schema";
import { summarizeWorkflowCosts, type WorkflowNodeCostRecord } from "@/lib/observability/cost-tracker";
import { computeWorkflowOverviewMetrics } from "@/lib/observability/workflow-metrics";

function parseNodeCosts(
  metadata: Record<string, unknown> | null | undefined,
  fallbackGraph: "research" | "briefing"
): WorkflowNodeCostRecord[] {
  const raw = metadata?.nodeCosts;

  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .filter((entry): entry is Record<string, unknown> => typeof entry === "object" && entry !== null)
    .map((entry) => ({
      graph: fallbackGraph,
      nodeKey: typeof entry.nodeKey === "string" ? entry.nodeKey : "unknown",
      provider: typeof entry.provider === "string" ? entry.provider : "unknown",
      metric:
        entry.metric === "credits" || entry.metric === "usd" || entry.metric === "requests"
          ? entry.metric
          : "usd",
      amount: typeof entry.amount === "number" ? entry.amount : 0,
      notes: typeof entry.notes === "string" ? entry.notes : undefined,
      cycleId: null,
      runId: null
    }));
}

export async function GET() {
  const db = getDatabase();

  const [cycleRows, artifactRows, decisionRows, briefingRows] = await Promise.all([
    db.select().from(cycles),
    db.select().from(artifacts),
    db.select().from(decisions),
    db.select().from(briefings)
  ]);

  const costEntries: WorkflowNodeCostRecord[] = [
    ...artifactRows.flatMap((artifact) =>
      parseNodeCosts(artifact.metadata as Record<string, unknown>, "research").map((entry) => ({
        ...entry,
        cycleId: artifact.cycleId
      }))
    ),
    ...briefingRows.flatMap((briefing) =>
      parseNodeCosts(briefing.metadata as Record<string, unknown>, "briefing").map((entry) => ({
        ...entry,
        cycleId: briefing.cycleId
      }))
    )
  ];

  const costSummary = summarizeWorkflowCosts(costEntries);
  const overview = computeWorkflowOverviewMetrics({
    cycles: cycleRows.map((cycle) => ({
      id: cycle.id,
      status: cycle.status,
      startAt: cycle.startAt,
      updatedAt: cycle.updatedAt
    })),
    artifacts: artifactRows.map((artifact) => ({
      id: artifact.id,
      cycleId: artifact.cycleId,
      title: artifact.title,
      artifactType: artifact.artifactType,
      version: artifact.version,
      status: artifact.status
    })),
    decisions: decisionRows.map((decision) => ({
      id: decision.id,
      cycleId: decision.cycleId,
      relatedBriefingId: decision.relatedBriefingId,
      status: decision.status
    })),
    briefings: briefingRows.map((briefing) => ({
      id: briefing.id,
      cycleId: briefing.cycleId,
      type: briefing.type
    }))
  });

  return Response.json({
    costSummary,
    overview
  });
}
