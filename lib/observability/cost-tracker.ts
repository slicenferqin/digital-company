export type WorkflowGraphKey =
  | "cycle-planning"
  | "research"
  | "production"
  | "briefing"
  | "review-feedback";

export type CostMetric = "credits" | "usd" | "requests";

export interface WorkflowNodeCostRecord {
  graph: WorkflowGraphKey;
  nodeKey: string;
  provider: string;
  metric: CostMetric;
  amount: number;
  cycleId?: string | null;
  runId?: string | null;
  notes?: string;
}

export interface WorkflowCostSummary {
  graph: WorkflowGraphKey;
  totalUsd: number;
  totalCredits: number;
  totalRequests: number;
  entries: WorkflowNodeCostRecord[];
}

export function normalizeWorkflowNodeCosts(
  graph: WorkflowGraphKey,
  entries: Array<Omit<WorkflowNodeCostRecord, "graph">>
): WorkflowNodeCostRecord[] {
  return entries.map((entry) => ({
    graph,
    ...entry
  }));
}

export function summarizeWorkflowCosts(
  entries: WorkflowNodeCostRecord[]
): Record<WorkflowGraphKey, WorkflowCostSummary> {
  const emptySummary = (graph: WorkflowGraphKey): WorkflowCostSummary => ({
    graph,
    totalUsd: 0,
    totalCredits: 0,
    totalRequests: 0,
    entries: []
  });

  const graphs: WorkflowGraphKey[] = [
    "cycle-planning",
    "research",
    "production",
    "briefing",
    "review-feedback"
  ];

  const initial = Object.fromEntries(graphs.map((graph) => [graph, emptySummary(graph)])) as Record<
    WorkflowGraphKey,
    WorkflowCostSummary
  >;

  for (const entry of entries) {
    const summary = initial[entry.graph];
    summary.entries.push(entry);

    if (entry.metric === "usd") {
      summary.totalUsd += entry.amount;
    } else if (entry.metric === "credits") {
      summary.totalCredits += entry.amount;
    } else if (entry.metric === "requests") {
      summary.totalRequests += entry.amount;
    }
  }

  return initial;
}
