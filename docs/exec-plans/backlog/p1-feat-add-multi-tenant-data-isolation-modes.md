# Plan: Add Multi Tenant Data Isolation Modes

Status: Backlog

Priority: P1

Type: feat

Owner: Agent

Created: 2026-05-07

## Goal

Generate explicit multi-tenant data isolation modes so founders can choose
personal, workspace, account, or enterprise-scoped data boundaries.

## Context

- Product intent: `docs/PRODUCT_SENSE.md`
- Teams plan:
  `docs/exec-plans/backlog/p1-feat-add-team-workspace-management.md`
- RBAC plan:
  `docs/exec-plans/backlog/p2-feat-add-rbac-permissions-addon.md`
- Convex schema generation: `src/templates.ts`

Audit findings:

- Teams and RBAC define access concepts, but generated data models still need a
  clear tenancy convention across resources.
- Early architectural mistakes in tenant scoping are expensive to fix after
  customer data exists.
- Tenex can generate schema helpers, indexes, and route guards that make tenant
  boundaries obvious.

## Acceptance Criteria

- Tenex supports a tenancy selection during `tenex new` and `tenex add tenancy`.
- Generated code includes tenant-aware schema helpers, query filters, mutation
  guards, route context, and testing fixtures.
- Supported modes include user-owned, workspace-owned, account-owned, and
  hybrid public/private resources.
- Add-ons can declare tenant scope requirements and receive generated helpers.
- Doctor or smoke tests detect add-on resources that lack tenant filters.
- Tests cover generated helper usage, route context, and representative add-on
  schemas.

## Steps

- [ ] Define tenancy manifest schema and prompts.
- [ ] Generate tenant context helpers and Convex guard helpers.
- [ ] Patch templates and add-ons to declare tenant ownership.
- [ ] Add static checks or smoke assertions for tenant-filtered queries.
- [ ] Document migration paths between simple and workspace tenancy.

## Decisions

- 2026-05-07: Make tenancy explicit at generation time instead of inferring it
  from whether the teams add-on is enabled.

## Verification

- Planning review only. Future verification should include generated query guard
  tests.

## Handoff

This would raise the architectural quality of generated apps before founders
handle sensitive customer data.
