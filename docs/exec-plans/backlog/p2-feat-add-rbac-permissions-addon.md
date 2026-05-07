# Plan: Add RBAC Permissions Addon

Status: Backlog

Priority: P2

Type: feat

Owner: Agent

Created: 2026-05-07

## Goal

Add a role-based access control add-on that gives generated apps explicit roles,
permissions, route guards, Convex authorization helpers, and admin management UI.

## Context

- Security guidance: `docs/SECURITY.md`
- Teams add-on: `src/addons/teams.ts`
- Admin add-on: `src/addons/admin.ts`
- Auth scaffold: `src/addons/auth.ts`
- Generated app contract: `docs/product-specs/generated-app-contract.md`

Audit findings:

- Admin currently depends on Better Auth roles and generated access checks, but
  there is no general permission model.
- Teams add-on only installs the organization plugin and a small client scaffold.
- Future CRM, support, file, and billing features will need more than
  authenticated/not-authenticated route gates.

## Acceptance Criteria

- Tenex supports an `rbac` add-on with roles, permissions, and membership scope
  documented in generated code.
- Generated Convex helpers enforce permission checks for server-side queries and
  mutations.
- Generated route helpers can guard pages based on permissions.
- Admin or team settings UI can assign roles and show effective permissions.
- Tests cover generated helper source, route usage, role normalization, and
  server-side deny paths where practical.

## Steps

- [ ] Define the first-party permission vocabulary and extension points.
- [ ] Add manifest support and generated config metadata.
- [ ] Generate Convex permission helpers and optional schema tables.
- [ ] Patch or generate UI for role assignment and permission review.
- [ ] Integrate with teams and admin add-ons without forcing both to be enabled.
- [ ] Add focused tests for generated access-control code.

## Decisions

- 2026-05-07: Treat RBAC as a security feature, not just UI state. Server-side
  checks must be generated wherever protected data is exposed.

## Verification

- Planning review only. Future verification should include security review and
  generated-source assertions.

## Handoff

This becomes foundational once Tenex generates more real product modules, since
many of them will need scoped access.
