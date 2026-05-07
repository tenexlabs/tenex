# Plan: Align Auth Client Plugins With Addons

Status: Backlog

Owner: Agent

Created: 2026-05-07

## Goal

Generate Better Auth client plugins that match the enabled add-ons instead of
shipping unnecessary or missing client capabilities.

## Context

- Add-on contract: `ARCHITECTURE.md`
- Security guidance: `docs/SECURITY.md`
- Auth scaffold: `src/addons/auth.ts`
- Teams add-on: `src/addons/teams.ts`
- Admin add-on: `src/addons/admin.ts`
- Template/add-on orchestration: `src/commands/new.ts`, `src/commands/add.ts`

Audit findings:

- `authClientSource` always imports and registers `adminClient()` even when the
  admin add-on is disabled.
- The teams add-on enables the Better Auth organization server plugin, but the
  generated auth client does not add the corresponding organization client
  plugin.
- Client plugin generation is owned by the baseline auth scaffold, while add-on
  choices are applied later through template/add-on orchestration.

## Acceptance Criteria

- Admin client plugin is only present when the admin add-on is enabled or
  explicitly required by a generated admin route.
- Organization client plugin is present when the teams add-on is enabled.
- Re-running add-ons updates `src/lib/auth-client.ts` idempotently without
  clobbering unrelated user edits.
- Tests cover auth-client output for no admin/teams, admin only, teams only, and
  both enabled.

## Steps

- [ ] Decide whether auth-client generation should become manifest-aware or be
      patched by admin/teams add-ons.
- [ ] Update generated auth-client source or patch helpers to add/remove plugins
      idempotently.
- [ ] Add tests for plugin combinations and repeated add-on application.
- [ ] Update docs if the generated auth-client contract changes.

## Decisions

- 2026-05-07: Treat this as a correctness and least-privilege improvement rather
  than a blocker for the baseline scaffold.

## Verification

- Audit command: `npm run check` passed on 2026-05-07.
- Audit review: inspected `src/addons/auth.ts`, `src/addons/teams.ts`, and
  `src/addons/admin.ts`.
- Future verification should include auth-client combination tests plus
  `npm run check`.

## Handoff

No code was changed for this backlog item during the audit. This should be
handled with the broader add-on permutation test work.
