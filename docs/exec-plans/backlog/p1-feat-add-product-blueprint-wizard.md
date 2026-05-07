# Plan: Add Product Blueprint Wizard

Status: Backlog

Priority: P1

Type: feat

Owner: Agent

Created: 2026-05-07

## Goal

Add a product blueprint step to `tenex new` so founders can scaffold an app that
reflects their actual customer, offer, core workflow, metrics, and brand instead
of receiving only one of three hard-coded product shells.

## Context

- Product intent: `docs/PRODUCT_SENSE.md`
- CLI spec: `docs/product-specs/tenex-cli.md`
- Generated app contract: `docs/product-specs/generated-app-contract.md`
- New command: `src/commands/new.ts`
- Manifest model: `src/lib/tenex-config.ts`
- Template config: `src/templates.ts`

Audit findings:

- Template copy, brand names, milestones, metrics, and workflow steps are
  hard-coded in `templateConfig`.
- `tenex.json` only stores template, package manager, and add-on selections, so
  generated apps cannot preserve product-specific intent across re-runs.
- The generated app already reads from `src/lib/tenex.generated.ts`, which is a
  good insertion point for a richer product blueprint.

## Acceptance Criteria

- `tenex new` can collect or accept flags for product name, target customer,
  value proposition, primary entity, activation event, revenue model, and key
  success metrics.
- The blueprint is persisted in the manifest with a documented versioned schema.
- Generated landing, dashboard, onboarding, pricing, settings, and README copy
  consume blueprint values instead of relying only on template defaults.
- `--yes` mode has deterministic defaults, while interactive mode asks concise
  founder-friendly questions.
- Tests cover blueprint defaults, explicit flags, manifest persistence, and
  generated app output for at least two templates.

## Steps

- [ ] Design a manifest extension for product blueprint fields and migration
      behavior for existing version 1 manifests.
- [ ] Add interactive prompts and non-interactive flags to `cmdNew`.
- [ ] Refactor `templateConfig` so defaults can be merged with blueprint input.
- [ ] Update `tenexGeneratedSource`, project README, and deploy handoff output
      to include the product blueprint.
- [ ] Add smoke coverage for generated copy and metadata.
- [ ] Update product specs and generated docs if command flags or manifest shape
      change.

## Decisions

- 2026-05-07: Treat blueprint data as structured project state, not one-time
  prompt output, because future add-ons and upgrades should be able to reuse it.

## Verification

- Planning review only. Future verification should include `npm test`,
  `npm run harness:check`, and command-level tests for prompt/flag resolution.

## Handoff

This feature would make Tenex feel less like a starter picker and more like a
founder app generator. It should land before broadening template count, because
blueprints reduce the pressure to add many near-duplicate templates.
