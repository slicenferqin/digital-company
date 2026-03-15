[中文](README.md) | [English](README.en.md)

# Digital Company

> Persistent AI content and growth teams that actually deliver.

![Digital Company workbench preview](docs/ui/2026-03-11-boss-workbench-hi-fi-preview.png)

`Digital Company` is not a one-off multi-agent workflow.

It is a product for business owners who want to hand over an operating digital team, not repeatedly spin up temporary agent crews for isolated tasks.

The first version is intentionally narrow:

## A persistent digital content growth team

## What it is

- A persistent team that operates across cycles
- A system that turns business context into briefs, drafts, reviews, decisions, and briefings
- A boss-facing workbench, not an agent micromanagement console
- A product that values delivered assets over process theater

## What it is not

- Not a one-shot agent swarm
- Not a cron wrapper around multi-agent workflows
- Not an “AI employees” simulation game
- Not a generic AI company control plane
- Not a prompt playground

## Product principles

1. **Delivery first** — business assets and management materials matter more than internal agent chatter.
2. **Persistent team, not temporary workflow** — the team should retain memory, standards, and context across weeks.
3. **Boss workbench, not orchestrator UI** — the default interface should surface briefings, deliverables, approvals, and risks.
4. **Org chart as explanation** — org structure explains ownership and escalation; it is not there for theater.
5. **Useful memory over theatrical humanity** — keep role boundaries, collaboration history, preferences, and decisions; do not recreate all human-office noise.

## Core objects

- `Team`
- `Cycle`
- `Project`
- `Task`
- `Artifact`
- `ArtifactReview`
- `Briefing`
- `Decision`
- `MemoryEntry`
- `PreferenceProfile`

## Default founding team

The first default team looks like a compact content growth department:

- Researcher
- Writer
- Editor
- Distribution / Ops
- Chief of Staff

The owner is not another operator inside the loop.

The owner acts as the boss:

- sets goals
- approves key decisions
- reviews important deliverables
- delegates more over time

## Example outputs

- content strategy card
- topic briefs
- research summaries
- long-form article draft
- short-form social posts
- competitor watch note
- cycle retrospective
- daily / weekly boss briefing

## Tech direction

Current MVP direction:

- `Next.js`
- `LangGraph.js`
- `PostgreSQL`
- `Inngest`

Principles:

- PostgreSQL is the business truth layer
- LangGraph is the execution runtime, not the source of truth
- Inngest handles outer scheduling and orchestration
- artifacts, reviews, briefings, and decisions are first-class objects

## Current status

This repo currently contains:

- product definition notes
- technical feasibility research
- technical design drafts
- boss workbench explorations
- an initial Next.js skeleton

## Quickstart

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Recommended reading

- Product note: [`docs/plans/2026-03-12-digital-company-product-note-v0.3.md`](docs/plans/2026-03-12-digital-company-product-note-v0.3.md)
- Technical design: [`docs/plans/2026-03-12-digital-company-technical-design-v0.2.md`](docs/plans/2026-03-12-digital-company-technical-design-v0.2.md)
- Phase 0 plan: [`docs/plans/2026-03-13-digital-company-phase0-implementation-plan.md`](docs/plans/2026-03-13-digital-company-phase0-implementation-plan.md)

## Contributing

This project is still early. High-signal product feedback, architecture critiques, and implementation contributions are all useful.

See [`CONTRIBUTING.md`](CONTRIBUTING.md).
