# Plan: Add Analytics Funnels And Experiments

Status: Backlog

Priority: P2

Type: feat

Owner: Agent

Created: 2026-05-07

## Goal

Expand analytics from page-view capture into generated funnels, event taxonomy,
identity calls, conversion dashboards, and lightweight experiments.

## Context

- Analytics add-on: `src/addons/analytics.ts`
- Navbar page-view hook: `src/templates.ts`
- Product sense: `docs/PRODUCT_SENSE.md`
- Generated app contract: `docs/product-specs/generated-app-contract.md`

Audit findings:

- The PostHog path initializes client analytics and captures page views from the
  generated navbar.
- The no-provider path is a compatible stub, which is useful for generated
  callsites.
- There is no event registry, funnel definition, dashboard route, server-side
  event helper, or experiment scaffold.

## Acceptance Criteria

- Generated code includes a typed event registry for activation, signup,
  onboarding, checkout, referral, support, and AI workflow events.
- Analytics helper supports capture, identify, group/team identity, and
  server-side capture where appropriate.
- Generated dashboard or settings UI shows configured funnels and instrumented
  event coverage.
- Lightweight experiment scaffolding can define variants and capture exposure
  events without forcing a specific external experimentation product.
- Tests cover provider and stub helper compatibility, generated event names, and
  callsites.

## Steps

- [ ] Define the first event taxonomy and typed helper API.
- [ ] Generate client and optional server analytics helpers.
- [ ] Patch key generated flows to capture meaningful events.
- [ ] Add a funnel/experiment config file generated from the template and
      enabled add-ons.
- [ ] Add UI for analytics readiness and event coverage.
- [ ] Add tests for analytics-enabled and analytics-disabled projects.

## Decisions

- 2026-05-07: Keep generated event names stable and documented because founders
  will build dashboards and automations around them.

## Verification

- Planning review only. Future verification should include generated-source
  tests and template/add-on permutation checks.

## Handoff

This feature makes Tenex-generated apps measurable on day one, which directly
supports founder iteration.
