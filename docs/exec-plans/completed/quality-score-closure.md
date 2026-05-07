# Plan: Quality Score Closure

Status: Completed

Owner: Agent

Created: 2026-05-07

Completed: 2026-05-07

## Goal

Close the gaps listed in `docs/QUALITY_SCORE.md` with concrete repository
coverage, durable checks, and documentation so the quality score can honestly
report full marks.

## Context

- `docs/QUALITY_SCORE.md`
- `ARCHITECTURE.md`
- `docs/CODE_STANDARDS.md`
- `docs/PLANS.md`
- `docs/product-specs/tenex-cli.md`
- `src/test/smoke.ts`
- `scripts/check-agent-harness.mjs`

## Acceptance Criteria

- Command parser behavior used by non-interactive CLI flags has executable
  coverage.
- Provider-specific add-on generated files and package/env metadata have
  executable coverage.
- `src/lib/` dependency direction is enforced by a durable harness check.
- The generated-app visual regression decision is recorded in durable docs.
- `docs/QUALITY_SCORE.md` reports 100% / A+ / 10 out of 10 scores with no
  remaining current gaps, backed by the new coverage and checks.
- Narrow and full project verification pass or any failure is documented.

## Steps

- [x] Add parser coverage for non-interactive flag forms.
- [x] Expand smoke coverage for provider-specific add-on output and metadata.
- [x] Add a harness dependency-direction check for `src/lib/`.
- [x] Document the visual-regression testing boundary.
- [x] Refresh generated docs and update `docs/QUALITY_SCORE.md`.
- [x] Run verification and complete an evidence audit.

## Decisions

- 2026-05-07: Treat the quality-score update as a code-backed closure task, not
  a documentation-only score edit.
- 2026-05-07: Keep browser screenshot baselines in downstream generated-app
  fixture suites unless those fixtures become a maintained local target.

## Verification

- `npm run typecheck` passed after the smoke-suite changes.
- `npm test` passed after the smoke-suite changes.
- `npm run harness:check` passed after adding the `src/lib/` dependency
  direction rule.
- `npm run check` passed on 2026-05-07. It covered typecheck, smoke tests,
  Ultracite, harness checks, and package dry-run validation.

## Handoff

Completed. The scorecard now reports full marks with no current repository-owned
quality gaps, backed by executable coverage, harness checks, docs, and package
validation.
