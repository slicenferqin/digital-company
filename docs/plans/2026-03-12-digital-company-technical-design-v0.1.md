# `Digital Company` 技术方案设计 v0.1

日期：2026-03-12  
状态：Draft v0.1  
范围：第一版 `数字内容增长团队` 产品

## 一、设计目标

这份技术方案要服务的不是“数字公司宇宙”，而是一个足够可落地的第一版：

- 用户接手一支持续运转的数字内容增长团队
- 团队按周期推进研究、写作、编辑、分发准备
- 老板主要通过简报、待拍板事项、交付物与复盘介入
- 系统需要跨周期保留团队状态、记忆和资产

这版设计优先解决：

- 持续团队状态
- 周期推进引擎
- 秘书长编译层
- 交付资产流水线
- 最小反馈闭环

这版设计明确不解决：

- 通用数字公司平台
- 开放世界模拟
- 复杂图谱记忆
- 完整多租户企业权限模型
- 全渠道自动发布

---

## 二、需求摘要

### 功能性需求

第一版系统必须支持：

- 创建一个团队实例，并绑定业务背景
- 自动生成 founding team
- 创建、推进和结束一个工作周期
- 在周期内生成任务、交付物和管理材料
- 在关键节点升级给老板审批
- 保留跨周期团队状态和历史资产
- 记录最小反馈信号，用于下一周期调整

### 非功能性需求

- 可恢复：长流程中断后可恢复
- 可解释：老板能理解为什么收到某个决策包
- 可控：审批前不会越权发布高风险内容
- 可追踪：资产、任务、决策都有状态和历史
- 可降本：模型调用成本可分层控制

### 约束

- 第一版优先单业务场景：内容增长
- 第一版优先单工作台：老板工作台
- 第一版默认有人类审批，不做完全自动闭环
- 第一版优先统一技术栈，减少系统复杂度

---

## 三、总体架构

### 推荐方案

第一版采用：

## `Next.js + LangGraph.js + PostgreSQL + Inngest`

理由：

- 已有 HTML 工作台原型，前端延续 Next.js 最自然
- LangGraph.js 已具备持久执行、memory/store 能力
- PostgreSQL 适合承接结构化状态与资产元数据
- Inngest 适合承接周期触发、异步执行和恢复编排

### 高层架构图

```text
┌──────────────────────────────────────────────────────────┐
│                   Boss Workbench (Next.js)              │
│  Overview / Briefing / Inbox / Artifacts / Team         │
└──────────────────────────┬───────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────┐
│                 Application API (Next.js Route Handlers)│
│  team / cycle / artifact / decision / feedback APIs     │
└───────────────┬───────────────────────┬──────────────────┘
                │                       │
                ▼                       ▼
┌──────────────────────────┐   ┌───────────────────────────┐
│  Workflow Runtime        │   │  Scheduler / Orchestrator │
│  LangGraph.js            │   │  Inngest                  │
│  - cycle graph           │   │  - cycle start            │
│  - briefing graph        │   │  - day tick               │
│  - review graph          │   │  - retries / resume       │
└───────────────┬──────────┘   └───────────────┬───────────┘
                │                              │
                └──────────────┬───────────────┘
                               ▼
┌──────────────────────────────────────────────────────────┐
│                   Persistence Layer                      │
│  PostgreSQL                                             │
│  - relational state                                     │
│  - checkpointer                                         │
│  - asset metadata                                       │
│  - decision history                                     │
└───────────────┬───────────────────────────┬──────────────┘
                │                           │
                ▼                           ▼
┌──────────────────────────┐   ┌───────────────────────────┐
│ Asset Store              │   │ Memory / Retrieval Layer  │
│ Blob / object storage    │   │ pgvector or external mem  │
│ drafts / briefs / reports│   │ brand, lessons, patterns  │
└──────────────────────────┘   └───────────────────────────┘
```

---

## 四、核心系统对象

第一版把系统建立在结构化对象上，而不是建立在对话消息上。

### Team

表示一支长期存在的数字团队。

关键字段：

- `id`
- `name`
- `business_name`
- `business_positioning`
- `brand_voice`
- `target_audience`
- `core_offer`
- `primary_channels`
- `status`

### Role

表示岗位模板。

关键字段：

- `id`
- `team_id`
- `name`
- `department`
- `responsibilities`
- `headcount_limit`
- `approval_scope`

### Member

表示岗位下的长期数字成员。

关键字段：

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

表示一个工作周期，默认按周建模。

关键字段：

- `id`
- `team_id`
- `cycle_type`
- `start_at`
- `end_at`
- `goal_summary`
- `priority_focus`
- `status`

### Project

表示周期中的一个目标单元。

关键字段：

- `id`
- `cycle_id`
- `type`
- `title`
- `goal`
- `priority`
- `owner_member_id`
- `status`

### Task

表示具体执行任务。

关键字段：

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

表示交付资产。

关键字段：

- `id`
- `project_id`
- `artifact_type`
- `title`
- `version`
- `status`
- `author_member_id`
- `reviewer_member_id`
- `storage_uri`

### Briefing

表示秘书长面向老板的编译材料。

