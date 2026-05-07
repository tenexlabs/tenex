# Plan: Define Addon Disable And Cleanup Semantics

Status: Backlog

Owner: Agent

Created: 2026-05-07

## Goal

Clarify and implement what happens when a user runs `tenex add <addon>` with a
`none` provider after that add-on was previously enabled.

## Context

- Product principle: `docs/PRODUCT_SENSE.md`
- CLI spec: `docs/product-specs/tenex-cli.md`
- Add command: `src/commands/add.ts`
- Add-on catalog: `src/addons/catalog.ts`
- Template metadata: `src/templates.ts`
- Project README generation: `src/lib/project-readme.ts`

Audit findings:

- Provider `none` updates manifest-driven UI state, but generated add-on files,
  routes, Convex component imports, and package dependencies can remain from
  previous runs.
- Current behavior may be acceptable as "disable in manifest only," but the CLI
  output says the add-on was disabled without explaining remaining files or
  manual cleanup.
- There is no documented policy for safe removal of managed files or dependency
  cleanup.

## Acceptance Criteria

- The repo documents whether disabling an add-on is manifest-only, generated
  file cleanup, dependency cleanup, or a staged/manual process.
- CLI output makes the chosen behavior clear.
- If Tenex removes managed add-on files, it only removes files that are still
  safely identifiable as managed Tenex output.
- Tests cover disabling previously enabled add-ons and resulting manifest,
  generated files, routes, and README output.

## Steps

- [ ] Decide the product policy for disabling add-ons.
- [ ] Update docs and command copy to match the policy.
- [ ] Implement safe cleanup or explicit manual cleanup guidance.
- [ ] Add tests for enable-then-disable flows.
- [ ] Update generated references if command behavior changes.

## Decisions

- 2026-05-07: Keep this in backlog because the current additive behavior is not
  immediately unsafe, but it will confuse users as add-ons become richer.

## Verification

- Audit command: `npm run check` passed on 2026-05-07.
- Audit review: traced provider `none` handling in command and add-on modules.
- Future verification should include enable/disable tests plus `npm run check`.

## Handoff

No code was changed for this backlog item during the audit. This should be
resolved before advertising add-ons as reversible.
