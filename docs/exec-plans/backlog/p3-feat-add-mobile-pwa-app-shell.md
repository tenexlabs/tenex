# Plan: Add Mobile PWA App Shell

Status: Backlog

Priority: P3

Type: feat

Owner: Agent

Created: 2026-05-07

## Goal

Add a mobile-first PWA app shell option so generated products can ship a
credible installable mobile web experience without building native apps.

## Context

- Product intent: `docs/PRODUCT_SENSE.md`
- Frontend guidance: `docs/FRONTEND.md`
- Templates: `src/templates.ts`
- Generated app contract: `docs/product-specs/generated-app-contract.md`

Audit findings:

- Tenex generates web app surfaces, but mobile installability, offline states,
  and small-screen navigation are not first-class product choices.
- Founder products often need mobile-friendly dashboards, notifications, and
  customer workflows long before a native app is justified.
- A PWA shell can be scaffolded through static assets, metadata, route layout
  choices, and optional notification hooks.

## Acceptance Criteria

- Tenex supports a mobile/PWA option during `tenex new` and through
  `tenex add pwa`.
- Generated apps include manifest metadata, app icons placeholders, install
  prompts, mobile navigation patterns, and offline/error states.
- Dashboard, settings, onboarding, and key add-on routes receive responsive
  layout checks or generated mobile variants where needed.
- Optional notification hooks prepare the app for push-notification provider
  integration without requiring push support in the first version.
- Documentation explains deployment requirements for PWA behavior on common
  hosting targets.
- Tests cover generated metadata files, route patches, template compatibility,
  and idempotent re-runs.

## Steps

- [ ] Add PWA option and manifest state.
- [ ] Generate web app manifest, icon placeholders, metadata, and install UI.
- [ ] Patch app shell navigation for mobile-first usage.
- [ ] Add responsive fixtures or smoke assertions for core generated routes.
- [ ] Document hosting and HTTPS requirements in deploy handoff output.
- [ ] Add add-on permutation tests for PWA plus notifications.

## Decisions

- 2026-05-07: Focus on installable web app quality first. Native wrappers and
  app-store packaging are out of scope for the initial plan.

## Verification

- Planning review only. Future verification should include browser rendering
  checks for mobile viewports in generated fixture apps.

## Handoff

This would make Tenex-generated products more useful for founders whose users
expect operational workflows to work well from phones.
