# `Digital Company` 技术方案设计 v0.2

日期：2026-03-12  
状态：Integrated Draft  
范围：第一版 `数字内容增长团队`

## 一、目标

这份技术方案服务的是一个足够可落地的第一版：

- 用户接手一支持续运转的数字内容增长团队
- 团队按周期推进研究、写作、编辑、分发准备
- 老板主要通过简报、待拍板事项、交付物与复盘介入
- 系统需要跨周期保留团队状态、记忆和资产

第一版优先解决：

- 持续团队状态
- 周期推进引擎
- 秘书长编译层
- 交付资产流水线
- 最小反馈闭环
- 成本与可观测性

第一版明确不解决：

- 通用数字公司平台
- 开放世界模拟
- 复杂图谱记忆
- 完整多租户企业权限模型
- 全渠道自动发布

---

## 二、核心设计原则

### 原则 1：结构化状态优先

系统事实层必须落在结构化对象里，而不是落在对话消息里。

### 原则 2：Graph 是执行器，不是真相来源

业务事实以 PostgreSQL 为准。  
LangGraph 负责流程推进、暂停和恢复，不负责定义业务真相。

### 原则 3：审批是系统对象，不是 UI 按钮

所有老板拍板节点都必须可恢复、可追踪、可解释。

### 原则 4：资产是一等对象

Artifact 不应是聊天副产物，而要有版本、审核、状态和复盘入口。

### 原则 5：第一版追求有用记忆，不追求重型记忆

先把品牌约束、经验性反馈和跨周期上下文做扎实，再考虑知识图谱或更复杂记忆层。

### 原则 6：调度层和执行层职责分离

- Inngest 负责何时触发、重试和外层异步编排
- LangGraph 负责单个业务流程内部如何推进、暂停和恢复

---

## 三、推荐技术栈

第一版推荐：

## `Next.js + LangGraph.js + PostgreSQL + Inngest`

### 理由

- 已有老板工作台原型，前端延续 Next.js 最自然
- LangGraph.js 已具备 durable execution、checkpointer、store 能力
- PostgreSQL 适合承接结构化状态与资产元数据
- Inngest 适合承接周期触发、异步任务、重试和恢复编排

### 技术取舍

#### 为什么不是一开始就 Python 分层

- 第一版优先统一栈，降低实现复杂度
- 现阶段痛点不是研究生态不够强，而是系统对象和流程边界先成立

#### 什么时候考虑拆出 Python 服务

如果 Phase 0 证明以下问题成立，再拆：

- 研究员信息源质量明显不足
- JS 侧集成关键研究工具受限
- Research Graph 需要更重的检索或图谱能力

---

## 四、高层架构

```text
┌──────────────────────────────────────────────────────────┐
│                   Boss Workbench (Next.js)              │
│  Overview / Briefing / Inbox / Artifacts / Team         │
└──────────────────────────┬───────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────┐
│             Application API (Route Handlers)            │
│  team / cycle / artifact / decision / feedback APIs     │
└───────────────┬───────────────────────┬──────────────────┘
                │                       │
                ▼                       ▼
┌──────────────────────────┐   ┌───────────────────────────┐
│  Workflow Runtime        │   │  Scheduler / Orchestrator │
│  LangGraph.js            │   │  Inngest                  │
│  planning / research     │   │  cycle start / day tick   │
│  production / briefing   │   │  retry / resume / delay   │
│  review-feedback         │   │                           │
└───────────────┬──────────┘   └───────────────┬───────────┘
                │                              │
                └──────────────┬───────────────┘
                               ▼
┌──────────────────────────────────────────────────────────┐
│                 PostgreSQL (事实层 + 状态层)            │
│ team / role / member / cycle / task / artifact / review │
│ decision / escalation policy / feedback / memory meta   │
└───────────────┬───────────────────────────┬──────────────┘
                │                           │
                ▼                           ▼
┌──────────────────────────┐   ┌───────────────────────────┐
│ Asset Store              │   │ Retrieval / Memory Layer  │
│ drafts / briefs / reports│   │ pgvector / memory service │
└──────────────────────────┘   └───────────────────────────┘
```

---

## 五、核心系统对象

### Team

长期存在的数字团队。

字段建议：

- `id`
- `name`
- `business_name`
- `business_positioning`
- `brand_voice`
- `target_audience`
- `core_offer`
- `primary_channels`
- `status`

### TeamConfig

承接规则性配置与固定约束。

