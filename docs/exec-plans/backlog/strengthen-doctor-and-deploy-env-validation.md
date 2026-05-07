# Plan: Strengthen Doctor And Deploy Env Validation

Status: Backlog

Owner: Agent

Created: 2026-05-07

## Goal

Make env validation deterministic and fail-safe, especially before deployment.

## Context

- Reliability guidance: `docs/RELIABILITY.md`
- Security guidance: `docs/SECURITY.md`
- Doctor command: `src/commands/doctor.ts`
- Deploy command: `src/commands/deploy.ts`
- Health inspection: `src/lib/doctor.ts`
- Env requirements: `src/lib/tenex-config.ts`

Audit findings:

- `inspectProjectHealth` returns `convexEnvError` when `convex env list` fails.
- `cmdDeploy` only blocks missing Convex env vars when there is no
  `convexEnvError`, so deploy can proceed when env verification failed.
- `spawnSync` for `convex env list` has no timeout, which can make doctor/deploy
  hang on CLI auth, network, or local process issues.
- Doctor reports local and Convex env states, but there is no focused test
  coverage for verification errors or deploy failure behavior.

## Acceptance Criteria

- `tenex deploy` fails when Convex env vars cannot be verified unless there is a
  deliberate documented override.
- Doctor and deploy Convex env inspection use bounded timeouts and actionable
  errors.
- Missing local env, missing Convex env, and Convex inspection failure paths are
  covered by tests.
- Handoff output is not written before deploy validation has conclusively passed
  or the user has chosen an explicit override path.

## Steps

- [ ] Decide whether deploy should support an override flag for unverifiable
      Convex env state.
- [ ] Add a timeout and better error normalization around `convex env list`.
- [ ] Update `cmdDeploy` to treat verification failure as blocking by default.
- [ ] Add tests for local env parsing, Convex env parsing, inspection failure,
      and deploy gating.
- [ ] Update docs if an override flag or changed deploy behavior is introduced.

## Decisions

- 2026-05-07: Default to fail-safe deploy behavior because credentials and
  provider setup are security-sensitive.

## Verification

- Audit command: `npm run check` passed on 2026-05-07.
- Audit review: traced `src/lib/doctor.ts` and `src/commands/deploy.ts`.
- Future verification should include focused doctor/deploy tests plus
  `npm run check`.

## Handoff

No code was changed for this backlog item during the audit. This is a
release-safety improvement for projects with enabled providers.
