# Plan: Support Addons After Local Better Auth

Status: Backlog

Priority: P1

Type: fix

Owner: Agent

Created: 2026-05-07

## Goal

Keep component add-ons idempotent when users add billing, email, or storage
after teams/admin has switched Better Auth to a local Convex component install.

## Context

- Architecture map: `ARCHITECTURE.md`
- Add-on contract: `ARCHITECTURE.md`
- Shared add-on patcher: `src/addons/shared.ts`
- Local Better Auth install: `src/addons/better-auth-local.ts`
- Billing/email/storage add-ons: `src/addons/billing.ts`,
  `src/addons/email.ts`, `src/addons/storage.ts`
- Smoke coverage: `src/test/smoke.ts`

Audit findings:

- `ensureConvexComponentInConfig` inserts component imports by searching for
  `import betterAuth from '@convex-dev/better-auth/convex.config'`.
- `applyBetterAuthLocalInstall` later rewrites that import to
  `import betterAuth from './betterAuth/convex.config'`.
- After teams/admin are enabled, adding billing/email/R2 can fail because the
  shared component patcher no longer finds the original package import.

## Acceptance Criteria

- Component registration works whether Better Auth is imported from the package
  component or the local `./betterAuth/convex.config` component.
- Re-running component add-ons does not duplicate imports or `app.use(...)`
  statements.
- Adding teams/admin first and then billing, email, or R2 succeeds in a smoke
  fixture.
- The patcher errors remain actionable when `convex.config.ts` has a shape Tenex
  cannot safely edit.

## Steps

- [ ] Update `ensureConvexComponentInConfig` to anchor insertion around the
      existing Better Auth import regardless of package/local source.
- [ ] Consider using a small parser or structured text helper for
      `convex.config.ts` instead of one exact string.
- [ ] Add smoke coverage for add-on order permutations that include local Better
      Auth before billing/email/storage.
- [ ] Add idempotency assertions for repeated add-on application after local
      Better Auth is active.

## Decisions

- 2026-05-07: This is a product reliability issue because add-ons are advertised
  as independently idempotent and safe to re-run.

## Verification

- Audit command: `npm run check` passed on 2026-05-07.
- Audit review: traced add-on order in `src/addons/catalog.ts` and patch anchors
  in `src/addons/shared.ts`.
- Future verification should include add-order smoke tests plus `npm run check`.

## Handoff

No code was changed for this backlog item during the audit. This should land
before relying on incremental `tenex add` workflows for real users.
