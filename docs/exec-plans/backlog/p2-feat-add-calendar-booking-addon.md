# Plan: Add Calendar Booking Addon

Status: Backlog

Priority: P2

Type: feat

Owner: Agent

Created: 2026-05-07

## Goal

Generate scheduling and booking workflows for demo calls, onboarding sessions,
support appointments, and customer interviews.

## Context

- Product intent: `docs/PRODUCT_SENSE.md`
- CRM plan: `docs/exec-plans/backlog/p2-feat-add-customer-crm-addon.md`
- Email add-on: `src/addons/email.ts`
- Waitlist template: `src/templates.ts`

Audit findings:

- Founder-led sales and onboarding often require booking flows before a product
  is mature enough for complex sales tooling.
- Tenex currently scaffolds landing, dashboard, and settings surfaces but not
  time-based customer interactions.
- Calendar workflows can integrate with CRM, email reminders, and analytics.

## Acceptance Criteria

- Tenex supports `tenex add booking`.
- Generated Convex tables store availability rules, booking pages, appointments,
  attendees, status, reminders, and cancellation state.
- Generated routes include public booking page, internal calendar view, booking
  detail, and settings.
- Optional CRM hooks attach bookings to leads or accounts.
- Optional email hooks send confirmations, reminders, and cancellations.
- Tests cover generated schema, public route generation, settings links, and
  add-on integrations.

## Steps

- [ ] Add booking add-on metadata and manifest state.
- [ ] Generate scheduling schema, queries, mutations, and availability helpers.
- [ ] Generate public and authenticated booking UI.
- [ ] Wire optional CRM, email, and analytics hooks.
- [ ] Add smoke tests for waitlist and SaaS templates.

## Decisions

- 2026-05-07: Start with generated in-app availability logic. External calendar
  sync can be a later provider.

## Verification

- Planning review only. Future verification should include timezone and
  collision tests.

## Handoff

This would help founders turn interest into live conversations directly from a
generated app.
