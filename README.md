# Digital Company

> Persistent AI content and growth teams that actually deliver.

![Digital Company workbench preview](docs/ui/2026-03-11-boss-workbench-hi-fi-preview.png)

`Digital Company` is not a one-off multi-agent workflow.

It is a persistent digital team product for business owners who need a low-cost team that can keep shipping week after week.

The first version is intentionally narrow:

## A persistent digital content growth team

Instead of spinning up a temporary team of agents for every request, you hand over a real operating team with:

- persistent roles
- cross-cycle memory
- a chief-of-staff layer
- review and approval loops
- reusable business assets
- a boss-facing workbench

## What it is

- A team that keeps operating across cycles
- A system that turns business context into briefs, drafts, reviews, decisions, and briefings
- A product for owners who care more about outcomes than chatting with agents
- A workbench where the owner intervenes only on the right decisions

## What it is not

- Not a one-shot agent swarm
- Not a cron wrapper around a multi-agent workflow
- Not a “hire some AI employees” game
- Not a generic AI company simulator
- Not a prompt playground

## Why this exists

Many founder-led teams have ongoing content and growth goals, but no stable execution team.

Today they usually choose one of three bad options:

1. Do everything themselves
2. Hire a full team too early
3. Use single-agent tools that help with output, but do not preserve team memory, role boundaries, review quality, or operating rhythm

`Digital Company` is built around a different idea:

**People do not just need better task execution. They need a team that keeps learning their business and keeps delivering.**

## Product principles

### 1. Delivery first

The product is judged by what the owner receives, not by how interesting the internal agent process looks.

Every cycle should produce:

- business assets
- management materials

### 2. Persistent team, not temporary workflow

The team persists across weeks, retains context, and improves over time.

### 3. Boss interface, not orchestrator interface

The user should not need to micromanage each agent.

The default surface is:

- today’s briefing
- current cycle progress
- latest deliverables
- pending approvals
- risks and escalation

### 4. Org chart as explanation, not performance

The org structure matters because it explains ownership, delegation, collaboration, and escalation.

It does **not** exist to simulate office drama.

### 5. Useful memory over theatrical humanity

We want the team to remember:

- business context
- brand rules
- review preferences
- past decisions
- quality feedback
- recurring mistakes

We do **not** need to recreate all the noise of a human office.

## Core objects

- `Team` — the persistent operating team
- `Cycle` — the weekly operating cadence
- `Project` — a concrete initiative within a cycle
- `Task` — executable work owned by one role/member
- `Artifact` — deliverable assets such as briefs, drafts, summaries, and reports
- `ArtifactReview` — structured review and quality gates
- `Briefing` — compressed updates for the boss
- `Decision` — owner decisions and policy changes
- `MemoryEntry` — reusable experience and feedback
- `PreferenceProfile` — structured owner preferences and brand constraints

## Example team

The first default team looks like a small content growth department:

- Researcher
- Writer
- Editor
- Distribution / Ops
- Chief of Staff

The owner is not one more operator inside the team.

The owner acts as the boss:

- sets goals
- approves key decisions
- reviews important deliverables
- delegates more over time

## Example outputs

Each cycle should produce assets the owner can actually use:

- content strategy card
- topic briefs
- research summaries
- long-form article draft
- short-form social posts
- competitor watch note
- cycle retrospective
- daily or weekly boss briefing

## Architecture direction

Current MVP direction:

- `Next.js`
- `LangGraph.js`
- `PostgreSQL`
- `Inngest`

Principles:

- PostgreSQL is the source of truth
- LangGraph is the workflow runtime, not the business truth layer
- Inngest handles external scheduling and orchestration
- artifacts, reviews, briefings, and decisions are first-class objects

## Current status

This repository is in early build mode.

What already exists:

- product definition and review notes
- technical feasibility research
- technical design draft
- initial Next.js workbench skeleton
- early UI explorations for the boss workbench

What is being built now:

- schema foundation
- workflow runtime scaffolding
- team bootstrap flow
- boss workbench prototype

## Quickstart

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Roadmap

- [x] Narrow product from “AI company” to “persistent content growth team”
- [x] Define core domain and architecture principles
- [x] Build workbench skeleton
- [ ] Add domain schema foundation
- [ ] Bootstrap a founding team
- [ ] Implement cycle planning flow
- [ ] Implement briefing and approval loop
- [ ] Implement artifact production and review flow
- [ ] Add memory and feedback loop

## Why this may matter

Most AI products today help complete a task.

We are interested in a different question:

**What happens when the same team keeps existing, keeps remembering, keeps collaborating, and keeps shipping?**

## Contributing

The project is very early. Sharp product feedback, architecture critiques, and implementation contributions are all useful.

If this direction resonates with you, open an issue or start a discussion once the public repo is live.