字段建议：

- `team_id`
- `approval_mode`
- `brand_rules`
- `forbidden_patterns`
- `channel_rules`
- `cost_budget_per_cycle`

### Role

岗位模板。

字段建议：

- `id`
- `team_id`
- `name`
- `department`
- `responsibilities`
- `headcount_limit`
- `approval_scope`

### Member

岗位下的长期数字成员。

字段建议：

- `id`
- `team_id`
- `role_id`
- `name`
- `persona_summary`
- `strengths`
- `weaknesses`
- `specialty_tags`
- `current_load`
- `status`

### Cycle

默认按周建模。

字段建议：

- `id`
- `team_id`
- `cycle_type`
- `start_at`
- `end_at`
- `goal_summary`
- `priority_focus`
- `status`

### Project

周期中的目标单元。

字段建议：

- `id`
- `cycle_id`
- `type`
- `title`
- `goal`
- `priority`
- `owner_member_id`
- `status`

### Task

具体执行任务。

字段建议：

- `id`
- `project_id`
- `assigned_member_id`
- `task_type`
- `title`
- `input_context`
- `status`
- `blocked_reason`
- `requires_owner_approval`

### Artifact

交付资产。

字段建议：

- `id`
- `project_id`
- `artifact_type`
- `title`
- `version`
- `status`
- `author_member_id`
- `reviewer_member_id`
- `storage_uri`

### ArtifactReview

显式记录审核，不把审核埋进 Artifact 状态里。

字段建议：

- `id`
- `artifact_id`
- `review_type`
- `reviewer_type`
- `reviewer_id`
- `verdict`
- `comments`
- `blocking_issues`
- `brand_violations`
- `fact_risk_flags`
- `created_at`

### Briefing

秘书长面向老板的编译材料。

字段建议：

- `id`
- `team_id`
- `cycle_id`
- `brief_type`
- `title`
- `summary`
- `dedupe_key`
- `status`
- `source_event_ids`

### Decision

老板拍板节点。

字段建议：

- `id`
- `team_id`
- `cycle_id`
- `decision_type`
- `requested_by_member_id`
- `recommended_option`
- `owner_response`
- `reason_code`
- `status`

### EscalationPolicy

显式建模升级策略。

字段建议：

- `id`
- `team_id`
- `scope_type`
- `artifact_type`
- `project_priority`
- `channel`
- `threshold_config`
- `enabled`

### FeedbackSignal

最小反馈闭环对象。

字段建议：

- `id`
- `artifact_id`
- `signal_type`
- `signal_value`
- `source`
- `captured_at`

### MemoryEntry

经验性记忆对象。

字段建议：

- `id`
- `team_id`
- `memory_type`
- `direction`
- `importance`
- `ttl`
- `content`
- `source_ref`
- `status`

### PreferenceProfile

老板偏好与团队学到的稳定编辑倾向。

字段建议：

- `team_id`
- `owner_preferences`
- `editing_tendencies`
- `approved_patterns`
- `forbidden_patterns`

---

## 六、数据分层

### 1. 关系型事实层

由 PostgreSQL 保存：

- Team
- TeamConfig
- Role
- Member
- Cycle
- Project
- Task
- Artifact metadata
- ArtifactReview
- Briefing metadata
- Decision
- EscalationPolicy
- FeedbackSignal

这是系统事实层，不能交给 LLM 自由推断。

### 2. 资产内容层

用对象存储或数据库 blob 保存：

- brief 正文
- 研究摘要
- 长文草稿
- 社媒文案
- 周报
- 会议纪要

重点是版本化和可追溯。

### 3. 记忆层

第一版只做轻量、实用的长时记忆，但要明确区分两类：

#### 规则性记忆

必须强结构化，不依赖语义召回：

- 品牌约束
- 用户编辑偏好
- 禁止表达
- 固定渠道规则

建议：

- 存储在 Team / TeamConfig / PreferenceProfile
- 每次 graph 启动时显式注入

#### 经验性记忆

适合做检索增强：

- 高表现主题
- 常见返工点
- 已做过的关键判断
- 被证明有效的策略模式
- 负向约束记忆

建议：

- 存为 MemoryEntry 文档片段
- 使用 `PostgreSQL + pgvector`
- 或外接 memory service

其中建议最少增加字段：

- `memory_type`
- `importance`
- `ttl`
- `direction`

老板明确打回的一类表达方式，应写入为高权重的负向约束记忆，避免团队重复犯同样的错误。

