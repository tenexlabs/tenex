# Plan: Add Audit Log And Activity Feed

Status: Backlog

Priority: P1

Type: feat

Owner: Agent

Created: 2026-05-07

## Goal

Generate audit logs and activity feeds so generated apps can explain who did
what, when, and where across product and administrative actions.

## Context

- Product intent: `docs/PRODUCT_SENSE.md`
- Admin add-on: `src/addons/admin.ts`
- Teams add-on: `src/addons/teams.ts`
- Security docs: `docs/SECURITY.md`

Audit findings:

- Admin and team features need durable activity history to be production-ready.
- Compliance, support, billing, and data import/export workflows all benefit
  from a shared event model.
- Current scaffolds lack a reusable audit trail convention.

## Acceptance Criteria

- Tenex supports `tenex add audit-log`.
- Generated Convex tables track actor, target, action, metadata, request
  context, workspace, and timestamps.
- Generated UI includes admin audit log, entity activity timelines, filters,
  and export-ready views.
- Generated helpers let other add-ons record audit events consistently.
- Sensitive metadata is redacted by default.
- Tests cover schema generation, helper calls, route links, redaction behavior,
  and add-on idempotency.

## Steps

- [ ] Add audit log add-on metadata and manifest support.
- [ ] Generate schema, helpers, and redaction utilities.
- [ ] Patch admin and settings surfaces with audit log routes.
- [ ] Add integration hooks for teams, billing, imports, admin, and auth.
- [ ] Add smoke and focused redaction tests.

## Decisions

- 2026-05-07: Separate audit events from user-facing notifications so compliance
  history remains durable even when notifications are dismissed.

## Verification

- Planning review only. Future verification should include tests for sensitive
  metadata redaction.

## Handoff

This would make generated apps more credible for B2B customers and internal
operations.
