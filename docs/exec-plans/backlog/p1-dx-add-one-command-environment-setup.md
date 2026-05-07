# Plan: Add One Command Environment Setup

Status: Backlog

Priority: P1

Type: dx

Owner: Agent

Created: 2026-05-07

## Goal

Add an interactive environment setup flow that helps users collect, validate,
write, and sync required local and Convex env vars for enabled add-ons.

## Context

- Doctor command: `src/commands/doctor.ts`
- Deploy command: `src/commands/deploy.ts`
- Auth setup: `src/commands/add-auth.ts`
- Env requirements: `src/lib/tenex-config.ts`
- Dotenv helpers: `src/lib/dotenv.ts`

Audit findings:

- `addAuth` can derive and set Better Auth env vars, but other add-ons only
  surface required env vars through doctor and README/handoff output.
- `tenex doctor` reports missing values but does not help users fill them.
- Provider setup is currently a manual copy/paste workflow with no validation
  beyond presence.

## Acceptance Criteria

- Tenex provides `tenex setup env` or `tenex doctor --fix` for interactive env
  collection.
- The flow writes VITE/local values to `.env.local` and can sync server-side
  values to Convex env using the selected package manager.
- Secrets are never echoed in logs or persisted to generated source files.
- The flow validates basic shape for URLs, public keys, webhook secrets, email
  addresses, and comma-separated allowlists where applicable.
- Tests cover dotenv updates, Convex command construction, secret-safe output,
  and skipped optional values.

## Steps

- [ ] Choose command shape and update CLI routing/specs.
- [ ] Extend env requirement metadata with prompt labels, local vs Convex target,
      validators, and secret/public classification.
- [ ] Implement interactive collection and non-interactive flag support.
- [ ] Add safe Convex env set execution and retry behavior.
- [ ] Add tests for dotenv and command rendering.
- [ ] Update README and deploy handoff copy.

## Decisions

- 2026-05-07: Keep setup explicit and reviewable. The command should show which
  names will be written without printing secret values.

## Verification

- Planning review only. Future verification should include dotenv tests and
  command-output review for secret exposure.

## Handoff

This feature shortens the path from scaffold to running app and turns doctor
from a diagnostic into a guided setup assistant.
