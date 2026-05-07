# Plan: Add Data Room And Secure Sharing

Status: Backlog

Priority: P2

Type: feat

Owner: Agent

Created: 2026-05-07

## Goal

Generate secure data room and sharing workflows for investor updates, customer
documents, onboarding packets, and private sales collateral.

## Context

- Product intent: `docs/PRODUCT_SENSE.md`
- Storage plan:
  `docs/exec-plans/backlog/p2-feat-add-file-library-and-upload-workflows.md`
- RBAC plan:
  `docs/exec-plans/backlog/p2-feat-add-rbac-permissions-addon.md`
- Audit log plan:
  `docs/exec-plans/backlog/p2-feat-add-audit-log-and-activity-feed.md`

Audit findings:

- File storage alone does not provide secure external sharing workflows.
- Founders often need controlled access to private materials before and after
  launch.
- Generated apps should model expiring links, access logs, and permission
  boundaries instead of ad hoc file URLs.

## Acceptance Criteria

- Tenex supports `tenex add data-room`.
- Generated schema tracks rooms, files, recipients, access grants, expiring
  links, view events, and revocation state.
- Generated UI includes data room management, recipient access pages, file view
  logs, and link controls.
- Optional RBAC and audit log hooks enforce internal permissions and record
  access.
- Optional email hooks send secure access invitations.
- Tests cover generated schema, tokenized access, revocation, route links, and
  idempotency.

## Steps

- [ ] Add data room add-on metadata and manifest support.
- [ ] Generate secure sharing schema, token helpers, and access checks.
- [ ] Generate internal and recipient-facing routes.
- [ ] Wire optional storage, email, RBAC, and audit integrations.
- [ ] Add tests for token expiry and revoked access.

## Decisions

- 2026-05-07: Treat data rooms as controlled product workflows, not just file
  browser folders.

## Verification

- Planning review only. Future verification should include access-control tests
  for external recipients.

## Handoff

This would make generated apps more useful for high-trust B2B and fundraising
workflows.
