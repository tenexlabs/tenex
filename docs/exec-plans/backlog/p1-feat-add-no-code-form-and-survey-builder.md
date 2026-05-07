# Plan: Add No Code Form And Survey Builder

Status: Backlog

Priority: P1

Type: feat

Owner: Agent

Created: 2026-05-07

## Goal

Generate a form and survey builder so founders can collect structured customer
input, qualify leads, and run lightweight research without wiring each form by
hand.

## Context

- Product intent: `docs/PRODUCT_SENSE.md`
- Waitlist template: `src/templates.ts`
- Email and analytics add-ons: `src/addons/email.ts`, `src/addons/analytics.ts`
- CRM plan: `docs/exec-plans/backlog/p2-feat-add-customer-crm-addon.md`

Audit findings:

- The waitlist template captures a narrow prelaunch workflow, but founders often
  need many forms: demo requests, onboarding surveys, feedback, churn surveys,
  and lead qualification.
- Existing templates have forms, but not a reusable schema-driven form surface.
- A generated builder would pair well with CRM, analytics, support, and email
  workflow add-ons.

## Acceptance Criteria

- Tenex supports `tenex add forms`.
- Generated Convex tables store forms, fields, versions, submissions, spam
  status, and optional attribution metadata.
- Generated UI includes form builder, public form rendering, submission detail,
  export-ready table views, and basic response analytics.
- Field types include text, email, URL, number, select, multi-select, checkbox,
  rating, textarea, and hidden metadata fields.
- Optional CRM, email, and analytics hooks create leads, send confirmations, and
  track conversion events when those add-ons are enabled.
- Tests cover generated schema, public routes, builder routes, add-on hooks, and
  idempotency.

## Steps

- [ ] Add forms add-on metadata and manifest support.
- [ ] Generate schema, validation helpers, queries, and mutations.
- [ ] Generate builder UI, public form renderer, and submission review routes.
- [ ] Add template starter forms for waitlist, demo request, and feedback.
- [ ] Wire optional CRM, email, and analytics integrations.
- [ ] Add smoke tests across relevant template and add-on combinations.

## Decisions

- 2026-05-07: Generate a pragmatic field builder, not a full workflow engine.
  Deeper automation belongs in email, CRM, and integration add-ons.

## Verification

- Planning review only. Future verification should include generated form
  validation tests and public-route smoke coverage.

## Handoff

This would help founders learn from users and capture demand immediately after
scaffolding a product.
