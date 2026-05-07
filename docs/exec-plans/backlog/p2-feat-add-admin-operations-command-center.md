# Plan: Add Admin Operations Command Center

Status: Backlog

Priority: P2

Type: feat

Owner: Agent

Created: 2026-05-07

## Goal

Evolve the admin panel into a complete operations command center for users,
teams, billing, support, feature flags, provider health, audit logs, and launch
readiness.

## Context

- Admin add-on: `src/addons/admin.ts`
- Security guidance: `docs/SECURITY.md`
- Generated app contract: `docs/product-specs/generated-app-contract.md`
- Existing admin hardening backlog:
  `docs/exec-plans/backlog/p0-fix-harden-admin-bootstrap-and-access-control.md`

Audit findings:

- The admin add-on is the richest generated surface in the repo, with setup,
  workspace config, user/session lists, activity, and role utilities.
- Existing backlog work correctly focuses on securing bootstrap and access
  control before production use.
- Once hardened, admin can become the integration point for many future
  add-ons.

## Acceptance Criteria

- Admin command center has modular sections for users, sessions, teams, billing,
  support, flags, storage, analytics, env/provider health, and audit activity.
- Sections appear only when corresponding add-ons are enabled.
- Admin mutations enforce server-side authorization for every sensitive action.
- Generated UI supports search, filtering, status badges, empty states, and
  clear operational next actions.
- Tests cover section gating, authorization-sensitive generated code, and
  add-on combinations.

## Steps

- [ ] Complete the existing admin security hardening plan first.
- [ ] Extract admin UI generation into smaller module sections.
- [ ] Define a section registry that add-ons can contribute to.
- [ ] Add provider health cards from doctor/env metadata.
- [ ] Add user/team/billing/support/flags sections as those add-ons mature.
- [ ] Add generated-source tests for section visibility and access checks.

## Decisions

- 2026-05-07: Treat admin as the operations hub for generated apps, but keep it
  modular so users can delete or customize individual sections.

## Verification

- Planning review only. Future verification should include security review and
  generated app fixture tests.

## Handoff

This feature compounds the value of every other add-on by giving founders one
place to operate the generated product.
