# Plan: Add Integrations And Webhooks Addon

Status: Backlog

Priority: P2

Type: feat

Owner: Agent

Created: 2026-05-07

## Goal

Generate integration settings, outbound webhooks, inbound webhook handlers, and
delivery logs so founders can connect their Tenex app to external systems.

## Context

- Product intent: `docs/PRODUCT_SENSE.md`
- Add-on contract: `ARCHITECTURE.md`
- Existing add-ons: `src/addons/`
- Doctor validation: `src/lib/doctor.ts`
- Env parsing: `src/lib/dotenv.ts`

Audit findings:

- Current add-ons integrate first-party provider choices, but generated apps do
  not include a reusable integration framework for customer-configured systems.
- Support inboxes, CRMs, billing, analytics, and AI workflows all benefit from a
  shared webhook event and delivery model.
- Tenex already has env validation and manifest state that can describe enabled
  integration capabilities.

## Acceptance Criteria

- Tenex supports `tenex add integrations` with outbound webhook and inbound
  webhook scaffolding.
- Generated Convex tables track integration endpoints, secrets, event
  subscriptions, delivery attempts, response status, and retry state.
- Generated UI includes integration settings, webhook endpoint creation,
  delivery logs, retry controls, and secret rotation.
- Generated server helpers sign outbound payloads, verify inbound signatures,
  and normalize event envelopes.
- `tenex doctor` validates required webhook env vars and warns about insecure
  local/demo secrets.
- Tests cover generated schema, signature helpers, route links, doctor checks,
  and idempotency.

## Steps

- [ ] Add integrations add-on metadata and manifest state.
- [ ] Generate webhook schema, event types, signing helpers, and mutations.
- [ ] Generate integration settings and delivery log routes.
- [ ] Add doctor checks for configured secrets and endpoint URLs.
- [ ] Create examples for common events such as user created, subscription
  changed, lead captured, and support ticket opened.
- [ ] Add test coverage for signing, verification, retries, and generated files.

## Decisions

- 2026-05-07: Build this as a generic product integration layer, not a catalog
  of vendor-specific connectors, so founders can adapt it to their first real
  customers.

## Verification

- Planning review only. Future verification should include unit coverage around
  signature validation and retry state transitions.

## Handoff

This would make generated apps much easier to sell into real workflows because
customers could connect Tenex-built products to their existing tools.
