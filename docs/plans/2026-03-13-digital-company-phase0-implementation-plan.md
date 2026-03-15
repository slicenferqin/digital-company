# Digital Company Phase 0 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a Phase 0 technical validation slice for a persistent `数字内容增长团队`, covering team creation, cycle planning, research/production flow, secretary briefing, owner approval, and minimal feedback carry-over.

**Architecture:** Start with a single Next.js application using `LangGraph.js` for workflow graphs, `PostgreSQL` for structured state, and `Inngest` for scheduling. Keep business state in PostgreSQL, keep workflow execution state in LangGraph checkpointers, and treat artifacts/decisions/briefings as first-class domain objects.

**Tech Stack:** Next.js, TypeScript, PostgreSQL, Drizzle ORM, LangGraph.js, Inngest, Zod, Vitest, Playwright

---

### Task 1: Scaffold the application shell

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `app/layout.tsx`
- Create: `app/page.tsx`
- Create: `app/globals.css`
- Create: `lib/config/env.ts`
- Create: `.env.example`

**Step 1: Initialize the app shell**

Create a minimal Next.js app with TypeScript and app router.

**Step 2: Add core dependencies**

Add:

- `next`
- `react`
- `react-dom`
- `zod`
- `drizzle-orm`
- `postgres`
- `@langchain/langgraph`
- `inngest`
- `vitest`
- `playwright`

**Step 3: Add environment parsing**

Create `lib/config/env.ts` to validate required env vars:

- `DATABASE_URL`
- `INNGEST_EVENT_KEY`
- `INNGEST_SIGNING_KEY`
- `OPENAI_API_KEY` or equivalent model key

**Step 4: Add a minimal home page**

The root page only needs to confirm the app boots.

**Step 5: Verify boot**

Run:

```bash
pnpm install
pnpm dev
```

Expected: homepage loads without runtime errors.

---

### Task 2: Add database bootstrap and schema foundation

**Files:**
- Create: `drizzle.config.ts`
- Create: `lib/db/client.ts`
- Create: `lib/db/schema/team.ts`
- Create: `lib/db/schema/cycle.ts`
- Create: `lib/db/schema/artifact.ts`
- Create: `lib/db/schema/decision.ts`
- Create: `lib/db/schema/briefing.ts`
- Create: `lib/db/schema/memory.ts`
- Create: `lib/db/schema/index.ts`
- Create: `drizzle/0001_initial.sql`

**Step 1: Create the DB client**

Add a single PostgreSQL client and export Drizzle bindings.

**Step 2: Define Phase 0 core tables**

Include at minimum:

- `teams`
- `team_configs`
- `roles`
- `members`
- `cycles`
- `projects`
- `tasks`
- `artifacts`
- `artifact_reviews`
- `briefings`
- `decisions`
- `escalation_policies`
- `feedback_signals`
- `memory_entries`
- `preference_profiles`

**Step 3: Encode enums explicitly**

Use enums for:

- cycle status
- task status
- artifact status
- decision status
- briefing type
- memory type

**Step 4: Generate initial migration**

Run:

```bash
pnpm drizzle-kit generate
```

Expected: initial migration is created cleanly.

**Step 5: Smoke-test schema import**

Run:

```bash
pnpm vitest
```

Expected: the schema imports without DB client crashes.

---

### Task 3: Create domain modules and repository layer

**Files:**
- Create: `lib/domain/team/types.ts`
- Create: `lib/domain/team/repository.ts`
- Create: `lib/domain/cycle/types.ts`
- Create: `lib/domain/cycle/repository.ts`
- Create: `lib/domain/artifact/types.ts`
- Create: `lib/domain/artifact/repository.ts`
- Create: `lib/domain/decision/types.ts`
- Create: `lib/domain/decision/repository.ts`
- Create: `lib/domain/briefing/types.ts`
- Create: `lib/domain/briefing/repository.ts`
- Create: `lib/domain/memory/types.ts`
- Create: `lib/domain/memory/repository.ts`

