import { Phase0DemoClient } from "@/app/phase0-demo-client";

export default function Phase0DemoPage() {
  return (
    <main className="shell">
      <section className="workspace demoWorkspace">
        <header className="hero">
          <div>
            <p className="eyebrow">Internal Demo</p>
            <h2>Phase 0 内部技术验证路径</h2>
            <p className="lede">
              这个页面只用于验证 founding team bootstrap、planning、research、production、
              briefing、decision 与 resume 的技术链路，不代表产品主工作台已经成立。
            </p>
          </div>
        </header>

        <Phase0DemoClient />
      </section>
    </main>
  );
}
