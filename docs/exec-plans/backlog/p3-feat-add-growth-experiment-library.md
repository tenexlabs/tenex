# Plan: Add Growth Experiment Library

Status: Backlog

Priority: P3

Type: feat

Owner: Agent

Created: 2026-05-07

## Goal

Generate a library of growth experiment templates for activation, conversion,
referral, retention, and pricing tests.

## Context

- Product intent: `docs/PRODUCT_SENSE.md`
- Analytics experiments plan:
  `docs/exec-plans/backlog/p2-feat-add-analytics-funnels-and-experiments.md`
- Feature flags plan:
  `docs/exec-plans/backlog/p2-feat-add-feature-flags-and-rollouts.md`
- Referral plan:
  `docs/exec-plans/backlog/p2-feat-add-referral-and-affiliate-program.md`

Audit findings:

- Analytics and feature flags provide mechanics, but founders still need
  product-specific experiment ideas and generated starting points.
- Growth experiments become more useful when tied to onboarding, pricing,
  referrals, email, and content surfaces.
- Tenex can scaffold editable examples rather than leaving users with blank
  experimentation infrastructure.

## Acceptance Criteria

- Tenex supports `tenex add growth-experiments`.
- Generated experiment templates include activation checklist variants, pricing
  page tests, referral prompts, email subject tests, empty-state tests, and
  upgrade prompts.
- Generated UI includes experiment library, setup checklist, result summary, and
  links to relevant generated surfaces.
- Optional analytics and feature flag hooks pre-wire metrics and variants.
- Tests cover generated template registry, route links, add-on hooks, and
  idempotency.

## Steps

- [ ] Add growth experiment add-on metadata and manifest support.
- [ ] Generate experiment template registry and setup UI.
- [ ] Wire optional analytics, feature flag, email, referral, and billing hooks.
- [ ] Add docs explaining which templates fit each Tenex starter.
- [ ] Add smoke tests for generated registry and route links.

## Decisions

- 2026-05-07: Keep experiments as editable templates, not automated growth
  recommendations.

## Verification

- Planning review only. Future verification should include generated registry
  snapshots and add-on permutation tests.

## Handoff

This would turn Tenex's analytics and rollout capabilities into practical growth
workflows for founders.