**Step 1: Define strict TypeScript types**

Do not couple domain types directly to UI or LangGraph types.

**Step 2: Add repository functions**

Cover the minimum CRUD needed for Phase 0:

- create team
- create cycle
- create artifact draft
- create/update decision
- create briefing
- write feedback signal
- fetch memory inputs for planning

**Step 3: Keep domain APIs boring**

This layer should be deterministic and testable. No LLM calls here.

**Step 4: Add unit tests for repositories**

Create:

- `tests/domain/team.repository.test.ts`
- `tests/domain/cycle.repository.test.ts`
- `tests/domain/artifact.repository.test.ts`

Run:

```bash
pnpm vitest tests/domain
```

Expected: core repository functions pass.

---

### Task 4: Implement team bootstrap and cold-start ingestion

**Files:**
- Create: `lib/services/team-bootstrap.ts`
- Create: `lib/services/business-profile.ts`
- Create: `app/api/teams/route.ts`
- Create: `app/api/teams/bootstrap/route.ts`
- Create: `tests/services/team-bootstrap.test.ts`

**Step 1: Define two creation modes**

Support:

- manual profile input
- reverse-engineered profile input

For Phase 0, reverse-engineering can be mocked or simplified into a parser input contract.

**Step 2: Create founding roles and members**

Generate the fixed initial team:

- GM
- Chief of Staff
- strategist
- researchers
- writers
- editors
- distribution operator

**Step 3: Persist bootstrap results**

Write team, config, roles, and members into PostgreSQL.

**Step 4: Expose an API endpoint**

`POST /api/teams/bootstrap` should return created team + founding members.

**Step 5: Verify**

Run:

```bash
pnpm vitest tests/services/team-bootstrap.test.ts
```

Expected: a stable team instance is created.

---

### Task 5: Implement cycle planning graph

**Files:**
- Create: `lib/workflows/cycle-planning/state.ts`
- Create: `lib/workflows/cycle-planning/graph.ts`
- Create: `lib/workflows/cycle-planning/nodes/load-team-context.ts`
- Create: `lib/workflows/cycle-planning/nodes/load-memory-inputs.ts`
- Create: `lib/workflows/cycle-planning/nodes/generate-cycle-plan.ts`
- Create: `lib/workflows/cycle-planning/nodes/create-projects-and-tasks.ts`
- Create: `tests/workflows/cycle-planning.graph.test.ts`

**Step 1: Define graph state**

Include:

- team id
- cycle draft
- memory inputs
- projects
- tasks
- briefing summary

**Step 2: Keep the first version deterministic where possible**

Only the planning generation node should call an LLM.

**Step 3: Persist structured planning output**

The graph should create:

- cycle record
- project records
- task records

**Step 4: Add a planning test harness**

Test that a planning run writes the correct objects even if generation is mocked.

**Step 5: Verify**

Run:

```bash
pnpm vitest tests/workflows/cycle-planning.graph.test.ts
```

Expected: planning graph produces a cycle plus tasks.

---

### Task 6: Implement research graph with external source abstraction

**Files:**
- Create: `lib/workflows/research/state.ts`
- Create: `lib/workflows/research/graph.ts`
- Create: `lib/workflows/research/providers/base.ts`
- Create: `lib/workflows/research/providers/tavily.ts`
- Create: `lib/workflows/research/providers/exa.ts`
- Create: `lib/workflows/research/nodes/collect-sources.ts`
- Create: `lib/workflows/research/nodes/summarize-findings.ts`
- Create: `tests/workflows/research.graph.test.ts`

**Step 1: Add a provider abstraction**

The graph should not know whether the source is Tavily, Exa, or a stub.

**Step 2: Implement one real provider and one fake provider**

This keeps Phase 0 testable without depending on live APIs.

**Step 3: Produce a structured research artifact**

The output should be saved as:

- research summary artifact
- source list metadata