### 4. 执行状态层

LangGraph checkpointer 负责：

- graph 执行状态
- node 进度
- 暂停与恢复
- 审批等待点

---

## 七、运行时架构

### 1. API 层

推荐直接使用 Next.js Route Handlers。

职责：

- 接收工作台请求
- 读写团队/周期/资产/决策状态
- 触发 workflow 运行
- 接收老板审批结果

### 2. Workflow Runtime

使用 LangGraph.js 承接 5 条核心 graph。

所有需要老板确认的节点，默认采用 LangGraph 原生 `interrupt` 模式暂停执行，再由前端审批后恢复，而不是重新跑图。

#### Graph A：Cycle Planning Graph

职责：

- 读取业务背景
- 生成首周期 / 新周期计划
- 拆成项目与任务
- 输出初始简报

#### Graph B：Research Graph

职责：

- 调用外部信息源
- 汇总用户问题、关键词、竞品线索
- 生成研究摘要和 brief 输入

说明：

- 研究员能力高度依赖外部信息获取
- 第一版优先走 REST API 集成路线

#### Graph C：Production Graph

职责：

- 推进写作、编辑、分发准备
- 更新任务状态
- 产出资产

这样拆分的原因是：

- Research 和 Production 的失败模式不同
- 模型成本结构不同
- 人工介入点不同
- 独立调试和追踪更容易

#### Graph D：Chief of Staff Briefing Graph

职责：

- 汇总内部事件
- 输出今日简报
- 生成会议纪要
- 构造决策包

#### Graph E：Review & Feedback Graph

职责：

- 接收老板审批
- 推进通过 / 打回 / 重写
- 记录采纳与反馈信号
- 为下周期复盘生成输入

### 3. Scheduler

使用 Inngest 负责：

- 周期开始 trigger
- 每日 tick
- 延迟任务
- 重试 / 死信
- 人工审批后的恢复触发

### 4. 单一事实来源原则

关系型业务状态与 graph 执行状态并存时，必须明确单一事实来源。

建议：

- 业务事实层以 PostgreSQL 为准
- graph 恢复前，先通过 `SyncStateNode` 拉取最新业务状态
- 再决定后续路由

这样可以避免 graph 按旧状态继续运行。

### 5. Inngest 与 LangGraph 的职责边界

- Inngest 负责“什么时候触发、失败后怎么重新排队、外层异步任务协调”
- LangGraph 负责“单个业务流程内部如何推进、暂停、恢复、等待人类输入”

不要让两者同时充当同一层业务真相来源。

### 6. 请求生命周期解耦

Next.js 只做应用壳和后台入口。  
所有重任务、graph 启动、审阅流水线、索引更新都应事件化或异步化，不能绑在请求生命周期上。

---

## 八、关键流程

### 流程 1：首次创建团队

```text
用户填写业务画像或走逆向工程式启动
  -> 创建 Team / TeamConfig
  -> 生成 founding roles
  -> 生成 founding members
  -> 启动 Cycle Planning Graph
  -> 生成首周期计划
  -> 生成老板首份简报
```

### 流程 2：周期开始

```text
Scheduler 触发周期开始
  -> 创建 Cycle
  -> 读取历史反馈与记忆
  -> 生成本周期目标草案
  -> 需要老板确认则进入 Decision
  -> 确认后创建 Project / Task
```

### 流程 3：日常推进

```text
每日 tick
  -> SyncStateNode 拉取最新业务事实
  -> 执行 Research Graph
  -> 执行 Production Graph
  -> 更新 Artifact 版本
  -> 生成内部事件
  -> 命中升级阈值则生成 Briefing / Decision
```

### 流程 4：老板审批

```text
老板打开 Inbox
  -> 查看秘书长整理的决策包
  -> approve / reject / revise
  -> 写回 Decision
  -> Workflow 从 interrupt / checkpointer 恢复
  -> 继续执行后续任务
```

### 流程 5：周期结束

```text
收集本周期资产
  -> 收集采纳 / 发布 / 反馈
  -> 生成复盘
  -> 写入长期记忆
  -> 为下一周期 Planning Graph 提供输入
```

---

## 九、秘书长编译层设计

### 输入

- 任务状态变化
- 资产版本变化
- 风险事件
- 会议事件
- 绩效和负载变化

### 输出

- Daily Brief
- Meeting Minutes
- Decision Memo
- Risk Escalation
- Weekly Review

