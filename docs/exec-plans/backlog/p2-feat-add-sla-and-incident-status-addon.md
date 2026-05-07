# Plan: Add SLA And Incident Status Addon

Status: Backlog

Priority: P2

Type: feat

Owner: Agent

Created: 2026-05-07

## Goal

Generate a status page, incident management, and SLA communication workflow for
founders operating production SaaS products.

## Context

- Product intent: `docs/PRODUCT_SENSE.md`
- Observability plan:
  `docs/exec-plans/backlog/p2-infra-add-observability-addon.md`
- Support inbox plan:
  `docs/exec-plans/backlog/p2-feat-add-support-inbox-and-feedback-addon.md`
- Email add-on: `src/addons/email.ts`

Audit findings:

- Observability captures internal signals, but customers need external
  communication when incidents happen.
- Founders need simple incident lifecycle tools before adopting a dedicated
  status-page vendor.
- Support, email, notifications, and audit logs all benefit from shared
  incident records.

## Acceptance Criteria

- Tenex supports `tenex add status-page`.
- Generated schema tracks components, uptime checks, incidents, updates,
  subscribers, severity, and resolved timestamps.
- Generated UI includes public status page, admin incident editor, subscriber
  management, and incident history.
- Optional observability hooks can open incidents or update component status.
- Optional email and notification hooks send incident updates.
- Tests cover public route generation, incident lifecycle helpers, add-on hooks,
  and idempotency.

## Steps

- [ ] Add status page add-on metadata and manifest support.
- [ ] Generate component and incident schema.
- [ ] Generate public status and internal incident routes.
- [ ] Wire optional observability, support, email, and notification hooks.
- [ ] Add tests for public visibility and incident state transitions.

## Decisions

- 2026-05-07: Make the status page customer-facing and independent from admin
  observability dashboards.

## Verification

- Planning review only. Future verification should include incident lifecycle
  and public route smoke tests.

## Handoff

This helps generated products communicate reliability professionally once they
have real users.
