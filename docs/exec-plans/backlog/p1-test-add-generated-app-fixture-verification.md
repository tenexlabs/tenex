# Plan: Add Generated App Fixture Verification

Status: Backlog

Priority: P1

Type: test

Owner: Agent

Created: 2026-05-07

## Goal

Verify that generated TanStack Start and Convex app surfaces stay buildable and
usable across templates, add-ons, and provider combinations.

## Context

- Generated app contract: `docs/product-specs/generated-app-contract.md`
- Frontend/design guidance: `docs/DESIGN.md`, `docs/FRONTEND.md`
- Templates: `src/templates.ts`
- Add-ons: `src/addons/`
- Smoke tests: `src/test/smoke.ts`
- Quality score: `docs/QUALITY_SCORE.md`

Audit findings:

- Generated app behavior is mostly tested by reading generated source files and
  checking for expected substrings.
- The largest generated surfaces are string templates, including admin routes
  and founder UI, but there is no fixture that compiles representative generated
  apps.
- Existing docs already call out the unresolved question of generated-app visual
  regression testing. The current repository boundary is now documented in
  `docs/product-specs/generated-app-contract.md`: visual regression belongs in
  downstream generated-app fixture suites unless those fixtures become a
  maintained local target.

## Acceptance Criteria

- Representative generated app fixtures are created or synthesized for each
  template and key add-on bundle.
- Generated TypeScript/TSX is checked for syntax and route/import consistency.
- At least one full "all add-ons" fixture verifies auth, admin, storage,
  billing, email, analytics, and teams source generation together.
- The test strategy is documented, including what is intentionally not covered
  because it requires external Convex/provider services.
- Optional visual checks follow the documented downstream-fixture boundary, or
  this plan records why the boundary changed.

## Steps

- [ ] Decide whether fixtures should be checked in, generated during tests, or
      synthesized into temp directories.
- [ ] Add generated-app syntax/type checks that do not require live provider
      credentials.
- [ ] Add template/add-on matrix coverage for the highest-risk combinations.
- [ ] Evaluate Playwright or screenshot-based validation for generated UI
      surfaces and record the decision.
- [ ] Update `docs/QUALITY_SCORE.md` after the fixture strategy lands.

## Decisions

- 2026-05-07: Keep this in backlog as a quality investment because the current
  smoke test passes but cannot prove generated apps compile or render.
- 2026-05-07: Keep browser screenshot baselines out of the core CLI repository
  until generated app fixtures are maintained locally; put visual regression in
  downstream fixtures that run packaged Tenex output.

## Verification

- Audit command: `npm run check` passed on 2026-05-07.
- Audit review: inspected generated string templates and current smoke
  assertions.
- Future verification should include the generated fixture suite plus
  `npm run check`.

## Handoff

No code was changed for this backlog item during the audit. This plan should be
pulled forward before major generated UI or add-on expansion.
