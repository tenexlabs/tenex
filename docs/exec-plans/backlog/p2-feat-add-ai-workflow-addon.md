# Plan: Add AI Workflow Addon

Status: Backlog

Priority: P2

Type: feat

Owner: Agent

Created: 2026-05-07

## Goal

Add an AI workflow add-on that generates provider configuration, prompt/run
storage, usage tracking, evaluation surfaces, and protected UI for AI SaaS
products.

## Context

- Product spec: `docs/product-specs/tenex-cli.md`
- Generated app contract: `docs/product-specs/generated-app-contract.md`
- AI SaaS template config: `src/templates.ts`
- Add-on catalog: `src/addons/catalog.ts`
- Env requirements: `src/lib/tenex-config.ts`

Audit findings:

- `ai-saas` currently changes copy and metrics, but it does not generate a real
  AI workflow surface.
- There is no model-provider add-on, prompt storage, run history, cost tracking,
  or evaluation loop.
- Billing and analytics stubs are natural integration points for usage pressure
  and conversion events.

## Acceptance Criteria

- Tenex supports an `ai` add-on with provider selection and required env vars.
- Generated Convex code stores prompts, runs, status, token/cost estimates, and
  user ownership.
- Generated UI includes a protected workflow runner, run history, detail view,
  and evaluation notes.
- The add-on emits analytics events and optional usage-metering hooks when those
  add-ons are enabled.
- Tests cover provider selection, env requirements, generated files, and
  idempotency.

## Steps

- [ ] Define provider-neutral AI workflow types and manifest fields.
- [ ] Add package and env requirements for the initial supported provider set.
- [ ] Generate Convex tables, functions, and server actions.
- [ ] Generate routes for running, reviewing, and retrying workflows.
- [ ] Integrate analytics and billing/metering hooks behind optional checks.
- [ ] Add smoke coverage for the AI SaaS template with the AI add-on enabled.

## Decisions

- 2026-05-07: Keep provider-specific code isolated behind a generated facade so
  founders can replace SDK details without rewriting the product surface.

## Verification

- Planning review only. Future verification should include generated source
  tests and a documented path for mocking provider calls.

## Handoff

This would make the `ai-saas` template materially different from `saas-core`
and give AI founders a real starting workflow rather than marketing copy.
