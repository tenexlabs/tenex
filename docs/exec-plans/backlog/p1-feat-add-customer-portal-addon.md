# Plan: Add Customer Portal Addon

Status: Backlog

Priority: P1

Type: feat

Owner: Agent

Created: 2026-05-07

## Goal

Generate a customer portal where end customers can manage profile details,
billing, files, support, contracts, usage, and account preferences.

## Context

- Product intent: `docs/PRODUCT_SENSE.md`
- Billing plan:
  `docs/exec-plans/backlog/p1-feat-add-real-billing-flows.md`
- File library plan:
  `docs/exec-plans/backlog/p2-feat-add-file-library-and-upload-workflows.md`
- Support inbox plan:
  `docs/exec-plans/backlog/p2-feat-add-support-inbox-and-feedback-addon.md`

Audit findings:

- Dashboard surfaces often serve internal/founder users, but many products need
  a dedicated customer-facing account area.
- Billing, support, files, usage, and contracts become more coherent when
  exposed through a portal.
- Tenex should generate portal boundaries explicitly instead of mixing every
  customer-facing flow into admin/dashboard routes.

## Acceptance Criteria

- Tenex supports `tenex add customer-portal`.
- Generated routes include portal home, profile, billing, support, files,
  usage, notifications, and account preferences where add-ons are enabled.
- Generated navigation separates customer portal routes from founder/admin
  operations routes.
- Optional add-ons register portal modules with labels, permissions, and empty
  states.
- Tests cover route generation, add-on module registration, navigation links,
  and idempotency.

## Steps

- [ ] Add customer portal add-on metadata and manifest support.
- [ ] Generate portal shell, route registry, and module slots.
- [ ] Register modules from billing, files, support, usage, notifications, and
  contracts.
- [ ] Add permission-aware navigation and empty states.
- [ ] Add smoke tests for portal route combinations.

## Decisions

- 2026-05-07: Treat the customer portal as a product surface, not just a
  settings subsection.

## Verification

- Planning review only. Future verification should include generated route
  smoke tests for multiple add-on combinations.

## Handoff

This would make Tenex better for products where customers need a self-service
account area.
