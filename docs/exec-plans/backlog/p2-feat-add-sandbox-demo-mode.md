# Plan: Add Sandbox Demo Mode

Status: Backlog

Priority: P2

Type: feat

Owner: Agent

Created: 2026-05-07

## Goal

Generate a sandbox demo mode that lets founders and prospects explore realistic
product workflows without connecting production providers or polluting real
data.

## Context

- Product intent: `docs/PRODUCT_SENSE.md`
- Templates: `src/templates.ts`
- Demo data plan:
  `docs/exec-plans/backlog/p3-dx-add-demo-data-and-preview-gallery.md`
- Doctor command: `src/commands/doctor.ts`

Audit findings:

- Tenex templates include polished placeholder surfaces, but founders need a
  safe demo environment for sales, investor updates, and internal review.
- Demo behavior must be clearly separated from production data and provider
  side effects.
- Existing add-ons can expose safe sandbox variants for billing, email,
  analytics, AI, and storage workflows.

## Acceptance Criteria

- Tenex supports a sandbox mode option in `tenex new` and `tenex add sandbox`.
- Generated apps include a visible sandbox indicator, seeded demo records, and
  reset controls.
- Provider side effects are disabled or routed to test-mode adapters while
  sandbox mode is active.
- `tenex doctor` identifies sandbox mode and warns before deploy if unsafe
  defaults remain enabled.
- Tests cover sandbox manifest state, generated seed data, route patches, and
  provider safety guards.

## Steps

- [ ] Add sandbox manifest fields and template prompts.
- [ ] Generate demo data helpers and reset actions.
- [ ] Add provider-safe sandbox adapters for relevant add-ons.
- [ ] Patch generated shell with sandbox indicators.
- [ ] Add doctor/deploy checks for sandbox state.

## Decisions

- 2026-05-07: Sandbox mode must be explicit and visible so founders do not
  confuse demo data with production readiness.

## Verification

- Planning review only. Future verification should include provider-side-effect
  guard tests.

## Handoff

This gives founders a stronger way to demonstrate the product immediately after
scaffolding.
