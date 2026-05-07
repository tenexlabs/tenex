# Plan: Add Real Billing Flows

Status: Backlog

Priority: P1

Type: feat

Owner: Agent

Created: 2026-05-07

## Goal

Replace billing stubs with real checkout, customer portal, webhook, subscription
state, and plan-management flows for supported billing providers.

## Context

- Billing add-on: `src/addons/billing.ts`
- Pricing route: `src/templates.ts`
- Env requirements: `src/lib/tenex-config.ts`
- Deploy handoff: `src/lib/project-readme.ts`
- Security guidance: `docs/SECURITY.md`

Audit findings:

- `convex/billing.ts` returns static plans and notes that checkout/webhooks are
  stubs.
- `src/lib/billing.ts` returns fake success values for checkout and portal
  methods.
- The pricing route does not call billing helpers or reflect subscription state.

## Acceptance Criteria

- Billing add-ons generate provider-specific checkout and portal flows behind a
  stable generated billing facade.
- Webhook routes verify signatures, update subscription/customer state, and keep
  secrets server-side.
- Generated pricing UI can start checkout, open portal, and show current plan or
  billing status.
- Doctor and deploy handoff output include precise provider setup requirements.
- Tests cover generated source for Stripe and Autumn paths, including signature
  handling and env requirements.

## Steps

- [ ] Define a provider-neutral billing facade for checkout, portal, webhook,
      and subscription state.
- [ ] Implement provider-specific generated server/client source.
- [ ] Add Convex schema for customers, subscriptions, invoices/events, and plan
      metadata as needed.
- [ ] Wire pricing route actions into the generated billing facade.
- [ ] Update doctor requirements and handoff copy.
- [ ] Add focused generated-source tests for each provider.

## Decisions

- 2026-05-07: Keep the public UI provider-neutral while letting generated server
  files expose provider-specific details that founders may need to edit.

## Verification

- Planning review only. Future verification should include provider-specific
  fixture checks and security review for webhooks.

## Handoff

This makes Tenex materially more revenue-ready and reduces the amount of
high-risk billing code founders need to invent after scaffolding.
