const priorities = [
  "先看秘书长简报，确认本周期真正需要你介入的两件事。",
  "再处理一条主线决策，让团队继续推进而不是卡在过程里。",
  "最后看已经成形的资产，不先看底层 agent 过程。"
];

const outputs = [
  {
    title: "本周内容策略卡",
    detail: "聚焦老板视角的 AI 销售自动化主题，进入第二周期继续优化。"
  },
  {
    title: "旗舰长文初稿",
    detail: "已有主稿版本，等待老板确认角度与品牌边界。"
  },
  {
    title: "秘书长简报",
    detail: "团队内部争议、风险升级和建议动作已压缩成可判断材料。"
  }
];

const signals = [
  "第二周期开始，老板重复说明业务背景的频率应下降。",
  "高价值内容应逐步减少返工，而不是只增加产出量。",
  "系统目标是经营团队，不是运行一次定时工作流。"
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
          <button className="navItem active">
            <strong>团队总览</strong>
            <span>看本周期在推进什么，以及老板下一步该做什么。</span>
          </button>
          <button className="navItem">
            <strong>秘书长简报</strong>
            <span>把复杂过程压缩成可判断的材料。</span>
          </button>
          <button className="navItem">
            <strong>交付物中心</strong>
            <span>先看业务资产，不先看 agent 过程。</span>
          </button>
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
            <p className="eyebrow">Task 1 Skeleton</p>
            <h2>不是创建一家公司，而是接手一支会持续成长的小团队。</h2>
            <p className="lede">
              这个原型基线沿用 balanced 版的低心智负担布局，但内容对象切换成
              `团队 / 周期 / 资产 / 简报 / 决策`，作为后续真实工作台的母版。
            </p>
          </div>
          <div className="heroActions">
            <button className="primaryButton">查看本周期简报</button>
            <button className="secondaryButton">查看最新资产</button>
          </div>
        </header>

        <div className="contentGrid">
          <section className="panel">
            <h3>今天只看这三件事</h3>
            <ul className="numberedList">
              {priorities.map((item, index) => (
                <li key={item}>
                  <span>{index + 1}</span>
                  <p>{item}</p>
                </li>
              ))}
            </ul>
          </section>

          <section className="panel">
            <h3>本周期已形成的交付</h3>
            <div className="cardStack">
              {outputs.map((item) => (
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
      </section>
    </main>
  );
}
