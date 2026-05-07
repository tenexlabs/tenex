# Plan: Add Deploy Target Guides

Status: Backlog

Priority: P1

Type: infra

Owner: Agent

Created: 2026-05-07

## Goal

Expand `tenex deploy` into a deployment guide generator for common hosting
targets, including provider-specific env mapping, build commands, handoff
checklists, and post-deploy verification steps.

## Context

- Deploy command: `src/commands/deploy.ts`
- Project README and handoff: `src/lib/project-readme.ts`
- Package manager helpers: `src/lib/package-manager.ts`
- Doctor health inspection: `src/lib/doctor.ts`
- CLI spec: `docs/product-specs/tenex-cli.md`

Audit findings:

- `tenex deploy` currently writes `TENEX_HANDOFF.md` and runs `convex deploy`.
- The handoff is generic and does not help with a web host target, build command
  configuration, env synchronization, or smoke verification.
- The manifest already knows package manager, template, and enabled add-ons,
  which are enough to generate a better target-specific guide.

## Acceptance Criteria

- `tenex deploy --target <host>` writes target-specific handoff steps for app
  build command, install command, env vars, Convex deploy, and post-deploy
  checks.
- `tenex deploy --target guide` can generate docs without executing deploy.
- Handoff output clearly separates local env vars, Convex env vars, and hosting
  env vars.
- Generated checklist includes auth callback/site URL validation and add-on
  provider webhook setup where relevant.
- Tests cover handoff output for at least two targets and add-on combinations.

## Steps

- [ ] Define supported deploy targets and target metadata.
- [ ] Extend deploy args parsing and handoff generation.
- [ ] Add target-specific sections to `TENEX_HANDOFF.md`.
- [ ] Add optional guide-only mode.
- [ ] Add tests for generated handoff content.
- [ ] Update README, CLI spec, and generated docs.

## Decisions

- 2026-05-07: Keep target support as generated guidance first. Full remote host
  automation can be added later after the guidance is reliable.

## Verification

- Planning review only. Future verification should include handoff snapshot
  tests and `npm run harness:check`.

## Handoff

This closes the gap between "Convex deployed" and "the generated product is live
on a web host with correct env and provider setup."