关键字段：

- `id`
- `team_id`
- `cycle_id`
- `brief_type`
- `title`
- `summary`
- `status`
- `source_event_ids`

### Decision

表示老板拍板节点。

关键字段：

- `id`
- `team_id`
- `cycle_id`
- `decision_type`
- `requested_by_member_id`
- `recommended_option`
- `owner_response`
- `status`

### FeedbackSignal

表示最小反馈闭环对象。

关键字段：

- `id`
- `artifact_id`
- `signal_type`
- `signal_value`
- `source`
- `captured_at`

---

## 五、数据分层设计

### 1. 关系型状态层

用 PostgreSQL 保存：

- Team
- Role
- Member
- Cycle
- Project
- Task
- Artifact metadata
- Briefing metadata
- Decision
- FeedbackSignal

这是系统事实层，不能交给 LLM 自由推断。

### 2. 资产内容层

用对象存储或数据库 blob 保存：

- brief 内容
- 研究摘要正文
- 长文草稿
- 社媒文案
- 周报
- 会议纪要

这里的重点是版本化和可追溯。

### 3. 记忆层

第一版只做轻量、实用的长时记忆，但这里要明确区分两类不同性质的记忆。

#### 规则性记忆

这类记忆必须强结构化，不应依赖语义召回：

- 品牌约束
- 用户编辑偏好
- 禁止表达
- 固定渠道规则

建议：

- 直接存储在 Team / TeamConfig 等结构化对象里
- 每次 graph 启动时显式注入

#### 经验性记忆

这类记忆适合做检索增强：

- 高表现主题
- 常见返工点
- 已做过的关键判断
- 被证明有效的策略模式
- 负向约束记忆

建议：

- 存储为可检索文档片段
- 使用 `PostgreSQL + pgvector`
- 或外接 memory service

并建议为经验性记忆增加最小生命周期字段：

- `memory_type`
- `importance`
- `ttl`
- `direction`

其中：

- `memory_type` 用于区分主题经验、返工经验、策略经验
- `direction` 用于表达正向约束或负向约束

例如老板明确打回的一类表达方式，应写入为高权重的负向约束记忆，避免团队在后续周期重复犯同样的错误

这样做的原因是：

- 规则不能靠召回碰运气
- 经验可以容忍语义近似

### 4. 执行状态层

LangGraph checkpointer 负责：

- graph 执行状态
- node 进度
- 暂停与恢复
- 审批等待点

---

## 六、运行时架构

### 1. API 层

推荐直接使用 Next.js Route Handlers 作为第一版 API 层。

职责：

- 接收工作台请求
- 读写团队/周期/资产/决策状态
- 触发 workflow 运行
- 接收老板审批结果

### 2. Workflow Runtime

使用 LangGraph.js 承接 5 条核心 graph：

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
- 第一版应优先走 REST API 集成路线，避免被 Python SDK 生态绑定

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

第一版不建议自己写 cron + 自定义状态恢复系统。

### 4. 状态同步原则

关系型业务状态与 graph 执行状态并存时，必须明确单一事实来源。

第一版建议：

- 业务事实层以 PostgreSQL 为准
- graph 恢复前，先通过 `SyncStateNode` 拉取最新业务状态
- 再决定后续路由

这样可以避免：

- Postgres 中任务已变更
- 但 graph 仍按旧状态继续运行

---

## 七、关键流程设计

### 流程 1：首次创建团队

```text
用户填写业务画像
  -> 创建 Team
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
  -> 读取未完成任务
  -> 执行研究 / 写作 / 编辑图
  -> 更新 Artifact 版本
  -> 生成内部事件
  -> 若命中升级阈值，生成 Decision / Briefing
```

### 流程 4：老板审批

```text
老板打开 Inbox
  -> 查看秘书长整理的决策包
  -> approve / reject / revise
  -> 写回 Decision
  -> Workflow 从 checkpointer 恢复
  -> 继续执行后续任务
```

### 流程 5：周期结束

```text
收集本周期资产
  -> 收集采纳 / 发布 / 基础反馈
  -> 生成复盘
  -> 写入长期记忆
  -> 为下一周期 Planning Graph 提供输入
```

---

## 八、秘书长编译层设计

这是产品辨识度最高的系统之一。

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

- 阈值保存在结构化配置中
- 由产品或运营手动调整
- 不在 MVP 阶段交给 agent 自主学习

这样做是为了保证可解释性和可控性。

### 编译策略

秘书长层建议采用 Map-Reduce 式编译：

- 先由轻量模型对各任务增量日志做局部摘要
- 再由更强模型基于局部摘要生成老板可读简报与决策包

这样做的收益：

- 控制上下文窗口体积
- 降低成本
- 减少“丢在中间”的注意力问题

### 升级阈值示例

- 高优项目阻塞超过 N 小时
- 高价值稿件出现双版本分歧
- 预算 / token 消耗超阈值
- 关键资产连续返工

### 幂等性与去重

秘书长层必须支持幂等性，否则老板会被重复提醒淹没。

第一版建议：

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

## 九、最小反馈闭环设计

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

### 写回方式

FeedbackSignal 写回后，供下周期：

