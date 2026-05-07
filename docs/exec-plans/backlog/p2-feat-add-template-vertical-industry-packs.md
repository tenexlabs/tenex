# Plan: Add Template Vertical Industry Packs

Status: Backlog

Priority: P2

Type: feat

Owner: Agent

Created: 2026-05-07

## Goal

Generate vertical industry packs that adapt templates, copy, starter data, and
workflows for specific founder markets such as agencies, clinics, education,
marketplaces, internal tools, and developer tools.

## Context

- Product intent: `docs/PRODUCT_SENSE.md`
- Product blueprint plan:
  `docs/exec-plans/backlog/p1-feat-add-product-blueprint-wizard.md`
- Marketplace plan:
  `docs/exec-plans/backlog/p2-infra-add-template-and-addon-pack-marketplace.md`
- Templates: `src/templates.ts`

Audit findings:

- Current templates are horizontal and require founders to translate generic
  SaaS surfaces into their domain.
- The product blueprint plan customizes one scaffold, while vertical packs can
  provide curated domain defaults.
- Tenex can become more valuable by generating product-shaped workflows instead
  of only infrastructure-shaped add-ons.

## Acceptance Criteria

- Tenex supports a vertical pack choice during `tenex new`.
- Initial packs define domain copy, nav labels, starter entities, dashboard
  metrics, onboarding steps, and recommended add-ons.
- Packs remain explicit generated code and can be edited after scaffolding.
- Pack metadata is documented and compatible with future external pack
  marketplace support.
- Tests cover pack selection, generated file differences, manifest state, and
  idempotency.

## Steps

- [ ] Define vertical pack metadata shape.
- [ ] Add prompts and CLI flags for pack selection.
- [ ] Implement starter packs for two or three high-value founder categories.
- [ ] Patch template generation to consume pack copy and workflow defaults.
- [ ] Add smoke tests for pack-specific generated output.

## Decisions

- 2026-05-07: Keep packs as curated presets over existing Tenex templates, not
  wholly separate template forks.

## Verification

- Planning review only. Future verification should include generated output
  snapshots for each starter pack.

## Handoff

This would make Tenex feel dramatically more tailored to a founder's actual
business.
