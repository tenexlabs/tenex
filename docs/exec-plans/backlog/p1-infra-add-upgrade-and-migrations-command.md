# Plan: Add Upgrade And Migrations Command

Status: Backlog

Priority: P1

Type: infra

Owner: Agent

Created: 2026-05-07

## Goal

Add `tenex upgrade` so existing generated apps can adopt newer Tenex templates,
manifest schemas, add-on scaffolds, and generated fixes without rebuilding from
scratch.

## Context

- CLI spec: `docs/product-specs/tenex-cli.md`
- Generated app contract: `docs/product-specs/generated-app-contract.md`
- Manifest model: `src/lib/tenex-config.ts`
- Generated file marker: `src/lib/generated-files.ts`
- Templates: `src/templates.ts`
- Add-ons: `src/addons/`

Audit findings:

- The manifest has `version: 1`, but there is no migration registry or upgrade
  command.
- Managed files can be overwritten when their marker is present, but there is no
  scaffold version or change tracking inside generated files.
- Existing backlog work will create fixes that generated app users need a safe
  path to receive.

## Acceptance Criteria

- `tenex upgrade` detects the current Tenex manifest version, CLI package
  version, enabled add-ons, and generated file ownership state.
- The command runs named migrations with clear descriptions and a preview before
  applying changes.
- Managed generated files can be refreshed while user-modified unmanaged files
  are preserved or reported as conflicts.
- The command can update manifest schema versions with rollback-safe behavior.
- Tests cover no-op upgrade, manifest migration, managed file refresh, and
  unmanaged conflict reporting.

## Steps

- [ ] Define scaffold version metadata for `tenex.json` and generated files.
- [ ] Add a migration registry with idempotent migration functions.
- [ ] Build `cmdUpgrade` and route it through `src/cli.ts`.
- [ ] Reuse dry-run output when available, or add a minimal preview path first.
- [ ] Add tests for migration ordering and conflict handling.
- [ ] Update README, CLI spec, and generated docs.

## Decisions

- 2026-05-07: Make upgrades opt-in and explicit because Tenex-generated code is
  meant to be user-owned after scaffolding.

## Verification

- Planning review only. Future verification should include migration unit tests,
  smoke tests, and `npm run check`.

## Handoff

This is a high-leverage retention feature. It turns Tenex from a one-time
starter into a long-lived scaffold companion.
