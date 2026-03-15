"use client";

import { useState } from "react";

type DemoStartResponse = {
  sessionId: string;
  team: { name: string };
  cycle: { goalSummary: string } | null;
  briefing: { title: string; summary: string | null } | null;
  artifact: { title: string; summary: string | null } | null;
  decision: { title: string; status: string } | null;
  status: string;
};

type DemoApproveResponse = {
  sessionId: string;
  decision: { title: string; status: string };
  status: string;
};

export function Phase0DemoClient() {
  const [loading, setLoading] = useState(false);
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demo, setDemo] = useState<DemoStartResponse | null>(null);
  const [approval, setApproval] = useState<DemoApproveResponse | null>(null);

  async function handleStart() {
    setLoading(true);
    setError(null);
    setApproval(null);

    try {
      const response = await fetch("/api/demo/phase0/start", { method: "POST" });
      if (!response.ok) {
        throw new Error("启动演示失败");
      }

      const data = (await response.json()) as DemoStartResponse;
      setDemo(data);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "启动演示失败");
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove() {
    if (!demo) return;

    setApproving(true);
    setError(null);

    try {
      const response = await fetch("/api/demo/phase0/approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          sessionId: demo.sessionId
        })
      });

      if (!response.ok) {
        throw new Error("批准演示决策失败");
      }

      const data = (await response.json()) as DemoApproveResponse;
      setApproval(data);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "批准演示决策失败");
    } finally {
      setApproving(false);
    }
  }

  return (
    <section className="panel demoPanel" data-testid="phase0-demo-panel">
      <div className="demoHeader">
        <div>
          <p className="eyebrow">Phase 0 Demo</p>
          <h3>一条可点击的端到端演示路径</h3>
          <p className="demoCopy">
            这条路径只用于内部技术验证，会串起 founding team bootstrap、cycle planning、
            research、production、briefing、owner decision 和 resume。
          </p>
        </div>
        <div className="heroActions">
          <button
            className="primaryButton"
            type="button"
            data-testid="start-phase0-demo"
            onClick={handleStart}
            disabled={loading}
          >
            {loading ? "演示启动中…" : "启动 Phase 0 演示"}
          </button>
          <button
            className="secondaryButton"
            type="button"
            data-testid="approve-phase0-decision"
            onClick={handleApprove}
            disabled={!demo || approval !== null || approving}
          >
            {approving ? "批准中…" : "批准老板决策"}
          </button>
        </div>
      </div>

      {error ? (
        <div className="demoError" role="alert">
          {error}
        </div>
      ) : null}

      {demo ? (
        <div className="demoGrid">
          <article className="miniCard" data-testid="demo-team-card">
            <strong>团队已创建</strong>
            <p>{demo.team.name}</p>
          </article>
          <article className="miniCard" data-testid="demo-cycle-card">
            <strong>周期已启动</strong>
            <p>{demo.cycle?.goalSummary ?? "暂无周期数据"}</p>
          </article>
          <article className="miniCard" data-testid="demo-briefing-card">
            <strong>秘书长简报</strong>
            <p>{demo.briefing?.title ?? "暂无简报"}</p>
          </article>
          <article className="miniCard" data-testid="demo-artifact-card">
            <strong>研究 / 交付资产</strong>
            <p>{demo.artifact?.title ?? "暂无交付资产"}</p>
          </article>
          <article className="miniCard" data-testid="demo-decision-card">
            <strong>老板待决策事项</strong>
            <p>{demo.decision?.title ?? "暂无决策"}</p>
            <span className="statusPill statusPending">
              {approval?.decision.status ?? demo.decision?.status ?? demo.status}
            </span>
          </article>
          <article className="miniCard" data-testid="demo-resume-card">
            <strong>恢复状态</strong>
            <p>{approval ? "工作流已从 checkpoint 恢复" : "等待老板批准后恢复"}</p>
          </article>
        </div>
      ) : (
        <div className="demoPlaceholder">
          先点击“启动 Phase 0 演示”，页面会展示一条完整的 persistent team owner flow。
        </div>
      )}
    </section>
  );
}
