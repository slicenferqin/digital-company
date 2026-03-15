# 参与贡献

感谢关注 `Digital Company`。

这是一个还在早期收敛阶段的项目。当前最重要的不是“功能堆得多快”，而是把产品边界、核心对象和第一版落地路径做对。

## 当前最欢迎的贡献

### 1. 产品边界与定位反馈

欢迎帮助我们判断这些问题：

- 第一版是否足够收敛
- ICP 是否够清晰
- “持续团队” 和 “多 agent workflow” 的差异是否讲清楚
- 哪些能力属于第一版，哪些应该砍掉

### 2. UI / UX 反馈

尤其欢迎针对以下问题的反馈：

- BOSS 工作台首页该先回答什么问题
- 组织架构在首页应该占多大权重
- 简报、交付物、待决策事项如何降低认知负担

### 3. 技术架构与领域模型建议

当前重点包括：

- `Team / Cycle / Artifact / Briefing / Decision / Memory` 的领域建模
- 持续团队状态如何存储和恢复
- 审批节点如何做成系统对象
- 跨周期记忆如何拆分成结构化规则与经验记忆

### 4. 具体实现 PR

欢迎提交聚焦、可解释、边界清晰的 PR。

## 提 issue 前建议

优先使用对应模板：

- 产品反馈
- 体验 / UI 建议
- 架构讨论
- Bug 报告

如果你的问题本质上是在讨论“这个产品该不该做”，请尽量把背景、判断依据和取舍讲清楚，而不是只给结论。

## 提 PR 前建议

提交前请尽量保证：

- 改动范围聚焦
- 改动目标可解释
- 与当前产品定义一致
- 没有顺手修一堆不相干问题

## 本地开发

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

## 推荐先阅读

- 产品定义：[`docs/plans/2026-03-12-digital-company-product-note-v0.3.md`](docs/plans/2026-03-12-digital-company-product-note-v0.3.md)
- 技术方案：[`docs/plans/2026-03-12-digital-company-technical-design-v0.2.md`](docs/plans/2026-03-12-digital-company-technical-design-v0.2.md)
- 实施计划：[`docs/plans/2026-03-13-digital-company-phase0-implementation-plan.md`](docs/plans/2026-03-13-digital-company-phase0-implementation-plan.md)

## 讨论方式

这个项目欢迎强观点，但更欢迎带推理链的强观点。

比起“我觉得这个不对”，更有帮助的是：

- 你认为哪里不对
- 为什么不对
- 如果改，应该往哪边改
- 这个改动会带来什么副作用

## 当前阶段的共识

请在讨论时默认以下前提：

- 第一版对象不是泛化的数字公司平台
- 第一版对象是持续运转的数字内容增长团队
- 首页默认是老板工作台，不是 agent 控制台
- 交付物和简报是一等公民
- 组织架构是解释层，不是游戏层
