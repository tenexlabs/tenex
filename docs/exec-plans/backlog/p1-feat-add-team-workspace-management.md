# Plan: Add Team Workspace Management

Status: Backlog

Priority: P1

Type: feat

Owner: Agent

Created: 2026-05-07

## Goal

Turn the teams add-on into a full organization workspace experience with team
creation, invites, member roles, seat-aware billing hooks, and workspace
settings.

## Context

- Teams add-on: `src/addons/teams.ts`
- Better Auth local install: `src/addons/better-auth-local.ts`
- Auth client source: `src/addons/auth.ts`
- Billing add-on: `src/addons/billing.ts`
- Templates: `src/templates.ts`

Audit findings:

- Teams currently adds the Better Auth organization server plugin and writes a
  tiny client metadata file.
- The generated auth client does not yet include an organization client plugin;
  that correctness gap is tracked separately.
- There is no generated organization switcher, invite flow, member list, or
  workspace settings page.

## Acceptance Criteria

- Teams add-on generates organization-aware client helpers and route guards.
- Generated UI includes workspace creation, organization switcher, invite
  members, accept invite, member list, role changes, and workspace settings.
- Billing integration can expose seat count or team plan metadata when billing
  is enabled.
- Admin and RBAC add-ons can reuse team membership context without duplicating
  organization logic.
- Tests cover generated files, auth plugin alignment, route links, and
  idempotency.

## Steps

- [ ] Fix auth client/server plugin alignment for organization support.
- [ ] Define generated team workspace helper APIs.
- [ ] Generate routes and components for organization management.
- [ ] Integrate optional billing and RBAC behavior.
- [ ] Update navigation and dashboard surfaces when teams are enabled.
- [ ] Add smoke coverage for teams-only and teams-plus-billing projects.

## Decisions

- 2026-05-07: Teams should become a user-visible workflow, not only a Better
  Auth plugin toggle.

## Verification

- Planning review only. Future verification should include generated-source
  tests and add-on order permutation tests.

## Handoff

This would make B2B SaaS scaffolds substantially more credible because team
workspaces are core to many founder products.
