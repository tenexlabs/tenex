# Plan: Add Demo Data And Preview Gallery

Status: Backlog

Priority: P3

Type: dx

Owner: Agent

Created: 2026-05-07

## Goal

Add demo data, seed commands, and a preview gallery so users can inspect and
compare generated templates/add-on combinations before or immediately after
scaffolding.

## Context

- Templates: `src/templates.ts`
- Smoke tests: `src/test/smoke.ts`
- Generated app contract: `docs/product-specs/generated-app-contract.md`
- Generated references: `docs/generated/source-inventory.md`

Audit findings:

- Template dashboards currently use static placeholder metrics.
- Smoke tests synthesize temp projects but do not produce user-facing preview
  fixtures.
- There is no local gallery that helps users choose among templates or validate
  add-on combinations visually.

## Acceptance Criteria

- Tenex can generate deterministic demo data for templates and enabled add-ons.
- A command or docs flow can build preview projects for representative template
  and add-on combinations.
- Generated apps can run in demo mode without real provider credentials where
  safe.
- Preview gallery output documents which add-ons are mocked, live, or disabled.
- Tests cover seed data generation and prove demo mode does not leak into
  production defaults.

## Steps

- [ ] Define demo-data fixtures for templates and core add-ons.
- [ ] Add generated seed functions or a `tenex seed` command.
- [ ] Add demo-mode config to generated apps with explicit opt-in behavior.
- [ ] Create a preview-gallery generation script or command.
- [ ] Integrate with generated-app fixture verification when that backlog item
      lands.
- [ ] Document demo mode and provider-mocking boundaries.

## Decisions

- 2026-05-07: Keep demo mode explicit. Generated production projects should not
  silently depend on sample data.

## Verification

- Planning review only. Future verification should include seed fixture tests
  and generated app preview checks.

## Handoff

This helps users evaluate Tenex faster and gives maintainers a practical visual
review path for generated surfaces.
