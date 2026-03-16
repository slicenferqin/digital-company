"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type WorkbenchOverviewResponse = {
  overview: {
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
    metrics: {
      cycleLeadTimeHours: number;
      artifactPassRate: number;
      ownerInterventionRate: number;
      averageRevisionRounds: number;
      escalationFrequency: number;
      workflowRecoveryFailures: number;
    };
  } | null;
};

const bootstrapPayload = {
  seedInitialCycle: true,
  mode: "manual",
  businessName: "Acme",
  businessPositioning: "AI 销售自动化",
  brandVoice: "直接、克制、务实",
  targetAudience: "Founder-led B2B 团队负责人",
  coreOffer: "持续交付的数字内容增长团队",
  primaryChannels: ["公众号", "小红书"]
};

function formatDateTime(value: string | null) {
  if (!value) {
    return "暂无";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function formatCycleWindow(startAt: string | null, endAt: string | null) {
  if (!startAt || !endAt) {
    return "未启动";
  }

  const formatter = new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric"
  });

  return `${formatter.format(new Date(startAt))} - ${formatter.format(new Date(endAt))}`;
}

export function WorkbenchOverviewClient() {
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [advancingCycle, setAdvancingCycle] = useState(false);
  const [launchingNextCycleForArtifact, setLaunchingNextCycleForArtifact] = useState<string | null>(null);
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);
  const [decisionActionKey, setDecisionActionKey] = useState<string | null>(null);
  const [artifactFeedbackDrafts, setArtifactFeedbackDrafts] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [overview, setOverview] = useState<WorkbenchOverviewResponse["overview"]>(null);

  const loadOverview = useCallback(
    async (options?: {
      teamId?: string | null;
      preserveLoading?: boolean;
    }) => {
      if (!options?.preserveLoading) {
        setLoading(true);
      }
      setError(null);

      try {
        const teamId = options?.teamId ?? activeTeamId;
        const search = teamId ? `?teamId=${encodeURIComponent(teamId)}` : "";
        const response = await fetch(`/api/workbench/overview${search}`);

        if (response.status === 404) {
          setOverview(null);
          return;
        }

        if (!response.ok) {
          throw new Error("加载工作台失败");
        }

        const data = (await response.json()) as WorkbenchOverviewResponse;
        setOverview(data.overview);
        if (data.overview?.team.id) {
          setActiveTeamId(data.overview.team.id);
        }
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : "加载工作台失败");
      } finally {
        if (!options?.preserveLoading) {
          setLoading(false);
        }
      }
    },
    [activeTeamId]
  );

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  async function handleBootstrap() {
    setCreating(true);
    setError(null);

    try {
      const response = await fetch("/api/teams/bootstrap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(bootstrapPayload)
      });

      if (!response.ok) {
        throw new Error("创建真实团队失败");
      }

      const data = (await response.json()) as {
        team?: {
          id: string;
        };
      };

      if (data.team?.id) {
        setActiveTeamId(data.team.id);
      }

      await loadOverview({
        teamId: data.team?.id ?? null
      });
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "创建真实团队失败");
    } finally {
      setCreating(false);
    }
  }

  async function handleDecisionAction(
    decisionId: string,
    action: "approve" | "reject" | "revise"
  ) {
    const actionKey = `${decisionId}:${action}`;
    setDecisionActionKey(actionKey);
    setError(null);

    try {
      const response = await fetch(`/api/decisions/${decisionId}/${action}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({})
      });

      if (!response.ok) {
        throw new Error("处理老板决策失败");
      }

      await loadOverview({
        preserveLoading: true
      });
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "处理老板决策失败");
    } finally {
      setDecisionActionKey(null);
    }
  }

  async function handleAdvanceCycle() {
    if (!overview?.cycle?.id) {
      return;
    }

    setAdvancingCycle(true);
    setError(null);

    try {
      const response = await fetch(`/api/cycles/${overview.cycle.id}/advance`, {
        method: "POST"
      });

      if (!response.ok) {
        throw new Error("推进周期失败");
      }

      const data = (await response.json()) as {
        noOpReason?: string | null;
      };

      if (data.noOpReason) {
        setError(data.noOpReason);
      }

      await loadOverview({
        preserveLoading: true
      });
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "推进周期失败");
    } finally {
      setAdvancingCycle(false);
    }
  }

  async function handleLaunchNextCycle(artifactId: string) {
    if (!overview?.cycle?.id) {
      return;
    }

    setLaunchingNextCycleForArtifact(artifactId);
    setError(null);

    try {
      const response = await fetch(`/api/cycles/${overview.cycle.id}/next`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          artifactId,
          action: "published",
          reasonCode: "style",
          note: artifactFeedbackDrafts[artifactId] || "延续更直接、克制、先给结论的写法。"
        })
      });

      if (!response.ok) {
        throw new Error("启动下一周期失败");
      }

      setArtifactFeedbackDrafts((current) => ({
        ...current,
        [artifactId]: ""
      }));

      await loadOverview({
        preserveLoading: true
      });
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "启动下一周期失败");
    } finally {
      setLaunchingNextCycleForArtifact(null);
    }
  }

  const metricCards = useMemo(() => {
    if (!overview) {
      return [];
    }

    return [
      {
        label: "团队人数",
        value: `${overview.pulse.memberCount}`
      },
      {
        label: "待决策",
        value: `${overview.pulse.pendingDecisions}`
      },
      {
        label: "已通过资产",
        value: `${overview.pulse.approvedArtifacts}`
      },
      {
        label: "最新简报",
        value: formatDateTime(overview.pulse.latestBriefingAt)
      }
    ];
  }, [overview]);

  if (loading) {
    return (
      <section className="panel workbenchPanel" id="workbench-overview" data-testid="workbench-overview">
        <p className="sectionHint">正在加载真实工作台数据…</p>
      </section>
    );
  }

  if (!overview) {
    return (
      <section
        className="panel workbenchPanel"
        id="workbench-overview"
        data-testid="workbench-overview"
      >
        <div className="emptyState">
          <h3>真实工作台尚无团队数据</h3>
          <p>
            这里不是内部 demo。点击下面的按钮会通过真实 `/api/teams/bootstrap`
            先创建团队，再自动落一条首周期主链路：策略卡、研究摘要、长文 draft、简报与待决策事项。
          </p>
          <div className="heroActions">
            <button
              className="primaryButton"
              type="button"
              onClick={handleBootstrap}
              disabled={creating}
              data-testid="bootstrap-team-with-cycle"
            >
              {creating ? "创建中…" : "创建团队并启动首周期"}
            </button>
          </div>
          {error ? (
            <div className="demoError" role="alert">
              {error}
            </div>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <section className="workbenchStack" id="workbench-overview" data-testid="workbench-overview">
      {error ? (
        <div className="demoError" role="alert">
          {error}
        </div>
      ) : null}

      <section className="panel workbenchPanel" data-testid="workbench-team-panel">
        <div className="workbenchHeader">
          <div>
            <p className="eyebrow">Real Workbench</p>
            <h3 data-testid="workbench-team-name">{overview.team.name}</h3>
            <p className="demoCopy">
              {overview.team.businessPositioning ??
                overview.team.coreOffer ??
                overview.team.businessName}
            </p>
          </div>
          <div className="factGroup">
            <span>渠道：{overview.team.primaryChannels.join(" / ") || "待配置"}</span>
            <span>品牌语气：{overview.team.brandVoice ?? "待补充"}</span>
            <span>周期：{overview.cycle?.status ?? "尚未启动"}</span>
          </div>
        </div>
        <p className="sectionHint">首页读取真实数据库聚合结果，而不是内部演示态。</p>
      </section>

      <section className="metricGrid">
        {metricCards.map((item) => (
          <article className="miniCard" key={item.label}>
            <strong>{item.label}</strong>
            <p>{item.value}</p>
          </article>
        ))}
      </section>

      <div className="contentGrid">
        <section className="panel">
          <h3>当前周期</h3>
          <div className="cardStack">
            <article className="miniCard" data-testid="workbench-cycle-card">
              <strong>{overview.cycle?.priorityFocus ?? "暂无活跃周期"}</strong>
              <p>{overview.cycle?.goalSummary ?? "先创建团队或启动周期。"}</p>
              <p className="sectionHint">
                周期窗口：
                {formatCycleWindow(overview.cycle?.startAt ?? null, overview.cycle?.endAt ?? null)}
              </p>
              {overview.cycle ? (
                <div className="decisionActions">
                  <button
                    className="decisionButton approveButton"
                    type="button"
                    onClick={() => void handleAdvanceCycle()}
                    disabled={advancingCycle || decisionActionKey !== null}
                    data-testid="advance-cycle-button"
                  >
                    {advancingCycle ? "推进中…" : "推进今日节拍"}
                  </button>
                </div>
              ) : null}
            </article>
          </div>
        </section>

        <section className="panel" id="briefing-panel">
          <h3>秘书长简报</h3>
          <div className="cardStack">
            <article className="miniCard" data-testid="workbench-briefing-card">
              <strong>{overview.latestBriefing?.title ?? "暂无简报"}</strong>
              <p>{overview.latestBriefing?.summary ?? "当前还没有可展示的简报。"}</p>
              <p className="sectionHint">
                更新时间：{formatDateTime(overview.latestBriefing?.publishedAt ?? null)}
              </p>
            </article>
          </div>
        </section>

        <section className="panel" id="decision-panel">
          <h3>待我决策</h3>
          <div className="cardStack">
            {overview.pendingDecisions.length > 0 ? (
              overview.pendingDecisions.map((decision) => (
                <article className="miniCard" key={decision.id} data-testid="workbench-decision-card">
                  <strong>{decision.title}</strong>
                  <p>{decision.summary ?? `workflow: ${decision.workflowStatus}`}</p>
                  <p className="sectionHint">状态：{decision.status}</p>
                  <div className="decisionActions">
                    <button
                      className="decisionButton approveButton"
                      type="button"
                      onClick={() => void handleDecisionAction(decision.id, "approve")}
                      disabled={decisionActionKey !== null}
                      data-testid={`approve-decision-${decision.id}`}
                    >
                      {decisionActionKey === `${decision.id}:approve` ? "处理中…" : "批准"}
                    </button>
                    <button
                      className="decisionButton reviseButton"
                      type="button"
                      onClick={() => void handleDecisionAction(decision.id, "revise")}
                      disabled={decisionActionKey !== null}
                      data-testid={`revise-decision-${decision.id}`}
                    >
                      {decisionActionKey === `${decision.id}:revise` ? "处理中…" : "要求修订"}
                    </button>
                    <button
                      className="decisionButton rejectButton"
                      type="button"
                      onClick={() => void handleDecisionAction(decision.id, "reject")}
                      disabled={decisionActionKey !== null}
                      data-testid={`reject-decision-${decision.id}`}
                    >
                      {decisionActionKey === `${decision.id}:reject` ? "处理中…" : "驳回"}
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <article className="miniCard" data-testid="workbench-decision-card">
                <strong>暂无待决策事项</strong>
                <p>当前没有 pending decision。</p>
              </article>
            )}
          </div>
        </section>
      </div>

      <section className="panel" id="artifact-panel">
        <h3>最新交付</h3>
        <div className="demoGrid">
          {overview.latestArtifacts.length > 0 ? (
            overview.latestArtifacts.map((artifact) => (
              <article className="miniCard" key={artifact.id} data-testid="workbench-artifact-card">
                <strong>{artifact.title}</strong>
                <p>
                  {artifact.artifactType} · v{artifact.version} · {artifact.status}
                </p>
                <p className="sectionHint">{artifact.summary ?? "当前版本未附摘要。"}</p>
                {overview.cycle && ["article_draft", "social_post"].includes(artifact.artifactType) ? (
                  <div className="artifactFeedbackBox">
                    <textarea
                      className="artifactFeedbackInput"
                      value={artifactFeedbackDrafts[artifact.id] ?? ""}
                      onChange={(event) =>
                        setArtifactFeedbackDrafts((current) => ({
                          ...current,
                          [artifact.id]: event.target.value
                        }))
                      }
                      placeholder="例如：下一周期继续首段先给结论，减少背景铺垫。"
                      data-testid={`artifact-feedback-input-${artifact.id}`}
                    />
                    <button
                      className="decisionButton approveButton"
                      type="button"
                      onClick={() => void handleLaunchNextCycle(artifact.id)}
                      disabled={launchingNextCycleForArtifact !== null}
                      data-testid={`launch-next-cycle-${artifact.id}`}
                    >
                      {launchingNextCycleForArtifact === artifact.id
                        ? "启动中…"
                        : "采纳并启动下一周期"}
                    </button>
                  </div>
                ) : null}
              </article>
            ))
          ) : (
            <article className="miniCard" data-testid="workbench-artifact-card">
              <strong>暂无交付资产</strong>
              <p>先让团队进入真实周期，再看产出。</p>
            </article>
          )}
        </div>
      </section>
    </section>
  );
}
