# Plan: Add Referral And Affiliate Program

Status: Backlog

Priority: P2

Type: feat

Owner: Agent

Created: 2026-05-07

## Goal

Generate referral and affiliate program workflows for SaaS products that need
customer-led growth after launch.

## Context

- Product intent: `docs/PRODUCT_SENSE.md`
- Waitlist referral plan:
  `docs/exec-plans/backlog/p1-feat-add-waitlist-referral-engine.md`
- Billing plan:
  `docs/exec-plans/backlog/p1-feat-add-real-billing-flows.md`
- Analytics plan:
  `docs/exec-plans/backlog/p2-feat-add-analytics-funnels-and-experiments.md`

Audit findings:

- The waitlist referral plan focuses on prelaunch acquisition.
- Launched SaaS apps need different mechanics: referral links, account credit,
  affiliate attribution, reward status, and abuse controls.
- Tenex billing and analytics add-ons create natural reward and attribution
  integration points.

## Acceptance Criteria

- Tenex supports `tenex add referrals`.
- Generated schema tracks referral codes, affiliate profiles, attribution
  events, reward rules, reward status, and fraud review state.
- Generated UI includes referral dashboard, affiliate settings, admin review,
  and reward history.
- Optional billing hooks apply credits or mark payout events.
- Optional analytics hooks track referral visits, conversions, and revenue.
- Tests cover generated schema, attribution helpers, route links, and add-on
  integrations.

## Steps

- [ ] Add referrals add-on metadata and manifest support.
- [ ] Generate attribution schema, helpers, and reward state machine.
- [ ] Generate customer and admin referral surfaces.
- [ ] Wire optional billing, analytics, CRM, and email hooks.
- [ ] Add tests for attribution and reward idempotency.

## Decisions

- 2026-05-07: Keep prelaunch waitlist referrals and post-launch referral
  programs separate because their data models and incentives differ.

## Verification

- Planning review only. Future verification should include attribution cookie
  and reward-state tests.

## Handoff

This would give generated products a credible growth loop after launch.