**Step 4: Track cost at node granularity**

Store rough token or request cost for the research run.

**Step 5: Verify**

Run:

```bash
pnpm vitest tests/workflows/research.graph.test.ts
```

Expected: the graph emits a usable research summary and metadata.

---

### Task 7: Implement production graph and artifact pipeline

**Files:**
- Create: `lib/workflows/production/state.ts`
- Create: `lib/workflows/production/graph.ts`
- Create: `lib/workflows/production/nodes/create-draft.ts`
- Create: `lib/workflows/production/nodes/review-draft.ts`
- Create: `lib/workflows/production/nodes/version-artifact.ts`
- Create: `lib/services/artifact-versioning.ts`
- Create: `tests/workflows/production.graph.test.ts`

**Step 1: Model the pipeline explicitly**

Phase 0 only needs:

- draft
- review
- revise
- approved

**Step 2: Store versions explicitly**

Every draft/revision must create a traceable version.

**Step 3: Add review output structure**

The review node must emit:

- verdict
- blocking issues
- comments

**Step 4: Wire artifact review persistence**

Persist `ArtifactReview` records separately from `Artifact`.

**Step 5: Verify**

Run:

```bash
pnpm vitest tests/workflows/production.graph.test.ts
```

Expected: artifact status and versions progress correctly.

---

### Task 8: Implement Chief of Staff briefing compiler

**Files:**
- Create: `lib/workflows/briefing/state.ts`
- Create: `lib/workflows/briefing/graph.ts`
- Create: `lib/workflows/briefing/nodes/map-task-events.ts`
- Create: `lib/workflows/briefing/nodes/reduce-briefing.ts`
- Create: `lib/services/briefing-dedupe.ts`
- Create: `tests/workflows/briefing.graph.test.ts`

**Step 1: Define the raw input event format**

Events should be typed, not opaque strings.

**Step 2: Implement map-reduce compilation**

- map: summarize per task or event cluster
- reduce: compile owner-facing briefing

**Step 3: Add dedupe logic**

Use:

- `source_event_ids`
- `dedupe_key`

to prevent duplicate briefings in the same cycle.

**Step 4: Add escalation promotion**

When a briefing crosses an escalation threshold, create a linked `Decision`.

**Step 5: Verify**

Run:

```bash
pnpm vitest tests/workflows/briefing.graph.test.ts
```

Expected: briefing generation is idempotent and promotion works.

---

### Task 9: Implement HITL approval and LangGraph interrupt recovery

**Files:**
- Create: `lib/workflows/review-feedback/state.ts`
- Create: `lib/workflows/review-feedback/graph.ts`
- Create: `lib/workflows/review-feedback/nodes/interrupt-for-owner.ts`
- Create: `app/api/decisions/[id]/approve/route.ts`
- Create: `app/api/decisions/[id]/reject/route.ts`
- Create: `app/api/decisions/[id]/revise/route.ts`
- Create: `tests/workflows/review-feedback.graph.test.ts`

**Step 1: Pause at explicit owner checkpoints**

Use LangGraph interrupt instead of rerunning the graph.

**Step 2: Restore from decision input**

The API should write the owner choice and resume the workflow.

**Step 3: Add `SyncStateNode`**

Before recovery continues, reload the latest structured business state from PostgreSQL.

**Step 4: Verify**

Run:

```bash
pnpm vitest tests/workflows/review-feedback.graph.test.ts
```

Expected: approval resumes from checkpoint without replaying completed steps.

---

### Task 10: Implement scheduling and day-tick orchestration

**Files:**
- Create: `lib/scheduling/inngest.ts`
- Create: `lib/scheduling/functions/cycle-start.ts`
- Create: `lib/scheduling/functions/day-tick.ts`
- Create: `lib/scheduling/functions/resume-after-decision.ts`
- Create: `tests/scheduling/day-tick.test.ts`

**Step 1: Define trigger ownership**

Inngest only controls:

- cycle start
- day tick
- delayed retries
- post-approval resume triggers

**Step 2: Keep business truth out of Inngest steps**

Workflow state lives in LangGraph + PostgreSQL, not in scheduler-only state.

**Step 3: Verify**

Run:

```bash
pnpm vitest tests/scheduling/day-tick.test.ts
```

Expected: scheduled runs enqueue the correct workflow entrypoints.

---

### Task 11: Implement minimal feedback loop and preference learning

**Files:**
- Create: `lib/services/feedback-capture.ts`
- Create: `lib/services/memory-writeback.ts`
- Create: `app/api/artifacts/[id]/feedback/route.ts`
- Create: `tests/services/feedback-capture.test.ts`

**Step 1: Capture feedback types**

Support:

- approved
- adopted
- published
- reused
- reason code
- edit behavior hints

**Step 2: Separate stable preferences from temporary lessons**

- update `PreferenceProfile` for repeated owner preferences
- create `MemoryEntry` for cycle-specific learnings

**Step 3: Feed the next cycle**

Ensure planning can read:

- last-cycle lessons
- owner preference profile

**Step 4: Verify**

Run:

```bash
pnpm vitest tests/services/feedback-capture.test.ts
```

Expected: feedback updates both operational state and future planning inputs.

---

### Task 12: Add cost observability and core diagnostics

**Files:**
- Create: `lib/observability/cost-tracker.ts`
- Create: `lib/observability/workflow-metrics.ts`
- Create: `app/api/metrics/overview/route.ts`
- Create: `tests/observability/cost-tracker.test.ts`

**Step 1: Track cost by graph**

Record:

- research cost
- production cost
- briefing cost
- review cost

**Step 2: Track core Phase 0 metrics**

Support:

- cycle lead time
- artifact pass rate
- owner intervention rate
- average revision rounds
- escalation frequency
- workflow recovery failures

**Step 3: Expose a minimal metrics API**

No full dashboard required yet; just enough for verification.

**Step 4: Verify**

Run:

```bash
pnpm vitest tests/observability/cost-tracker.test.ts
```

Expected: cost and workflow metrics are queryable.

---

### Task 13: Add one end-to-end demo path

**Files:**
- Create: `tests/e2e/phase0-persistent-team.spec.ts`
- Modify: `app/page.tsx`
- Modify: `app/layout.tsx`

**Step 1: Expose a simple Phase 0 demo route**

The UI only needs to:

- create team
- start cycle
- show briefing
- show one artifact
- show one decision

**Step 2: Write an end-to-end test**

Cover:

- bootstrap
- cycle planning
- research artifact
- owner decision
- resumed workflow

**Step 3: Verify**

Run:

```bash
pnpm playwright test
```

Expected: one owner flow completes end-to-end.

---

### Task 14: Phase 0 exit review

**Files:**
- Create: `docs/reviews/2026-03-13-phase0-readiness-review.md`

**Step 1: Evaluate against exit criteria**

Phase 0 is only complete if all 4 claims are proven:

- this is not just cron workflow
- the team survives across cycles
- owner approval resumes correctly
- feedback changes the next cycle

**Step 2: Record open risks**

Document:

- research quality limits
- token cost pressure
- memory drift risk
- escalation tuning gaps

**Step 3: Decide Phase 1 go/no-go**

Output one of:

- proceed
- proceed with constraints
- stop and redesign

---

## Execution Order

Use this dependency order:

1. Task 1
2. Task 2
3. Task 3
4. Task 4
5. Task 5
6. Task 6
7. Task 7
8. Task 8
9. Task 9
10. Task 10
11. Task 11
12. Task 12
13. Task 13
14. Task 14

## Notes

- Do not split into microservices during Phase 0.
- Do not overbuild graph memory during Phase 0.
- Keep `PostgreSQL` as the single business truth source.
- Treat `LangGraph` as execution runtime, not domain truth.
- Treat `Inngest` as orchestration shell, not business state.
