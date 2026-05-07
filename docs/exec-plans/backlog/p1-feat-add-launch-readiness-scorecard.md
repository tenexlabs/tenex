# Plan: Add Launch Readiness Scorecard

Status: Backlog

Priority: P1

Type: feat

Owner: Agent

Created: 2026-05-07

## Goal

Generate a launch readiness scorecard that turns scaffold setup, provider
configuration, and product completeness into an actionable founder checklist.

## Context

- Product intent: `docs/PRODUCT_SENSE.md`
- Design guidance: `docs/DESIGN.md`
- Doctor command: `src/commands/doctor.ts`
- Deploy command: `src/commands/deploy.ts`
- Generated app contract: `docs/product-specs/generated-app-contract.md`

Audit findings:

- `tenex doctor` validates setup, but founders also need product-readiness
  guidance inside the generated app.
- Current generated surfaces can look complete before billing, email, analytics,
  admin, and deployment prerequisites are actually ready.
- A scorecard would connect CLI validation with founder-facing next actions.

## Acceptance Criteria

- Generated apps include a launch readiness route with setup status, product
  content status, provider status, and deployment status.
- `tenex doctor` and `tenex deploy` can emit machine-readable readiness data
  that the generated app can display or document.
- Scorecard checks cover auth, env vars, billing, email, analytics, storage,
  admin access, legal pages, and production deployment prerequisites.
- Empty or incomplete items include concrete remediation steps.
- Tests cover generated route links, status data shape, and add-on-aware
  readiness sections.

## Steps

- [ ] Define readiness check categories and output shape.
- [ ] Add generated scorecard route and dashboard card.
- [ ] Extend doctor/deploy handoff output with scorecard data.
- [ ] Add add-on-specific readiness checks.
- [ ] Add smoke tests for generated scorecard files and links.

## Decisions

- 2026-05-07: Keep the scorecard advisory. It should guide launch decisions
  without blocking local development.

## Verification

- Planning review only. Future verification should include generated app smoke
  tests and `tenex doctor` output snapshots.

## Handoff

This makes Tenex more useful after scaffolding by telling founders what remains
before a credible launch.
