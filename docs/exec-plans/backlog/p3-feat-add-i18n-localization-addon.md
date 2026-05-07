# Plan: Add I18n Localization Addon

Status: Backlog

Priority: P3

Type: feat

Owner: Agent

Created: 2026-05-07

## Goal

Add internationalization scaffolding with locale routing, dictionaries,
formatting helpers, translated generated copy, and a path for product-specific
translations.

## Context

- Frontend guidance: `docs/FRONTEND.md`
- Generated routes: `src/templates.ts`
- Auth routes: `src/addons/auth.ts`
- Project blueprint opportunity:
  `docs/exec-plans/backlog/p1-feat-add-product-blueprint-wizard.md`

Audit findings:

- Generated strings are embedded directly in TSX template strings across auth,
  template, storage, and admin routes.
- There is no dictionary abstraction, locale route handling, or formatting
  helper.
- As Tenex generates more surfaces, postponing i18n will make localization more
  expensive.

## Acceptance Criteria

- Tenex supports an `i18n` add-on with one default locale and optional
  additional locales.
- Generated app centralizes route copy in dictionaries or translation modules.
- Locale-aware helpers cover dates, numbers, currency, and route labels.
- Generated auth, dashboard, pricing, onboarding, settings, and add-on routes
  can consume localized copy.
- Tests cover dictionary generation, route references, and default-locale
  behavior.

## Steps

- [ ] Choose a minimal i18n approach compatible with TanStack Start generated
      apps.
- [ ] Define generated dictionary structure and type helpers.
- [ ] Refactor core template strings to pull from dictionaries when i18n is
      enabled.
- [ ] Add locale routing or locale preference handling.
- [ ] Extend add-ons to register copy namespaces over time.
- [ ] Add smoke tests for an i18n-enabled project.

## Decisions

- 2026-05-07: Make i18n optional because it adds generated-code overhead that
  single-locale founders should not have to carry.

## Verification

- Planning review only. Future verification should include generated source
  tests and route rendering checks once available.

## Handoff

This opens Tenex to founders building for non-English markets and forces better
copy organization in generated code.
