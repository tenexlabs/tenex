# Plan: Add Email Workflow Builder

Status: Backlog

Priority: P2

Type: feat

Owner: Agent

Created: 2026-05-07

## Goal

Expand the email add-on into a transactional email and lifecycle workflow
builder with templates, events, sequences, previews, and operational status.

## Context

- Email add-on: `src/addons/email.ts`
- Auth scaffold: `src/addons/auth.ts`
- Teams add-on: `src/addons/teams.ts`
- Waitlist feature opportunity:
  `docs/exec-plans/backlog/p1-feat-add-waitlist-referral-engine.md`
- Generated app contract: `docs/product-specs/generated-app-contract.md`

Audit findings:

- Current email output is a Resend component registration, a placeholder action,
  and plain string template functions.
- Generated auth, teams, support, waitlist, and onboarding flows all need email
  touchpoints.
- There is no email preview, delivery log, or workflow status in the generated
  app.

## Acceptance Criteria

- Email add-on generates typed templates for invite, verification, reset,
  onboarding, waitlist, billing, and support events where applicable.
- Generated Convex actions can send emails through the selected provider and
  persist delivery attempts.
- Generated UI includes an operator preview/log route or admin panel section.
- Other add-ons can register email events without duplicating provider code.
- Tests cover generated templates, action source, event registration, and
  optional add-on combinations.

## Steps

- [ ] Define an email event registry and generated provider facade.
- [ ] Generate typed template functions and preview data.
- [ ] Generate Convex send actions and delivery-log schema.
- [ ] Add admin/settings UI for template preview and delivery status.
- [ ] Integrate auth, teams, waitlist, support, and billing events over time.
- [ ] Add smoke tests for the email add-on with representative integrations.

## Decisions

- 2026-05-07: Avoid hiding provider concepts. Generated files should make
  sender identity, template data, and provider action boundaries explicit.

## Verification

- Planning review only. Future verification should include generated-source
  tests and fixture checks for add-on integrations.

## Handoff

This upgrades email from a dependency stub into the communication backbone for
founder workflows.
