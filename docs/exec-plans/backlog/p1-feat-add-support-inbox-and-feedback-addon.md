# Plan: Add Support Inbox And Feedback Addon

Status: Backlog

Priority: P1

Type: feat

Owner: Agent

Created: 2026-05-07

## Goal

Add a support and feedback add-on that gives generated apps an in-product way
to collect user issues, feature requests, satisfaction signals, and operator
responses.

## Context

- Generated app contract: `docs/product-specs/generated-app-contract.md`
- Frontend guidance: `docs/FRONTEND.md`
- Email add-on: `src/addons/email.ts`
- Admin add-on: `src/addons/admin.ts`
- Templates: `src/templates.ts`

Audit findings:

- Generated apps include settings, onboarding, and admin surfaces but no user
  feedback loop.
- Email scaffolding is currently transactional-template only and does not create
  an inbound support workflow.
- Admin can become the operator surface for support if the add-on is enabled.

## Acceptance Criteria

- Tenex supports a `support` add-on that generates feedback/ticket tables and
  protected support functions.
- Generated user-facing UI includes a feedback widget or route with category,
  severity, message, and optional screenshot/link fields.
- Generated operator UI includes inbox, status changes, assignment, notes, and
  response metadata.
- Email add-on integration can send acknowledgements or operator notifications
  when enabled.
- Tests cover generated files, route links, optional email integration, and
  idempotency.

## Steps

- [ ] Add support add-on manifest fields and package/env requirements if needed.
- [ ] Generate Convex schema and mutations for feedback and tickets.
- [ ] Add user-facing feedback route or widget.
- [ ] Add operator inbox, either under admin or as its own protected route.
- [ ] Integrate optional email notifications.
- [ ] Add smoke tests for enabled support with and without admin.

## Decisions

- 2026-05-07: Support should work without a third-party helpdesk provider first.
  Provider integrations can come later if the generated data model is solid.

## Verification

- Planning review only. Future verification should include generated source
  tests and generated UI fixture checks.

## Handoff

This feature gives founders a real post-launch feedback loop and complements
the existing onboarding and admin surfaces.
