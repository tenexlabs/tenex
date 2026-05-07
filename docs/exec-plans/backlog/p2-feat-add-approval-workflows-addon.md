# Plan: Add Approval Workflows Addon

Status: Backlog

Priority: P2

Type: feat

Owner: Agent

Created: 2026-05-07

## Goal

Generate approval workflows for actions that require review, such as publish
requests, discounts, account changes, content updates, and admin operations.

## Context

- Product intent: `docs/PRODUCT_SENSE.md`
- Admin add-on: `src/addons/admin.ts`
- RBAC plan:
  `docs/exec-plans/backlog/p2-feat-add-rbac-permissions-addon.md`
- Audit log plan:
  `docs/exec-plans/backlog/p2-feat-add-audit-log-and-activity-feed.md`

Audit findings:

- Admin and operations surfaces need review gates as generated apps become more
  team-oriented.
- Approval state is reusable across content, billing, support, CRM, roadmap,
  and data import workflows.
- Tenex can generate a generic approval request model with add-on-specific
  adapters.

## Acceptance Criteria

- Tenex supports `tenex add approvals`.
- Generated schema stores approval requests, subjects, reviewers, decisions,
  comments, due dates, and audit links.
- Generated UI includes approval inbox, request detail, pending badges, and
  reviewer settings.
- Add-ons can register approval-required actions and completion callbacks.
- Optional notification and audit log hooks announce and record decisions.
- Tests cover request lifecycle helpers, route links, add-on registrations, and
  idempotency.

## Steps

- [ ] Add approvals add-on metadata and manifest support.
- [ ] Generate schema, lifecycle helpers, and reviewer guard utilities.
- [ ] Generate approval inbox and request detail routes.
- [ ] Add adapter hooks for admin, content, billing, imports, and roadmap.
- [ ] Add smoke tests for approval state transitions.

## Decisions

- 2026-05-07: Implement generic approval primitives first so product-specific
  workflows can compose them.

## Verification

- Planning review only. Future verification should include authorization tests
  around reviewer-only decisions.

## Handoff

This would make generated apps stronger for small teams where operational
changes need review.
