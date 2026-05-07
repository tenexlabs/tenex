# Plan: Add Invoice And Quote Workflows

Status: Backlog

Priority: P2

Type: feat

Owner: Agent

Created: 2026-05-07

## Goal

Generate invoice and quote workflows for founders selling plans, services,
usage, implementation packages, or custom B2B deals.

## Context

- Product intent: `docs/PRODUCT_SENSE.md`
- Billing plan:
  `docs/exec-plans/backlog/p1-feat-add-real-billing-flows.md`
- CRM plan: `docs/exec-plans/backlog/p2-feat-add-customer-crm-addon.md`
- Contracts plan:
  `docs/exec-plans/backlog/p2-feat-add-contracts-and-esignature-workflows.md`

Audit findings:

- Subscription billing alone does not cover quotes, one-off invoices, service
  packages, or negotiated sales motions.
- Founders selling early B2B deals often need a simple quote-to-payment flow.
- Tenex can generate workflow scaffolding while delegating payment execution to
  supported billing providers.

## Acceptance Criteria

- Tenex supports `tenex add invoices`.
- Generated schema stores quotes, line items, taxes/discount notes, invoice
  status, payment links, customer references, and issue/due dates.
- Generated UI includes quote builder, invoice list, customer-facing invoice
  page, and payment status views.
- Optional billing hooks create checkout/payment links through supported
  providers.
- Optional CRM and contracts hooks associate quotes with accounts and
  agreements.
- Tests cover generated schema, route links, provider hook stubs, and
  idempotency.

## Steps

- [ ] Add invoices add-on metadata and manifest support.
- [ ] Generate quote and invoice schema plus calculation helpers.
- [ ] Generate internal builder and customer-facing invoice routes.
- [ ] Wire optional billing, CRM, email, and contracts hooks.
- [ ] Add formula and generated-route tests.

## Decisions

- 2026-05-07: Keep tax and accounting behavior as starter scaffolding with clear
  extension points instead of pretending to be a finance system.

## Verification

- Planning review only. Future verification should include line-item calculation
  tests and billing provider smoke coverage.

## Handoff

This would help Tenex support real founder sales motions beyond standard
self-serve subscriptions.