- 选题优先级调整
- 分发策略调整
- 内容风格调整
- 秘书长复盘摘要

### 成本可见性

第一版建议把成本作为内部系统一等信号，而不是隐藏实现细节。

最小实现即可：

- 每周期记录 token 消耗
- 每个 graph 记录大致模型成本
- 对老板展示一个可理解的“运营经费”指标

这样做的价值：

- 帮助团队理解数字团队的运营成本
- 为未来 usage-based pricing 奠定基础
- 帮助产品侧判断 unit economics

### 第一版暂不做

- 多平台深度自动拉数
- 自动归因模型
- 复杂增长分析仪表板

### Token Budget 粗估

下面的数字只作为 Phase 0 技术验证用的粗估，不作为定价承诺。

按一个团队一周一个周期粗估：

- Cycle Planning：`15k - 30k`
- Research：`40k - 100k`
- Production：`80k - 180k`
- Briefing / Review：`30k - 70k`
- 总计：`165k - 380k tokens / team / week`

这个粗估的意义不是追求准确，而是：

- 为 Spike 阶段建立成本感知
- 及早验证 unit economics
- 判断哪些步骤必须模型分层

---

## 十、关键技术决策

### ADR-001：第一版采用 TypeScript 统一栈

#### 决策

采用：

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

## 十一、失败模式与缓解

### 失败模式 1：Graph 中断后无法恢复

缓解：

- 所有长流程都必须启用 checkpointer
- 非确定性或副作用步骤必须封装

### 失败模式 2：团队记忆漂移

缓解：

- 把业务事实和团队状态放在结构化存储
- 语义记忆只做补充，不做事实来源

### 失败模式 3：审批过多导致系统变烦

缓解：

- 升级阈值配置化
- 秘书长层默认压缩

### 失败模式 4：成本失控

缓解：

- 模型分层
- 低风险步骤优先用便宜模型
- 高价值写作 / 编译 / 审核再使用高质量模型

### 失败模式 4.1：研究工具能力不足

缓解：

- 第一版优先对接标准 REST 搜索能力
- 在 Spike 阶段单独验证 Research Graph 的信息源质量
- 必要时把 Research Graph 独立成 Python 实现

### 失败模式 5：系统变成定时 workflow

缓解：

- 强制保留 Team / Cycle / Decision / Artifact / Feedback 这些一等对象
- 第二周期必须读取第一周期的结构化历史

---

## 十二、实现阶段建议

### Phase 0：Spike

先做 4 个 Spike：

- 周期驱动团队原型
- 秘书长编译层原型
- 资产流水线原型
- 最小反馈闭环原型

#### Spike 1 验收标准：周期驱动团队原型

- 能创建团队与首周期
- 能自动生成计划、任务和首批资产
- 第二次运行不会丢失团队状态
- `SyncStateNode` 能在恢复前读取最新业务状态

#### Spike 2 验收标准：秘书长编译层原型

- 能从内部事件生成 Daily Brief
- 能把需要老板拍板的事项提升成 Decision
- 同一事件不会在一个周期内重复提醒
- 长日志输入下仍能稳定生成老板可读摘要

#### Spike 3 验收标准：资产流水线原型

- 资产具备 `draft -> review -> approved / revise` 状态
- 每次修改可追踪版本
- 老板审批后可恢复 workflow
- 研究与生产可分别计量成本与失败率

#### Spike 4 验收标准：最小反馈闭环原型

- 能记录资产是否通过、是否采用、是否发布
- 下周期规划能读取上一周期反馈
- 第二周期输出能体现至少一个反馈信号的影响
- 能输出一份最小成本可见性摘要

### Phase 1：MVP 核心闭环

交付：

- 创建团队
- 启动周期
- 研究 -> 草稿 -> 审核 -> 简报
- 老板审批
- 资产归档

### Phase 2：持续性增强

交付：

- 跨周期记忆
- 同岗多人竞争
- 基础绩效差异
- 候选人补强

### Phase 3：扩展能力

交付：

- 更强反馈闭环
- 更多渠道集成
- 更复杂记忆层

---

## 十三、第一阶段工程拆分建议

### 服务边界

第一版不拆微服务。

建议：

- 一个 Next.js app
- 一个 Postgres
- 一个 Inngest worker
- 一个 LangGraph runtime 层

### 代码边界

建议目录抽象：

```text
app/
lib/
  domain/
    team/
    cycle/
    artifact/
    decision/
    briefing/
  workflows/
    cycle-planning/
    execution/
    briefing/
    review/
  memory/
  scheduling/
  db/
```

### 为什么不拆服务

- 第一版复杂度来自状态建模，不来自系统吞吐
- 太早拆服务只会增加协调成本

---

## 十四、结论

这版技术方案的核心判断是：

## `第一版应该被设计成一个状态化团队系统，而不是一个多 agent workflow 皮肤。`

如果只用一句话总结架构方向：

## `用结构化状态承接团队，用 LangGraph 承接执行图，用 Inngest 承接周期调度，用 Postgres 承接事实层与记忆底座。`

这已经足够进入下一步：详细技术设计分解或 Spike 任务设计。
