# Plan: Add API Keys And Developer Portal

Status: Backlog

Priority: P2

Type: feat

Owner: Agent

Created: 2026-05-07

## Goal

Add an API keys and developer portal add-on so generated SaaS and AI SaaS apps
can expose product APIs, manage credentials, and document integration paths.

## Context

- Product intent: `docs/PRODUCT_SENSE.md`
- CLI spec: `docs/product-specs/tenex-cli.md`
- Templates: `src/templates.ts`
- Auth and teams add-ons: `src/addons/auth.ts`, `src/addons/teams.ts`
- Generated-file safety: `src/lib/generated-files.ts`

Audit findings:

- Tenex currently scaffolds user-facing product shells but not developer-facing
  integration surfaces.
- Many AI SaaS and B2B SaaS products need API keys, usage visibility, and
  starter docs early in the product lifecycle.
- Existing auth, teams, usage metering, and observability plans create natural
  integration points for API access control and monitoring.

## Acceptance Criteria

- Tenex supports `tenex add developer-portal` with API key generation and
  revocation flows.
- Generated Convex tables store hashed API keys, prefixes, scopes, owners,
  last-used timestamps, and revocation metadata.
- Generated routes include API key management, API usage examples, and a
  developer docs landing page.
- Generated server helpers validate API keys, enforce scopes, and expose a
  pattern for adding protected endpoints.
- Optional usage metering and observability integrations record API calls and
  failures when those add-ons are enabled.
- Tests cover key hashing behavior, generated route links, manifest updates,
  and idempotent re-runs.

## Steps

- [ ] Add developer portal add-on metadata and manifest support.
- [ ] Generate API key schema, helpers, queries, and mutations.
- [ ] Generate developer portal routes and API reference starter content.
- [ ] Add scoped API guard examples for TanStack Start server functions.
- [ ] Wire optional metering and observability hooks.
- [ ] Add smoke and focused unit coverage for credential lifecycle behavior.

## Decisions

- 2026-05-07: Store only hashed API key material and show the raw key once at
  creation time. Generated scaffolds should model deployable security defaults.

## Verification

- Planning review only. Future verification should include security-focused
  tests for hashing, revocation, scope checks, and accidental key disclosure.

## Handoff

This would expand Tenex from app scaffolding into product-platform scaffolding,
which is especially valuable for AI and B2B products with integration needs.
