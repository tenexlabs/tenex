# Plan: Add CRUD Resource Generator

Status: Backlog

Priority: P1

Type: feat

Owner: Agent

Created: 2026-05-07

## Goal

Add `tenex add resource` to generate a Convex-backed domain entity with schema,
queries, mutations, routes, forms, tables, empty states, and dashboard links.

## Context

- Generated app contract: `docs/product-specs/generated-app-contract.md`
- Frontend guidance: `docs/FRONTEND.md`
- CLI routing: `src/cli.ts`
- Add command: `src/commands/add.ts`
- Templates: `src/templates.ts`
- Admin schema patching example: `src/addons/admin.ts`

Audit findings:

- Tenex scaffolds product shell routes but not the founder's first real domain
  object.
- Convex schema patching exists for admin tables, but there is no reusable
  domain model generator.
- The generated app has `AppShell`, navigation, and route conventions that a
  resource generator can reuse.

## Acceptance Criteria

- Users can run a command such as
  `tenex add resource project --fields name:string,status:select,dueDate:number`.
- Tenex patches Convex schema and generates typed queries/mutations for list,
  create, update, archive, and detail operations.
- Generated routes include list, create/edit form, detail view, empty state, and
  protected access.
- Generated navigation and dashboard cards reference the new resource without
  duplicating links on re-run.
- Tests cover schema patching, generated source, idempotency, invalid field
  definitions, and conflict handling.

## Steps

- [ ] Define a small field DSL and validation rules.
- [ ] Add resource command routing and prompt support for interactive mode.
- [ ] Build schema patch helpers that can add tables and indexes safely.
- [ ] Generate Convex functions and TanStack routes from the field model.
- [ ] Patch navigation/dashboard surfaces idempotently.
- [ ] Add smoke tests for at least one generated resource.

## Decisions

- 2026-05-07: Keep the first version CRUD-oriented instead of modeling every
  relationship pattern. The generator should create obvious code founders can
  edit.

## Verification

- Planning review only. Future verification should include generated app syntax
  checks once fixture verification exists.

## Handoff

This is one of the clearest paths to "100x better" because it moves Tenex from
product shell generation to first-feature generation.
