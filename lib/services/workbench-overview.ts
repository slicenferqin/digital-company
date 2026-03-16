import { desc, eq } from "drizzle-orm";

import { getDatabase } from "@/lib/db/client";
import { artifacts, briefings, cycles, decisions, members, teams } from "@/lib/db/schema";
import { computeWorkflowOverviewMetrics } from "@/lib/observability/workflow-metrics";

export interface WorkbenchOverviewData {
  team: {
    id: string;
    name: string;
    businessName: string;
    businessPositioning: string | null;
    coreOffer: string | null;
    brandVoice: string | null;
    primaryChannels: string[];
  };
  cycle: {
    id: string;
    goalSummary: string;
    priorityFocus: string;
    status: string;
    startAt: string;
    endAt: string;
  } | null;
  pulse: {
    memberCount: number;
    pendingDecisions: number;
    approvedArtifacts: number;
    latestBriefingAt: string | null;
  };
  latestBriefing: {
    id: string;
    title: string;
    summary: string | null;
    type: string;
    publishedAt: string | null;
  } | null;
  latestArtifacts: Array<{
    id: string;
    title: string;
    artifactType: string;
    status: string;
    version: number;
    summary: string | null;
  }>;
  pendingDecisions: Array<{
    id: string;
    title: string;
    status: string;
    summary: string | null;
    workflowStatus: string;
  }>;
  metrics: ReturnType<typeof computeWorkflowOverviewMetrics>;
}

type WorkbenchOverviewDependencies = {
  findTeam: (teamId?: string) => Promise<typeof teams.$inferSelect | null>;
  listMembers: (teamId: string) => Promise<Array<typeof members.$inferSelect>>;
  listCycles: (teamId: string) => Promise<Array<typeof cycles.$inferSelect>>;
  listArtifacts: (teamId: string) => Promise<Array<typeof artifacts.$inferSelect>>;
  listDecisions: (teamId: string) => Promise<Array<typeof decisions.$inferSelect>>;
  listBriefings: (teamId: string) => Promise<Array<typeof briefings.$inferSelect>>;
};

const defaultDependencies: WorkbenchOverviewDependencies = {
  async findTeam(teamId) {
    const db = getDatabase();

    if (teamId) {
      const [row] = await db.select().from(teams).where(eq(teams.id, teamId)).limit(1);
      return row ?? null;
    }

    const [row] = await db.select().from(teams).orderBy(desc(teams.createdAt)).limit(1);
    return row ?? null;
  },
  async listMembers(teamId) {
    const db = getDatabase();
    return db.select().from(members).where(eq(members.teamId, teamId));
  },
  async listCycles(teamId) {
    const db = getDatabase();
    return db.select().from(cycles).where(eq(cycles.teamId, teamId)).orderBy(desc(cycles.startAt));
  },
  async listArtifacts(teamId) {
    const db = getDatabase();
    return db
      .select()
      .from(artifacts)
      .where(eq(artifacts.teamId, teamId))
      .orderBy(desc(artifacts.updatedAt));
  },
  async listDecisions(teamId) {
    const db = getDatabase();
    return db
      .select()
      .from(decisions)
      .where(eq(decisions.teamId, teamId))
      .orderBy(desc(decisions.updatedAt));
  },
  async listBriefings(teamId) {
    const db = getDatabase();
    return db
      .select()
      .from(briefings)
      .where(eq(briefings.teamId, teamId))
      .orderBy(desc(briefings.updatedAt));
  }
};

function selectLatestVisibleArtifacts(artifactRows: Array<typeof artifacts.$inferSelect>) {
  const latestArtifacts = new Map<string, typeof artifacts.$inferSelect>();

  for (const artifact of artifactRows) {
    const key = `${artifact.cycleId}:${artifact.artifactType}:${artifact.title}`;
    const current = latestArtifacts.get(key);

    if (!current || artifact.version > current.version) {
      latestArtifacts.set(key, artifact);
    }
  }

  return [...latestArtifacts.values()]
    .filter((artifact) => artifact.status !== "rejected")
    .slice(0, 4);
}

export async function getWorkbenchOverview(
  teamId?: string,
  dependencies: WorkbenchOverviewDependencies = defaultDependencies
): Promise<WorkbenchOverviewData | null> {
  const team = await dependencies.findTeam(teamId);

  if (!team) {
    return null;
  }

  const [memberRows, cycleRows, artifactRows, decisionRows, briefingRows] = await Promise.all([
    dependencies.listMembers(team.id),
    dependencies.listCycles(team.id),
    dependencies.listArtifacts(team.id),
    dependencies.listDecisions(team.id),
    dependencies.listBriefings(team.id)
  ]);

  const latestCycle = cycleRows[0] ?? null;
  const latestBriefing = latestCycle
    ? briefingRows.find((briefing) => briefing.cycleId === latestCycle.id) ?? briefingRows[0] ?? null
    : briefingRows[0] ?? null;
  const latestArtifacts = latestCycle
    ? selectLatestVisibleArtifacts(artifactRows.filter((artifact) => artifact.cycleId === latestCycle.id))
    : selectLatestVisibleArtifacts(artifactRows);
  const pendingDecisions = decisionRows.filter((decision) => decision.status === "pending").slice(0, 4);

  return {
    team: {
      id: team.id,
      name: team.name,
      businessName: team.businessName,
      businessPositioning: team.businessPositioning,
      coreOffer: team.coreOffer,
      brandVoice: team.brandVoice,
      primaryChannels: team.primaryChannels
    },
    cycle: latestCycle
      ? {
          id: latestCycle.id,
          goalSummary: latestCycle.goalSummary,
          priorityFocus: latestCycle.priorityFocus,
          status: latestCycle.status,
          startAt: latestCycle.startAt.toISOString(),
          endAt: latestCycle.endAt.toISOString()
        }
      : null,
    pulse: {
      memberCount: memberRows.length,
      pendingDecisions: pendingDecisions.length,
      approvedArtifacts: artifactRows.filter((artifact) =>
        ["approved", "published"].includes(artifact.status)
      ).length,
      latestBriefingAt: latestBriefing?.publishedAt?.toISOString() ?? null
    },
    latestBriefing: latestBriefing
      ? {
          id: latestBriefing.id,
          title: latestBriefing.title,
          summary: latestBriefing.summary,
          type: latestBriefing.type,
          publishedAt: latestBriefing.publishedAt?.toISOString() ?? null
        }
      : null,
    latestArtifacts: latestArtifacts.map((artifact) => ({
      id: artifact.id,
      title: artifact.title,
      artifactType: artifact.artifactType,
      status: artifact.status,
      version: artifact.version,
      summary: artifact.summary
    })),
    pendingDecisions: pendingDecisions.map((decision) => ({
      id: decision.id,
      title: decision.title,
      status: decision.status,
      summary: decision.summary,
      workflowStatus: decision.workflowStatus
    })),
    metrics: computeWorkflowOverviewMetrics({
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
    })
  };
}
