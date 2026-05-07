# Plan: Add Roadmap And Changelog Portal

Status: Backlog

Priority: P2

Type: feat

Owner: Agent

Created: 2026-05-07

## Goal

Generate a public roadmap and changelog portal so founders can communicate
product direction, collect votes, and publish launch updates.

## Context

- Product intent: `docs/PRODUCT_SENSE.md`
- Content docs plan:
  `docs/exec-plans/backlog/p2-feat-add-content-docs-and-seo-addon.md`
- Support inbox plan:
  `docs/exec-plans/backlog/p2-feat-add-support-inbox-and-feedback-addon.md`
- Analytics add-on: `src/addons/analytics.ts`

Audit findings:

- Content and support plans cover docs and feedback, but not product direction
  communication.
- Early products need a visible loop between requests, planned work, releases,
  and customer trust.
- Roadmap and changelog records can integrate with support feedback and
  analytics events.

## Acceptance Criteria

- Tenex supports `tenex add roadmap`.
- Generated Convex tables store roadmap items, statuses, votes, changelog
  entries, labels, and subscriber preferences.
- Generated UI includes public roadmap, internal roadmap management, changelog
  publishing, and vote capture.
- Optional support hooks convert feature requests into roadmap candidates.
- Optional email and analytics hooks announce releases and track engagement.
- Tests cover generated schema, public routes, admin routes, and add-on hooks.

## Steps

- [ ] Add roadmap add-on metadata and manifest support.
- [ ] Generate schema, queries, mutations, and public visibility helpers.
- [ ] Generate public and internal roadmap/changelog routes.
- [ ] Wire optional support, email, and analytics integrations.
- [ ] Add smoke tests for public and authenticated surfaces.

## Decisions

- 2026-05-07: Keep roadmap publishing lightweight and explicit so founders can
  edit product messaging directly in code.

## Verification

- Planning review only. Future verification should include public visibility
  and draft/published state tests.

## Handoff

This would make Tenex-generated products better at communicating momentum and
closing feedback loops.
