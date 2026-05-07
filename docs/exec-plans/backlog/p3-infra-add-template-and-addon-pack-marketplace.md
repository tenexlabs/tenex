# Plan: Add Template And Addon Pack Marketplace

Status: Backlog

Priority: P3

Type: infra

Owner: Agent

Created: 2026-05-07

## Goal

Support installable template and add-on packs so Tenex can grow beyond its
built-in SaaS, AI SaaS, waitlist, and first-party add-on catalog without
hard-coding every product surface in this repository.

## Context

- Product sense: `docs/PRODUCT_SENSE.md`
- Architecture map: `ARCHITECTURE.md`
- Add-on contract: `ARCHITECTURE.md`
- Template descriptors: `src/templates.ts`
- Add-on catalog: `src/addons/catalog.ts`
- Manifest model: `src/lib/tenex-config.ts`

Audit findings:

- Templates and add-ons are compiled directly into the CLI.
- The current architecture is easy to understand but will not scale cleanly if
  every provider and vertical template lands in `src/templates.ts` or
  `src/addons/`.
- The generated file helper contract is generic enough to support external
  packs if pack metadata and safety rules are defined.

## Acceptance Criteria

- Tenex can list built-in packs and locally installed packs.
- A pack can provide template descriptors, generated files, package
  requirements, env requirements, and post-apply instructions through a stable
  interface.
- Pack-generated files use the same managed-file and conflict rules as built-in
  scaffolds.
- The manifest records pack identity and version so future upgrades can reason
  about generated output.
- Documentation explains how first-party and third-party packs are reviewed,
  trusted, and tested.

## Steps

- [ ] Define a minimal pack manifest and runtime API.
- [ ] Refactor built-in templates/add-ons behind the same internal interface.
- [ ] Add commands for listing and selecting packs.
- [ ] Add local path support before remote package installation.
- [ ] Add verification fixtures for a sample external pack.
- [ ] Document security boundaries and support expectations.

## Decisions

- 2026-05-07: Start with local and first-party pack support before remote
  marketplace discovery, because generated code execution and package
  installation need a clear trust model.

## Verification

- Planning review only. Future verification should include sample pack tests,
  conflict tests, and `npm run check`.

## Handoff

This feature can make Tenex extensible without turning the core CLI into a large
collection of unrelated vertical starters.
