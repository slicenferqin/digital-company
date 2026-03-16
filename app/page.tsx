import Link from "next/link";

import { WorkbenchOverviewClient } from "./workbench-overview-client";

const bossInterfaces = [
  {
    title: "秘书长简报",
    detail: "把内部协作压缩成老板可判断的摘要，不把注意力浪费在 agent 过程。"
  },
  {
    title: "待决策事项",
    detail: "只在需要拍板时打断老板，让团队继续运转而不是卡在编排壳子里。"
  },
  {
    title: "交付资产",
    detail: "首页先展示内容与质量状态，证明团队在持续交付，而不是只会跑流程。"
  }
];

const signals = [
  "第二周期开始，老板重复解释业务背景的频率应下降。",
  "反馈要改变下一周期的任务结构、审核规则或审批策略。",
  "首页读取真实团队数据，不把内部技术 demo 当产品成立证据。"
];

export default function HomePage() {
  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="badge">Persistent Team</div>
          <h1>Digital Company</h1>
          <p>
            第一版对象不是完整公司，而是一支持续运转的数字内容增长团队。
          </p>
        </div>

        <nav className="nav">
          <Link className="navItem active" href="#workbench-overview">
            <strong>团队总览</strong>
            <span>看本周期在推进什么，以及老板下一步该做什么。</span>
          </Link>
          <Link className="navItem" href="#briefing-panel">
            <strong>秘书长简报</strong>
            <span>把复杂过程压缩成可判断的材料。</span>
          </Link>
          <Link className="navItem" href="#artifact-panel">
            <strong>交付物中心</strong>
            <span>先看业务资产，不先看 agent 过程。</span>
          </Link>
        </nav>

        <section className="sideCard">
          <h2>团队脉搏</h2>
          <dl className="facts">
            <div>
              <dt>产品对象</dt>
              <dd>数字内容增长团队</dd>
            </div>
            <div>
              <dt>时间单位</dt>
              <dd>按周期推进</dd>
            </div>
            <div>
              <dt>老板接口</dt>
              <dd>简报、审批、复盘</dd>
            </div>
          </dl>
        </section>
      </aside>

      <section className="workspace">
        <header className="hero">
          <div>
            <p className="eyebrow">Boss Workbench</p>
            <h2>接手一支持续运转的数字内容增长团队，而不是点一次按钮生成临时 team。</h2>
            <p className="lede">
              首页现在以 `团队 / 周期 / 简报 / 决策 / 资产` 为对象组织信息。
              主路径优先暴露真实工作台聚合数据，内部 Phase 0 demo 只保留在独立验证页。
            </p>
          </div>
          <div className="heroActions">
            <Link className="primaryButton" href="#workbench-overview">
              进入真实工作台
            </Link>
            <Link className="secondaryButton" href="/demo/phase0">
              查看内部 Demo
            </Link>
          </div>
        </header>

        <div className="contentGrid">
          <section className="panel">
            <h3>老板接口</h3>
            <div className="cardStack">
              {bossInterfaces.map((item) => (
                <article className="miniCard" key={item.title}>
                  <strong>{item.title}</strong>
                  <p>{item.detail}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="panel">
            <h3>这版骨架要验证什么</h3>
            <div className="signalStack">
              {signals.map((signal) => (
                <article className="signal" key={signal}>
                  <p>{signal}</p>
                </article>
              ))}
            </div>
          </section>
        </div>

        <WorkbenchOverviewClient />

        <section className="panel internalNote">
          <h3>当前状态说明</h3>
          <p>
            真实首页优先读取数据库聚合后的团队概览。内部 Phase 0 演示继续保留为验证路径，
            但不再承担“产品已成立”的叙事职责。
          </p>
          <Link className="textLink" href="/demo/phase0">
            查看内部 Phase 0 demo 路径
          </Link>
        </section>
      </section>
    </main>
  );
}
