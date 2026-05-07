# Plan: Clean Build And Package Contents

Status: Completed

Priority: P0

Type: infra

Owner: Agent

Created: 2026-05-07

Completed: 2026-05-07

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

- `dist/` is ignored, and `tsc -p tsconfig.json` did not clean `outDir`.
- `npm pack --dry-run` included stale files from old source paths, including
  `dist/commands/addAuth.js`, `dist/lib/projectName.js`, and other artifacts not
  represented by current `src/`.
- `prepublishOnly` only ran `npm run build`, so a publish could include stale
  output even after a successful build.

## Acceptance Criteria

- Build or prepublish flow removes stale `dist/` output before compiling.
- `npm pack --dry-run` only lists files that correspond to the current source
  tree plus required package metadata.
- CI or `npm run check` includes a package-content validation step.
- The package excludes test-only build artifacts unless intentionally shipped.
- Generated docs reflect any script or package-surface changes.

## Steps

- [x] Add a clean step for `dist/` before `npm run build`.
- [x] Add package-content validation through `npm run pack:check`, included in
      `npm run check`.
- [x] Exclude `dist/test/smoke.js` from the public package by listing
      production `dist/` paths explicitly in `package.json`.
- [x] Re-run package validation and inspect the dry-run file list.
- [x] Regenerate `docs/generated/cli-surface.md`.

## Decisions

- 2026-05-07: Treat this as a release-quality item because local checks can pass
  while the published artifact contains stale code.
- 2026-05-07: Use `scripts/clean-dist.mjs` instead of a shell `rm` command so
  the build clean step stays portable.
- 2026-05-07: Keep `dist/test/` out of the npm package; tests are local
  verification artifacts, not runtime CLI files.

## Verification

- `npm run check` passed on 2026-05-07.
- `npm pack --dry-run --cache /tmp/tenex-npm-cache` listed 34 package files:
  current production `dist/` outputs, `package.json`, `README.md`, `LICENSE`,
  and `tsconfig.json`.
- The dry-run package list no longer includes stale outputs such as
  `dist/commands/addAuth.js` or test-only output such as `dist/test/smoke.js`.

## Handoff

Completed. The build cleans `dist/`, the full check validates package contents,
and publish now runs the full check through `prepublishOnly`.
