# Plan: Add Knowledge Base Assistant Addon

Status: Backlog

Priority: P2

Type: feat

Owner: Agent

Created: 2026-05-07

## Goal

Generate a knowledge base assistant that can answer questions from product docs,
support articles, changelog entries, and founder-provided content.

## Context

- Product intent: `docs/PRODUCT_SENSE.md`
- AI workflow plan:
  `docs/exec-plans/backlog/p2-feat-add-ai-workflow-addon.md`
- Content docs plan:
  `docs/exec-plans/backlog/p2-feat-add-content-docs-and-seo-addon.md`
- Support inbox plan:
  `docs/exec-plans/backlog/p2-feat-add-support-inbox-and-feedback-addon.md`

Audit findings:

- AI SaaS scaffolding needs practical AI product patterns, not just generic
  prompt storage.
- Docs and support surfaces become more valuable when users can query them.
- Tenex can generate transparent retrieval scaffolding while keeping provider
  choices explicit.

## Acceptance Criteria

- Tenex supports `tenex add knowledge-assistant`.
- Generated schema stores sources, chunks, embeddings metadata, answer logs,
  feedback, and escalation links.
- Generated UI includes a docs assistant widget, internal answer review, and
  source management starter.
- Optional support hooks create tickets when confidence is low or users request
  human help.
- Optional analytics hooks track question categories, resolution, and feedback.
- Tests cover generated files, provider env requirements, route links, and
  idempotency.

## Steps

- [ ] Add knowledge assistant add-on metadata and manifest support.
- [ ] Generate source/chunk schema and provider configuration files.
- [ ] Generate assistant UI, review surface, and escalation actions.
- [ ] Wire optional docs, support, analytics, and AI workflow hooks.
- [ ] Add smoke tests for generated routes and env validation.

## Decisions

- 2026-05-07: Keep source attribution visible in generated answers so founders
  can inspect and improve assistant behavior.

## Verification

- Planning review only. Future verification should include provider-env doctor
  checks and source citation rendering checks.

## Handoff

This would give Tenex-generated products a high-leverage AI feature that is
easy to understand and extend.
