# Plan: Add Contracts And Esignature Workflows

Status: Backlog

Priority: P2

Type: feat

Owner: Agent

Created: 2026-05-07

## Goal

Generate lightweight contract, proposal, and e-signature workflows for founders
selling B2B products before they adopt a full CRM or legal platform.

## Context

- Product intent: `docs/PRODUCT_SENSE.md`
- CRM plan: `docs/exec-plans/backlog/p2-feat-add-customer-crm-addon.md`
- File storage plan:
  `docs/exec-plans/backlog/p2-feat-add-file-library-and-upload-workflows.md`
- Email add-on: `src/addons/email.ts`

Audit findings:

- B2B founders often need to send proposals, terms, and simple agreements from
  the product operating surface.
- Tenex currently has billing and admin direction, but not deal-closing
  document workflows.
- Generated code can provide a clear starter without attempting to replace
  legal review.

## Acceptance Criteria

- Tenex supports `tenex add contracts`.
- Generated Convex tables track templates, documents, recipients, signature
  status, audit events, and attached files.
- Generated routes include template list, document composer, recipient view,
  signature page, and internal document status.
- Optional CRM hooks attach contracts to accounts, contacts, and deal stages.
- Optional email hooks send signature requests and completion notifications.
- Tests cover generated schema, route links, document lifecycle helpers, and
  idempotency.

## Steps

- [ ] Add contracts add-on metadata and manifest support.
- [ ] Generate document schema, template helpers, and signature state helpers.
- [ ] Generate internal and recipient-facing routes.
- [ ] Wire optional CRM, email, storage, and audit log hooks.
- [ ] Add smoke tests for generated pages and lifecycle state.

## Decisions

- 2026-05-07: Position this as workflow scaffolding, not legal advice or a
  certified signing provider.

## Verification

- Planning review only. Future verification should include signature token and
  recipient-access tests.

## Handoff

This would help B2B founders move from interest to signed agreement without
leaving the generated product surface.
