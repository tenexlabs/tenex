# Plan: Add Feature Flags And Rollouts

Status: Backlog

Priority: P2

Type: feat

Owner: Agent

Created: 2026-05-07

## Goal

Add Convex-backed feature flags and rollout controls so founders can gate new
surfaces, beta features, templates, and add-ons without redeploying code for
every change.

## Context

- Product sense: `docs/PRODUCT_SENSE.md`
- Admin scaffold: `src/addons/admin.ts`
- Generated app config: `src/templates.ts`
- Manifest model: `src/lib/tenex-config.ts`

Audit findings:

- Generated app behavior is mostly compile-time through `tenex.generated.ts`.
- Admin workspace config has booleans for provider readiness and launch stage,
  but no general feature-flag system.
- Generated apps would benefit from a simple runtime gate for beta workflows,
  pricing experiments, and invite-only features.

## Acceptance Criteria

- Tenex supports a `flags` add-on that generates feature flag schema, queries,
  mutations, and a client helper.
- Flags support boolean gates, optional rollout percentage, optional user/team
  targeting, and descriptions.
- Generated admin UI lets operators create, edit, enable, disable, and audit
  flags.
- Generated routes/components can use a simple helper such as `useFeatureFlag`.
- Tests cover schema generation, flag helper output, admin links, and
  idempotency.

## Steps

- [ ] Define flag model and generated client API.
- [ ] Add add-on manifest and env/package requirements if needed.
- [ ] Generate Convex functions for reading and mutating flags.
- [ ] Generate admin UI and reusable React hooks/components.
- [ ] Optionally patch generated routes to demonstrate one gated feature.
- [ ] Add smoke tests for flags with and without admin enabled.

## Decisions

- 2026-05-07: Keep the first implementation local to Convex. External flag
  providers can be added later behind the same generated helper.

## Verification

- Planning review only. Future verification should include generated source
  tests and access-control review.

## Handoff

This adds operational maturity to generated apps and makes future add-ons easier
to ship progressively.
