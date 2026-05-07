# Plan: Harden Admin Bootstrap And Access Control

Status: Backlog

Owner: Agent

Created: 2026-05-07

## Goal

Make the generated admin panel safe to deploy by requiring explicit admin
eligibility, protecting admin-only data, and preventing first-admin race
conditions.

## Context

- Product spec: `docs/product-specs/generated-app-contract.md`
- Security guidance: `docs/SECURITY.md`
- Admin scaffold: `src/addons/admin.ts`
- Auth scaffold: `src/addons/auth.ts`
- Current smoke coverage: `src/test/smoke.ts`

Audit findings:

- `bootstrapFirstAdmin` promotes any authenticated first user while setup is
  incomplete. This conflicts with `docs/SECURITY.md`, which says admin
  scaffolding must require explicit admin identifiers.
- `TENEX_ADMIN_EMAILS` is required by doctor for admin projects, but the setup
  mutation does not enforce it before promotion.
- `getConsoleState` returns workspace config, recent activity, and admin
  eligibility metadata before asserting admin access.
- The workspace config table has no `key` index or uniqueness strategy, so
  concurrent bootstrap attempts can insert multiple global workspace rows.

## Acceptance Criteria

- First-admin bootstrap only succeeds for accounts explicitly allowed by
  `TENEX_ADMIN_EMAILS` or another documented generated-app admin bootstrap
  mechanism.
- Admin console state and activity data are not returned to non-admin users.
- Workspace config lookup uses an index or another deterministic singleton
  strategy and handles concurrent bootstrap attempts predictably.
- Generated setup UI explains the required admin identifier path without
  exposing secret values.
- Smoke or focused generated-source tests cover allowed, denied, and already
  bootstrapped admin paths.

## Steps

- [ ] Decide whether `TENEX_ADMIN_EMAILS` remains the only bootstrap mechanism or
      whether Tenex should generate a separate one-time bootstrap token flow.
- [ ] Update generated Convex admin mutations and queries to enforce explicit
      admin eligibility before promotion and before returning console data.
- [ ] Add an indexed workspace lookup or singleton record strategy for
      `tenex_admin_workspace`.
- [ ] Update setup-admin UI copy and states to reflect the explicit eligibility
      requirement.
- [ ] Add tests that inspect generated admin server source and, where practical,
      exercise the authorization branches.
- [ ] Update `docs/SECURITY.md` or generated-app contract if the chosen
      bootstrap model changes.

## Decisions

- 2026-05-07: Treat this as a security backlog item because the generated admin
  flow can otherwise promote the first arbitrary authenticated user.

## Verification

- Audit command: `npm run check` passed on 2026-05-07.
- Audit review: inspected `src/addons/admin.ts` admin bootstrap and console
  state generation.
- Future verification should include the current smoke suite plus focused tests
  for generated admin authorization behavior.

## Handoff

No code was changed for this backlog item during the audit. Implement this
before recommending the admin scaffold for production deployment.
