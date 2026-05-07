# Plan: Add Privacy Consent Center

Status: Backlog

Priority: P2

Type: feat

Owner: Agent

Created: 2026-05-07

## Goal

Generate a privacy and consent center so apps can collect, store, and respect
user consent for analytics, marketing, cookies, and data processing choices.

## Context

- Security docs: `docs/SECURITY.md`
- Analytics add-on: `src/addons/analytics.ts`
- Email add-on: `src/addons/email.ts`
- Content docs plan:
  `docs/exec-plans/backlog/p2-feat-add-content-docs-and-seo-addon.md`

Audit findings:

- Analytics and email add-ons can create consent obligations depending on the
  founder's market.
- Generated apps need a clear place to manage consent preferences and legal
  links.
- Tenex should not offer legal advice, but it can scaffold explicit state and
  user controls.

## Acceptance Criteria

- Tenex supports `tenex add privacy-center`.
- Generated schema stores consent categories, versions, user decisions, region
  hints, and revocation timestamps.
- Generated UI includes consent banner starter, privacy preferences page, and
  admin consent history view.
- Analytics and email hooks check consent state before optional tracking or
  marketing sends.
- Generated docs clearly mark legal copy as starter content requiring review.
- Tests cover generated consent checks, route links, add-on hooks, and
  idempotency.

## Steps

- [ ] Add privacy center add-on metadata and manifest support.
- [ ] Generate consent schema, helpers, and preference UI.
- [ ] Patch analytics and email integration points.
- [ ] Generate legal starter pages or links when content docs are enabled.
- [ ] Add tests for consent-gated tracking and email hooks.

## Decisions

- 2026-05-07: Generate controls and durable records, while leaving legal text
  review to the founder.

## Verification

- Planning review only. Future verification should include consent-state tests
  for analytics and email paths.

## Handoff

This would make Tenex-generated apps more launch-ready in privacy-sensitive
markets.
