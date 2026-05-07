# Plan: Add Onboarding Activation System

Status: Backlog

Priority: P1

Type: feat

Owner: Agent

Created: 2026-05-07

## Goal

Generate a real onboarding and activation system so new users can complete the
first meaningful product setup flow instead of landing on generic dashboard
placeholders.

## Context

- Product intent: `docs/PRODUCT_SENSE.md`
- Generated app contract: `docs/product-specs/generated-app-contract.md`
- Templates: `src/templates.ts`
- Auth scaffold: `src/addons/auth.ts`
- Analytics add-on: `src/addons/analytics.ts`

Audit findings:

- Current templates include onboarding surfaces, but the flow is mostly static
  and not connected to persisted activation state.
- Founders need early product scaffolds to guide users toward a first value
  moment, especially in SaaS, AI SaaS, and waitlist products.
- Convex is already present, so checklist state, completion timestamps, and
  activation events can be generated without another service.

## Acceptance Criteria

- Tenex supports an onboarding activation option during `tenex new` and through
  `tenex add onboarding`.
- Generated Convex tables track onboarding steps, completion state, skipped
  steps, first-value timestamps, and optional workspace-specific progress.
- Generated UI includes an onboarding route, dashboard activation checklist,
  dismissible guidance, and completion states.
- Template-specific step presets exist for `saas-core`, `ai-saas`, and
  `waitlist`.
- Optional analytics hooks emit activation funnel events when analytics is
  enabled.
- Tests cover generated schema, routes, dashboard patches, idempotency, and
  template-specific step defaults.

## Steps

- [ ] Add onboarding manifest support and provider catalog entry.
- [ ] Generate Convex schema, queries, and mutations for activation progress.
- [ ] Generate onboarding routes and dashboard checklist components.
- [ ] Add template-specific default activation milestones.
- [ ] Patch analytics integration points for funnel events.
- [ ] Add smoke tests across all templates.

## Decisions

- 2026-05-07: Treat onboarding as product state, not static marketing copy, so
  generated apps can measure and improve activation after launch.

## Verification

- Planning review only. Future verification should include generated app syntax
  checks and analytics-enabled add-on permutation tests.

## Handoff

This feature would make every generated app feel closer to a launchable product
because the first user session would have a guided path to value.
