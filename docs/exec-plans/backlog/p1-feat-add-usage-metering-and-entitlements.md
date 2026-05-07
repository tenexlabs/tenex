# Plan: Add Usage Metering And Entitlements

Status: Backlog

Priority: P1

Type: feat

Owner: Agent

Created: 2026-05-07

## Goal

Add usage metering and entitlements so generated SaaS and AI SaaS apps can
track units, enforce limits, show upgrade pressure, and connect usage to
billing providers.

## Context

- Billing add-on: `src/addons/billing.ts`
- AI SaaS template config: `src/templates.ts`
- Analytics add-on: `src/addons/analytics.ts`
- Env requirements: `src/lib/tenex-config.ts`
- Generated app contract: `docs/product-specs/generated-app-contract.md`

Audit findings:

- Billing currently generates pricing cards, a facade, and webhook stubs, but no
  entitlements or usage model.
- AI SaaS copy mentions usage pressure, but no usage ledger is generated.
- Generated dashboards show static metrics instead of real quota state.

## Acceptance Criteria

- Tenex supports a `metering` add-on with Convex tables for usage events,
  counters, periods, limits, and entitlement snapshots.
- Generated helpers can record usage, check limits, and return remaining quota.
- Pricing and dashboard routes can show current plan, limit, usage, and upgrade
  prompts.
- Billing provider add-ons can map plans to entitlements without hard-coding one
  provider's model into the core helper.
- Tests cover generated schema, helper source, optional billing integration, and
  idempotency.

## Steps

- [ ] Define provider-neutral entitlement and usage event types.
- [ ] Generate Convex schema, mutations, and query helpers.
- [ ] Add UI components for quota bars, plan badges, and upgrade prompts.
- [ ] Integrate with billing facade and optional analytics events.
- [ ] Add AI workflow hooks once the AI add-on exists.
- [ ] Add smoke coverage for metering plus billing.

## Decisions

- 2026-05-07: Keep enforcement in generated server helpers so founders do not
  accidentally rely only on client-side quota UI.

## Verification

- Planning review only. Future verification should include generated helper
  tests and billing permutation tests.

## Handoff

This feature turns billing from a static pricing page into a product mechanism
that can drive conversion.
