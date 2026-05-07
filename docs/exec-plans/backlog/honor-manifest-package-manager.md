# Plan: Honor Manifest Package Manager

Status: Backlog

Owner: Agent

Created: 2026-05-07

## Goal

Make project commands consistently use `tenex.json` as the source of truth for
package-manager selection while still detecting helpful lockfile mismatches.

## Context

- CLI spec state contract: `docs/product-specs/tenex-cli.md`
- Package manager helpers: `src/lib/package-manager.ts`
- Commands: `src/commands/add.ts`, `src/commands/dev.ts`,
  `src/commands/deploy.ts`, `src/commands/doctor.ts`
- Manifest model: `src/lib/tenex-config.ts`

Audit findings:

- The CLI spec says commands should read and update `tenex.json` instead of
  guessing project state.
- `tenex add`, `tenex dev`, `tenex deploy`, and doctor health inspection use
  lockfile detection instead of `manifest.packageManager`.
- `InstallPackage.exact` is only honored for npm; pnpm, yarn, and bun installs
  currently ignore exact-save intent for pinned packages such as Better Auth.

## Acceptance Criteria

- Commands prefer `manifest.packageManager` for generated Tenex projects.
- Lockfile detection is used as a fallback only when no manifest is available,
  or as a mismatch warning with actionable text.
- Exact dependency intent is honored for npm, pnpm, yarn, and bun where the
  package manager supports it.
- Tests cover manifest-vs-lockfile mismatch behavior and exact dependency
  command rendering.

## Steps

- [ ] Add a helper that reads the manifest package manager with lockfile
      mismatch detection.
- [ ] Update `add`, `dev`, `deploy`, and doctor health inspection to use the new
      helper.
- [ ] Update package-manager install rendering for exact dependencies across
      supported package managers.
- [ ] Add focused package-manager and command tests.
- [ ] Update generated docs if command behavior or scripts change.

## Decisions

- 2026-05-07: Preserve lockfile detection as a fallback because `tenex add auth`
  can still operate on projects before a manifest exists.

## Verification

- Audit command: `npm run check` passed on 2026-05-07.
- Audit review: compared package-manager use against the CLI spec.
- Future verification should include focused tests plus `npm run check`.

## Handoff

No code was changed for this backlog item during the audit. This should be
handled before adding more package-manager-specific behavior.
