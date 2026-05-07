# Plan: Add Product Tour Builder

Status: Backlog

Priority: P2

Type: feat

Owner: Agent

Created: 2026-05-07

## Goal

Generate a product tour builder for onboarding callouts, walkthroughs, release
announcements, and contextual education inside generated apps.

## Context

- Product intent: `docs/PRODUCT_SENSE.md`
- Onboarding plan:
  `docs/exec-plans/backlog/p1-feat-add-onboarding-activation-system.md`
- Feature flags plan:
  `docs/exec-plans/backlog/p2-feat-add-feature-flags-and-rollouts.md`
- Templates: `src/templates.ts`

Audit findings:

- Static onboarding checklists do not cover contextual help inside complex
  product screens.
- New add-ons need a reusable way to introduce generated workflows to users.
- Tours should be persisted and dismissible rather than hard-coded copy blocks.

## Acceptance Criteria

- Tenex supports `tenex add product-tours`.
- Generated schema stores tours, steps, target route patterns, completion state,
  dismissals, and audience rules.
- Generated UI includes a tour renderer, tour management starter, and user
  progress tracking.
- Add-ons can register default tours for their generated surfaces.
- Optional analytics hooks track tour start, completion, and drop-off.
- Tests cover generated registry entries, shell patching, route matching, and
  idempotency.

## Steps

- [ ] Add product tours add-on metadata and manifest support.
- [ ] Generate schema, route matcher, and tour renderer.
- [ ] Patch app shell with tour provider state.
- [ ] Add default tours for core templates and selected add-ons.
- [ ] Add smoke tests for tour registry generation.

## Decisions

- 2026-05-07: Use route-aware declarative tour definitions instead of a visual
  editor in the first version.

## Verification

- Planning review only. Future verification should include generated UI checks
  for target availability and dismissed state.

## Handoff

This helps generated products educate users as functionality expands.