### 设计原则

- 不直接暴露原始 agent 对话
- 所有输出都要有来源对象
- 所有升级都要可解释
- 默认压缩信息，不默认展开过程
- 控制上下文体积，避免秘书长层被长日志淹没

### 升级阈值配置

第一版不做自适应学习阈值，先采用显式配置：

- 阈值保存在 EscalationPolicy
- 由产品或运营手动调整
- 不在 MVP 阶段交给 agent 自主学习

### 编译策略

秘书长层建议采用 `Map-Reduce` 式编译：

- 先由轻量模型对各任务增量日志做局部摘要
- 再由更强模型基于局部摘要生成老板可读简报与决策包

### 幂等性与去重

秘书长层必须支持幂等性，否则老板会被重复提醒淹没。

建议：

- 每个 Briefing 绑定 `source_event_ids`
- 生成时计算 `dedupe_key`
- 同一周期内，同一事件组合只允许形成一条有效 Briefing

### Briefing 到 Decision 的提升逻辑

Briefing 和 Decision 在用户侧看起来应是同一条收件箱对象的不同阶段。

建议：

- Briefing 先作为信息性对象生成
- 当命中升级阈值或需要老板拍板时，提升为 Decision
- Decision 引用其源 Briefing，而不是重新生成一套文案

---

## 十、最小反馈闭环设计

第一版不追求完整增长分析平台，但必须建立最小反馈回流。

### 第一版最小反馈信号

- 资产是否被老板通过
- 资产是否被采用
- 资产是否进入发布
- 资产是否被复用
- 基础表现标签
  - 高反馈
  - 普通反馈
  - 低反馈

### 补充反馈类型

第一版建议补两类更有学习价值的反馈：

#### 编辑行为反馈

- 老板删了哪些段落
- 改了标题还是结构
- 哪类表达反复被改写

#### 决策理由反馈

建议引入结构化 reason code：

- `off-brand`
- `too-generic`
- `weak-angle`
- `fact-risk`
- `wrong-audience`
- `too-long`
- `low-novelty`

### 写回方式

FeedbackSignal 写回后，供下周期：

- 选题优先级调整
- 分发策略调整
- 内容风格调整
- 秘书长复盘摘要

### 成本可见性

第一版建议把成本作为内部系统一等信号。

最小实现：

- 每周期记录 token 消耗
- 每个 graph 记录大致模型成本
- 对老板展示一个可理解的“运营经费”指标

### 第一版暂不做

- 多平台深度自动拉数
- 自动归因模型
- 复杂增长分析仪表板

### Token Budget 粗估

仅作为 Phase 0 技术验证用的粗估：

- Cycle Planning：`15k - 30k`
- Research：`40k - 100k`
- Production：`80k - 180k`
- Briefing / Review：`30k - 70k`
- 总计：`165k - 380k tokens / team / week`

---

## 十一、关键技术决策

### ADR-001：第一版采用 TypeScript 统一栈

#### 决策

- Next.js
- LangGraph.js
- PostgreSQL
- Inngest

#### 理由

- 和现有 UI 原型连续
- 降低系统复杂度
- 足够支撑 MVP

#### 代价

- Python 生态里某些研究能力接入稍晚

#### 补充策略

为避免 JS 侧研究工具集成受限，第一版研究员 graph 优先接：

- Tavily REST API
- Exa REST API
- Perplexity API

如果 Phase 0 发现研究质量明显受限，再考虑把 Research Graph 独立为 Python 服务。

### ADR-002：团队状态采用结构化模型，不采用纯对话模型

#### 决策

核心对象必须入库建模，而不是只存在于消息流。

#### 理由

- 任务、审批、资产和周期都需要可追踪
- 这是产品从 workflow 升级为团队系统的关键

### ADR-003：记忆采用分层策略，不直接上知识图谱

#### 决策

MVP 采用：

- 关系型状态
- 文档资产
- 轻量语义检索

不直接上重型 graph memory。

#### 理由

- 降低 MVP 复杂度
- 先验证“有用记忆”而不是“最先进记忆”

### ADR-004：老板审批采用显式 HITL 恢复点

#### 决策

所有需要老板拍板的节点，都应通过 LangGraph `interrupt` 暂停 graph，并等待决策写回。

#### 理由

- 降低错误自动化风险
- 让审批成为一等系统对象
- 避免审批后重新执行整段 graph，降低 token 浪费与状态偏移

