# Plan: Add Notification Center Addon

Status: Backlog

Priority: P2

Type: feat

Owner: Agent

Created: 2026-05-07

## Goal

Add an in-app notification center with persisted notifications, read state,
preferences, and optional email delivery hooks.

## Context

- Product intent: `docs/PRODUCT_SENSE.md`
- Templates: `src/templates.ts`
- Email add-on: `src/addons/email.ts`
- Teams add-on: `src/addons/teams.ts`
- Admin add-on: `src/addons/admin.ts`

Audit findings:

- Generated apps currently lack a shared way to communicate important product
  events to users after login.
- Many planned add-ons need notifications: team invites, support replies,
  billing events, workflow completion, file processing, and admin actions.
- Email is optional, so in-app notifications provide a baseline communication
  channel that works without external provider setup.

## Acceptance Criteria

- Tenex supports `tenex add notifications`.
- Generated Convex tables store notifications, recipients, read state,
  category, severity, action links, and delivery preferences.
- Generated UI includes a notification bell, notification list, unread count,
  mark-read actions, and preference settings.
- Generated helper APIs allow other add-ons to create notifications without
  duplicating schema logic.
- Optional email hooks send notification digests or immediate delivery when the
  email add-on is enabled.
- Tests cover generated files, helper usage, route patches, and add-on
  idempotency.

## Steps

- [ ] Add notification add-on metadata and manifest support.
- [ ] Generate schema, indexes, queries, mutations, and shared creation helper.
- [ ] Patch app shell navigation with unread notification UI.
- [ ] Generate notification settings and list routes.
- [ ] Add optional email integration points for digest and immediate delivery.
- [ ] Add smoke tests with and without the email add-on.

## Decisions

- 2026-05-07: Keep in-app notifications as the source of truth and treat email
  as an optional delivery channel.

## Verification

- Planning review only. Future verification should include generated UI checks
  and email-enabled permutation coverage.

## Handoff

This would give generated products a reusable communication layer and make
future add-ons feel integrated rather than isolated.
