# Plan: Clean Build And Package Contents

Status: Backlog

Priority: P0

Type: infra

Owner: Agent

Created: 2026-05-07

## Goal

Prevent stale ignored `dist/` files from shipping in the npm package and make
publish validation part of normal verification.

## Context

- Package metadata: `package.json`
- Build config: `tsconfig.json`
- Git ignore rules: `.gitignore`
- CI workflow: `.github/workflows/ci.yml`
- Generated references: `docs/generated/cli-surface.md`

Audit findings:

- `dist/` is ignored, and `tsc -p tsconfig.json` does not clean `outDir`.
- `npm pack --dry-run` includes stale files from old source paths, including
  `dist/commands/addAuth.js`, `dist/lib/projectName.js`, and other artifacts not
  represented by current `src/`.
- `prepublishOnly` only runs `npm run build`, so a publish can include stale
  output even after a successful build.

## Acceptance Criteria

- Build or prepublish flow removes stale `dist/` output before compiling.
- `npm pack --dry-run` only lists files that correspond to the current source
  tree plus required package metadata.
- CI or `npm run check` includes a package-content validation step.
- The package excludes test-only build artifacts unless intentionally shipped.
- Generated docs reflect any script or package-surface changes.

## Steps

- [ ] Add a clean step for `dist/` before `npm run build` or introduce a
      dedicated `clean` script used by build/prepublish.
- [ ] Add a package-content check, likely based on `npm pack --dry-run`, to CI or
      `npm run check`.
- [ ] Decide whether `dist/test/smoke.js` should be published; exclude it if it
      is not part of the public package.
- [ ] Re-run `npm pack --dry-run` and record the expected file list.
- [ ] Regenerate `docs/generated/cli-surface.md` if package scripts change.

## Decisions

- 2026-05-07: Treat this as a release-quality backlog item because local checks
  can pass while the published artifact contains stale code.

## Verification

- Audit command: `npm run check` passed on 2026-05-07.
- Audit command: `npm pack --dry-run` showed stale `dist/` entries on
  2026-05-07.
- Future verification should include `npm run check` and `npm pack --dry-run`.

## Handoff

No code was changed for this backlog item during the audit. This should be
prioritized before the next npm publish.
