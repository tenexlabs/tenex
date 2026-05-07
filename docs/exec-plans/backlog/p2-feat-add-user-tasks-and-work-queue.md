# Plan: Add User Tasks And Work Queue

Status: Backlog

Priority: P2

Type: feat

Owner: Agent

Created: 2026-05-07

## Goal

Generate a user task and work queue system for follow-ups, manual review,
internal assignments, and operational next actions.

## Context

- Product intent: `docs/PRODUCT_SENSE.md`
- CRM plan: `docs/exec-plans/backlog/p2-feat-add-customer-crm-addon.md`
- Support inbox plan:
  `docs/exec-plans/backlog/p2-feat-add-support-inbox-and-feedback-addon.md`
- Approval workflows plan:
  `docs/exec-plans/backlog/p2-feat-add-approval-workflows-addon.md`

Audit findings:

- Many generated workflows create work for a founder or team member, but there
  is no shared task model.
- CRM follow-ups, support escalations, data import errors, approvals, and
  onboarding reviews need a central queue.
- A task system can make generated apps operationally useful without becoming a
  full project management product.

## Acceptance Criteria

- Tenex supports `tenex add tasks`.
- Generated schema stores tasks, assignees, due dates, priority, status, source
  object, comments, and completion timestamps.
- Generated UI includes task inbox, task detail, quick-create form, filters,
  and source-object links.
- Add-ons can create tasks through a shared helper.
- Optional notifications and audit log hooks announce assignments and record
  completion.
- Tests cover generated schema, helper usage, route links, add-on hooks, and
  idempotency.

## Steps

- [ ] Add tasks add-on metadata and manifest support.
- [ ] Generate schema, lifecycle helpers, and source-object references.
- [ ] Generate task inbox and detail routes.
- [ ] Wire CRM, support, approvals, imports, and onboarding hooks.
- [ ] Add smoke tests for generated task surfaces.

## Decisions

- 2026-05-07: Keep tasks focused on operational next actions rather than broad
  project management.

## Verification

- Planning review only. Future verification should include task lifecycle and
  assignment tests.

## Handoff

This would give founders a concrete place to manage the manual work their
product creates.
