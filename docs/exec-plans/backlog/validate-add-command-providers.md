# Plan: Validate Add Command Providers

Status: Backlog

Owner: Agent

Created: 2026-05-07

## Goal

Make `tenex add` reject invalid add-on/provider combinations before mutating a
project.

## Context

- CLI spec: `docs/product-specs/tenex-cli.md`
- Security guidance: `docs/SECURITY.md`
- Add command: `src/commands/add.ts`
- Add-on manifest types: `src/lib/tenex-config.ts`
- New-project selection validation: `src/commands/new.ts`
- Current smoke coverage: `src/test/smoke.ts`

Audit findings:

- `tenex new` validates provider flags, but `tenex add` accepts arbitrary
  `--provider` values and casts them into typed manifest fields.
- Invalid billing providers can generate inconsistent files, register the
  wrong Convex component, and skip package/env requirements.
- Invalid email, analytics, storage, teams, or admin providers can persist
  unsupported manifest state with unclear follow-on behavior.

## Acceptance Criteria

- Every `tenex add <addon> --provider <value>` path validates against the same
  provider sets used by `tenex new`.
- Invalid provider selections fail with concise actionable errors before
  `tenex.json`, generated files, or dependencies are changed.
- Provider validation logic is shared or centralized enough that future add-ons
  cannot drift between `new` and `add`.
- Tests cover valid providers, `none`, missing providers, and invalid provider
  values for each add-on category.

## Steps

- [ ] Extract provider metadata and validation helpers from command-local logic
      into a shared module.
- [ ] Update `cmdAdd` to validate provider values before writing the manifest.
- [ ] Add tests for invalid provider flags across billing, storage, email,
      analytics, teams, and admin.
- [ ] Add tests for prompt/default paths where practical without requiring an
      interactive terminal.
- [ ] Update docs if command syntax or error behavior changes.

## Decisions

- 2026-05-07: Keep this separate from broader transactionality work because it
  is a narrow correctness bug with high blast radius.

## Verification

- Audit command: `npm run check` passed on 2026-05-07.
- Audit review: compared `src/commands/new.ts` validation with
  `src/commands/add.ts` provider handling.
- Future verification should include focused command tests plus `npm run check`.

## Handoff

No code was changed for this backlog item during the audit. The desired fix is
small but should land with command-level regression coverage.
