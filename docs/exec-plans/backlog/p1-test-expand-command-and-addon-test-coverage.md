# Plan: Expand Command And Addon Test Coverage

Status: Backlog

Priority: P1

Type: test

Owner: Agent

Created: 2026-05-07

## Goal

Move beyond smoke-only coverage so command parsing, provider validation,
package-manager behavior, generated-file safety, and add-on permutations have
focused regression tests.

## Context

- Quality score: `docs/QUALITY_SCORE.md`
- Code standards testing guidance: `docs/CODE_STANDARDS.md`
- Smoke tests: `src/test/smoke.ts`
- Argument parser: `src/lib/args.ts`
- Package manager helpers: `src/lib/package-manager.ts`
- Add-on catalog: `src/addons/catalog.ts`
- Generated file safety: `src/lib/generated-files.ts`

Audit findings:

- `src/test/smoke.ts` covers representative generated output but not command
  parser edge cases, invalid `tenex add` providers, package-manager command
  rendering, doctor/deploy behavior, or many add-on ordering permutations.
- `docs/QUALITY_SCORE.md` already flags parser and provider-specific regression
  gaps; the code audit confirmed those gaps still matter.

## Acceptance Criteria

- Add a lightweight test structure that can run focused unit-style tests without
  replacing the existing smoke test.
- Parser tests cover long flags, short flags, `--flag=value`, `--`, missing
  values, and positional arguments.
- Package-manager tests cover create/install/exec/run commands for npm, pnpm,
  yarn, and bun, including exact dependency handling.
- Command/add-on tests cover invalid providers, disabled providers, add-on
  ordering, generated-file conflicts, and manifest preservation.
- `npm test` or `npm run check` runs the expanded suite.

## Steps

- [ ] Choose a minimal test runner strategy compatible with the current
      TypeScript build, or keep executable test modules if that fits the repo.
- [ ] Split existing smoke coverage into named checks without losing current
      assertions.
- [ ] Add focused tests for parser and package-manager helpers.
- [ ] Add command-level tests using temp project fixtures and dependency/process
      seams where needed.
- [ ] Add add-on permutation tests for local Better Auth, admin, billing,
      email, storage, analytics, and teams.

## Decisions

- 2026-05-07: Keep this as a broad testing plan because several other backlog
  tasks need the same harness improvements.

## Verification

- Audit command: `npm run check` passed on 2026-05-07.
- Audit review: inspected `src/test/smoke.ts` and helper modules.
- Future verification should include the expanded `npm test` suite and
  `npm run check`.

## Handoff

No code was changed for this backlog item during the audit. This is an enabler
for safely fixing the more specific backlog items.
