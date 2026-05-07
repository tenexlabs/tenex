# Plan: Add Workflow Automation Rules

Status: Backlog

Priority: P2

Type: feat

Owner: Agent

Created: 2026-05-07

## Goal

Generate a rule-based automation layer so founders can trigger actions from
product events without hand-coding every operational workflow.

## Context

- Product intent: `docs/PRODUCT_SENSE.md`
- Background jobs plan:
  `docs/exec-plans/backlog/p2-feat-add-background-jobs-and-scheduler.md`
- Integrations plan:
  `docs/exec-plans/backlog/p2-feat-add-integrations-and-webhooks-addon.md`
- Email workflow plan:
  `docs/exec-plans/backlog/p2-feat-add-email-workflow-builder.md`

Audit findings:

- Many planned add-ons produce events, but there is no shared user-editable way
  to react to them.
- Founders need practical automation for lead routing, support alerts, billing
  follow-up, onboarding nudges, and internal notifications.
- A transparent rules engine fits Tenex better than a black-box automation
  platform.

## Acceptance Criteria

- Tenex supports `tenex add automation`.
- Generated schema tracks triggers, conditions, actions, execution logs,
  disabled state, and failure reasons.
- Generated UI includes rule list, rule editor starter, execution log, and
  testing controls.
- Built-in actions include send notification, send email, create task, call
  webhook, update CRM stage, and flag support ticket where add-ons exist.
- Tests cover generated rule evaluation helpers, action registration, route
  links, and idempotency.

## Steps

- [ ] Add automation add-on metadata and manifest support.
- [ ] Generate event, rule, condition, and action registries.
- [ ] Generate UI for rule management and execution logs.
- [ ] Wire actions across email, notifications, CRM, support, and integrations.
- [ ] Add tests for deterministic rule evaluation.

## Decisions

- 2026-05-07: Keep automation deterministic and code-readable; avoid visual
  workflow complexity in the first implementation.

## Verification

- Planning review only. Future verification should include rule evaluation and
  action idempotency tests.

## Handoff

This would let generated products automate founder operations without requiring
an external workflow tool on day one.
