# Plan: Add Dry Run And Diff Preview

Status: Backlog

Priority: P1

Type: dx

Owner: Agent

Created: 2026-05-07

## Goal

Add a dry-run and diff preview mode so users can see exactly which files,
packages, env vars, and commands Tenex will touch before scaffolding or adding a
feature.

## Context

- Reliability guidance: `docs/RELIABILITY.md`
- Generated app contract: `docs/product-specs/generated-app-contract.md`
- New command: `src/commands/new.ts`
- Add command: `src/commands/add.ts`
- Generated file helpers: `src/lib/generated-files.ts`
- Add-on catalog: `src/addons/catalog.ts`

Audit findings:

- `tenex add` and `tenex new` execute package installs and writes directly after
  selections are resolved.
- Conflict checking exists at writer boundaries, but there is no user-visible
  preview of the whole operation.
- Add-ons already expose package lists and generated files internally, which can
  become the basis for an operation plan.

## Acceptance Criteria

- `tenex add <addon> --dry-run` prints planned manifest changes, generated file
  paths, patches, package commands, and env requirements without mutating the
  project.
- `tenex new --dry-run` previews project name, template, package manager,
  add-ons, packages, and generated Tenex-managed surfaces.
- Dry-run output distinguishes safe overwrites, unmanaged conflicts, and
  patch-required files.
- A machine-readable output option exists for agents and CI, such as
  `--json`.
- Tests prove dry-run mode leaves the filesystem unchanged.

## Steps

- [ ] Introduce an operation-plan type that can represent writes, patches,
      package installs, env requirements, and follow-up commands.
- [ ] Refactor template and add-on modules to expose planned files before
      applying them.
- [ ] Add CLI rendering for human and JSON output.
- [ ] Add dry-run support to `new` and `add`, then consider `deploy`.
- [ ] Add mutation-safety tests using temp projects.
- [ ] Update CLI docs and generated references.

## Decisions

- 2026-05-07: Start with previewing deterministic filesystem/package work. Live
  provider actions can remain summarized until provider setup flows are richer.

## Verification

- Planning review only. Future verification should include focused dry-run tests
  plus `npm run check`.

## Handoff

This feature improves trust immediately and also lays groundwork for safer
transactionality, upgrades, and agent-driven changes.
