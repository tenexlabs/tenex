# Plan: Make Add Command Transactional

Status: Backlog

Priority: P0

Type: fix

Owner: Agent

Created: 2026-05-07

## Goal

Ensure `tenex add` does not leave projects in partially mutated states when
generated-file conflicts, patch failures, package installs, or add-on writes
fail.

## Context

- Reliability guidance: `docs/RELIABILITY.md`
- Generated app contract: `docs/product-specs/generated-app-contract.md`
- Add command: `src/commands/add.ts`
- Generated file safety: `src/lib/generated-files.ts`
- Add-on orchestration: `src/addons/catalog.ts`
- Template application: `src/templates.ts`

Audit findings:

- `cmdAdd` writes `tenex.json` before template/add-on conflict checks finish.
- Package installation runs before all add-on generated files are written, so a
  later file conflict can leave dependencies installed and manifest state
  changed.
- The current generated-file conflict checks are scoped to each writer, not to
  the whole command plan.

## Acceptance Criteria

- `tenex add` preflights all predictable generated-file and patch conflicts
  before changing `tenex.json` or installing packages.
- If a non-preflightable step fails, the command reports exactly what was
  changed and what the user should do next.
- Manifest writes happen after validation and conflict preflight, or rollback is
  implemented for manifest-only failures.
- Tests cover a conflicting generated file and prove `tenex.json` remains
  unchanged.

## Steps

- [ ] Inventory generated files and patches for each add-on before applying
      command mutations.
- [ ] Introduce a command-level preflight step for template files and enabled
      add-on files.
- [ ] Reorder `cmdAdd` so manifest writes and dependency installation happen
      after preflight succeeds.
- [ ] Add recovery-oriented error messages for failures that cannot be fully
      preflighted.
- [ ] Add regression tests for conflict handling and unchanged manifest state.

## Decisions

- 2026-05-07: Treat package-install rollback as optional; preventing predictable
  conflicts before installation gives most of the reliability value.

## Verification

- Audit command: `npm run check` passed on 2026-05-07.
- Audit review: traced `src/commands/add.ts`, `src/templates.ts`, and add-on
  writers.
- Future verification should include a conflict fixture plus `npm run check`.

## Handoff

No code was changed for this backlog item during the audit. This should be
handled before expanding the add-on catalog.
