# Plan: Add Background Jobs And Scheduler

Status: Backlog

Priority: P2

Type: feat

Owner: Agent

Created: 2026-05-07

## Goal

Generate background job and scheduled task scaffolding so Tenex apps can run
durable product workflows outside direct user requests.

## Context

- Product intent: `docs/PRODUCT_SENSE.md`
- Architecture: `ARCHITECTURE.md`
- Templates: `src/templates.ts`
- Add-ons: `src/addons/`
- Generated app verification: `src/test/smoke.ts`

Audit findings:

- Existing generated apps focus on interactive pages and provider setup, but
  real products need recurring jobs, retries, cleanup tasks, and delayed work.
- Planned features such as email sequences, usage metering, webhooks, AI
  workflows, and notification digests all need shared job semantics.
- Convex scheduled functions can support the baseline without adding another
  queue provider.

## Acceptance Criteria

- Tenex supports `tenex add jobs`.
- Generated code includes a job registry, scheduled function examples, retry
  state, failure logging, and a small admin/status route.
- Generated helpers support enqueueing delayed work, marking attempts, and
  recording terminal failures.
- Template presets include examples such as trial expiry checks, waitlist digest
  generation, AI run cleanup, and stale upload cleanup.
- Optional observability hooks report job failures and latency when enabled.
- Tests cover generated files, manifest updates, scheduled function exports,
  and idempotent re-runs.

## Steps

- [ ] Add jobs add-on metadata and manifest support.
- [ ] Generate Convex job schema, helpers, and scheduled function examples.
- [ ] Generate operator status route and failure detail surfaces.
- [ ] Add template-specific starter jobs.
- [ ] Wire optional observability and notification hooks.
- [ ] Add smoke coverage for generated Convex exports.

## Decisions

- 2026-05-07: Use Convex-native scheduling first. External queues can be future
  providers once Tenex has a provider-pack system.

## Verification

- Planning review only. Future verification should include generated Convex type
  checks and tests for retry state transitions.

## Handoff

This would unlock a large class of product workflows that cannot be modeled as
simple page interactions.
