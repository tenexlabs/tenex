# Plan: Add Customer Health Scoring

Status: Backlog

Priority: P2

Type: feat

Owner: Agent

Created: 2026-05-07

## Goal

Generate customer health scoring so SaaS founders can identify active,
at-risk, expanding, and stalled customers from product and account signals.

## Context

- Product intent: `docs/PRODUCT_SENSE.md`
- CRM plan: `docs/exec-plans/backlog/p2-feat-add-customer-crm-addon.md`
- Analytics plan:
  `docs/exec-plans/backlog/p2-feat-add-analytics-funnels-and-experiments.md`
- Usage metering plan:
  `docs/exec-plans/backlog/p2-feat-add-usage-metering-and-entitlements.md`

Audit findings:

- Generated dashboards currently show static or generic metrics.
- Founders need practical customer success signals when billing, teams,
  analytics, and CRM data exist.
- Health scoring can be generated as transparent rules rather than opaque AI.

## Acceptance Criteria

- Tenex supports `tenex add health-scoring`.
- Generated schema tracks score snapshots, signal inputs, score explanations,
  and account/user associations.
- Generated UI includes health overview, at-risk list, score detail, and rule
  configuration starter.
- Optional CRM, usage, analytics, billing, and support hooks contribute signals.
- Scores are explainable in generated code and editable by founders.
- Tests cover score helper generation, optional signal registration, route
  links, and idempotency.

## Steps

- [ ] Add health scoring add-on metadata and manifest support.
- [ ] Generate signal registry, scoring helpers, and snapshot schema.
- [ ] Generate dashboard and detail routes.
- [ ] Add adapters for CRM, usage, analytics, billing, and support signals.
- [ ] Add smoke tests for signal combinations.

## Decisions

- 2026-05-07: Use editable deterministic rules first so founders can trust and
  adapt health scoring without model dependencies.

## Verification

- Planning review only. Future verification should include sample score
  calculation tests.

## Handoff

This turns operational data into a practical founder workflow for retention and
expansion.