---

## 十二、失败模式与缓解

### 失败模式 1：Graph 中断后无法恢复

缓解：

- 所有长流程都必须启用 checkpointer
- 非确定性或副作用步骤必须封装

### 失败模式 2：团队记忆漂移

缓解：

- 把业务事实和团队状态放在结构化存储
- 语义记忆只做补充，不做事实来源
- 对经验性记忆设置时间窗、置信度和覆盖条件

### 失败模式 3：审批过多导致系统变烦

缓解：

- 升级阈值配置化
- 秘书长层默认压缩
- 介入点分层设计

### 失败模式 4：成本失控

缓解：

- 模型分层
- 低风险步骤优先用便宜模型
- 高价值写作 / 编译 / 审核再使用高质量模型
- 预算耗尽时定义降级策略

### 失败模式 4.1：研究工具能力不足

缓解：

- 第一版优先对接标准 REST 搜索能力
- 在 Spike 阶段单独验证 Research Graph 信息源质量
- 必要时把 Research Graph 独立成 Python 实现

### 失败模式 5：系统变成定时 workflow

缓解：

- 强制保留 Team / Cycle / Decision / Artifact / Feedback 这些一等对象
- 第二周期必须读取第一周期的结构化历史

### 失败模式 6：状态一致性撕裂

缓解：

- 定义单一事实来源为 PostgreSQL
- 对带副作用节点要求幂等
- 明确状态提交顺序

Artifact 相关建议顺序：

1. 创建 artifact version draft record  
2. 写对象存储  
3. 成功后提交 DB version status  
4. 再发布 domain event 触发 briefing / indexing

---

## 十三、可观测性设计

Phase 0 / Phase 1 就应定义最小观测面板：

- cycle lead time
- artifact pass rate
- owner intervention rate
- average revision rounds
- escalation frequency
- memory retrieval hit quality
- model cost by workflow
- stuck task count
- workflow recovery failures

没有这些指标，后续评审会一直停留在主观感觉层。

---

## 十四、Phase 0 Spike 设计

### Spike 1：周期驱动团队原型

目标：

- 创建团队与首周期
- 自动生成计划、任务和首批资产
- 证明第二次运行不会丢失团队状态

验收标准：

- 能创建团队与首周期
- 能自动生成计划、任务和首批资产
- 第二次运行不会丢失团队状态
- `SyncStateNode` 能在恢复前读取最新业务状态

### Spike 2：秘书长编译层原型

目标：

- 从内部事件生成 Daily Brief
- 生成待拍板事项
- 验证简报去重和可解释性

验收标准：

- 能生成 Daily Brief
- 能把需要老板拍板的事项提升成 Decision
- 同一事件不会在一个周期内重复提醒
- 长日志输入下仍能稳定生成老板可读摘要

### Spike 3：资产流水线原型

目标：

- 跑通 research -> draft -> review -> revise / approve

验收标准：

- 资产具备 `draft -> review -> approved / revise` 状态
- 每次修改可追踪版本
- 老板审批后可恢复 workflow
- 研究与生产可分别计量成本与失败率

### Spike 4：最小反馈闭环原型

目标：

- 记录采纳 / 发布 / 复用 / reason code
- 让下周期规划真正读到这些反馈

验收标准：

- 能记录资产是否通过、是否采用、是否发布
- 下周期规划能读取上一周期反馈
- 第二周期输出能体现至少一个反馈信号的影响
- 能输出一份最小成本可见性摘要

---

## 十五、第一阶段工程边界

### 服务边界

第一版不拆微服务。

建议：

- 一个 Next.js app
- 一个 Postgres
- 一个 Inngest worker
- 一个 LangGraph runtime 层

### 代码边界

建议目录：

```text
app/
lib/
  domain/
    team/
    cycle/
    artifact/
    review/
    decision/
    briefing/
    memory/
  workflows/
    cycle-planning/
    research/
    production/
    briefing/
    review-feedback/
  scheduling/
  db/
```

---

## 十六、结论

这版技术方案的核心判断是：

## `第一版应该被设计成一个状态化团队系统，而不是一个多 agent workflow 皮肤。`

如果只用一句话总结架构方向：

## `用结构化状态承接团队，用 LangGraph 承接执行图，用 Inngest 承接周期调度，用 Postgres 承接事实层与记忆底座。`

它已经足够作为下一步 Spike 实施和数据库 schema 设计的母文档。
