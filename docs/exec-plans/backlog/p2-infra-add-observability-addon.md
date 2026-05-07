# Plan: Add Observability Addon

Status: Backlog

Priority: P2

Type: infra

Owner: Agent

Created: 2026-05-07

## Goal

Add observability scaffolding for error tracking, structured events, request/job
logs, performance timing, provider health, and production readiness checks.

## Context

- Reliability guidance: `docs/RELIABILITY.md`
- Deploy command: `src/commands/deploy.ts`
- Doctor command: `src/commands/doctor.ts`
- Generated app contract: `docs/product-specs/generated-app-contract.md`
- Add-on catalog: `src/addons/catalog.ts`

Audit findings:

- Tenex validates env vars but does not generate runtime observability code.
- Generated apps have no error boundary, server action logging helper, provider
  health page, or production incident handoff.
- Future billing, AI, support, and storage workflows will need better
  operational visibility.

## Acceptance Criteria

- Tenex supports an `observability` add-on with provider-neutral generated
  helpers and optional provider configuration.
- Generated app includes error boundary UI, structured logging helpers, and
  health/status surfaces.
- Convex functions can record operational events without leaking secrets.
- Doctor/deploy output reports observability setup state when enabled.
- Tests cover generated source, env requirements, and disabled-provider stubs.

## Steps

- [ ] Define observability provider choices and baseline no-provider helpers.
- [ ] Generate client/server error handling and logging utilities.
- [ ] Add error boundary and status/health route or admin section.
- [ ] Integrate provider health for auth, billing, email, storage, analytics,
      and AI.
- [ ] Update doctor/deploy handoff output.
- [ ] Add smoke coverage for observability-enabled projects.

## Decisions

- 2026-05-07: Start provider-neutral and local-first. The generated API should
  survive swapping the external observability vendor later.

## Verification

- Planning review only. Future verification should include generated-source
  tests and a review for secret-safe logging.

## Handoff

This makes generated apps easier to operate after launch and gives founders a
clear path from local scaffolding to production support.
