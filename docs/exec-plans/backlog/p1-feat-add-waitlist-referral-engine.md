# Plan: Add Waitlist Referral Engine

Status: Backlog

Priority: P1

Type: feat

Owner: Agent

Created: 2026-05-07

## Goal

Turn the waitlist template into a functioning referral and launch-readiness
system with signup capture, referral codes, segmentation, admin review, and
email/analytics hooks.

## Context

- Product sense: `docs/PRODUCT_SENSE.md`
- Generated app contract: `docs/product-specs/generated-app-contract.md`
- Waitlist template config: `src/templates.ts`
- Email add-on: `src/addons/email.ts`
- Analytics add-on: `src/addons/analytics.ts`
- Admin add-on: `src/addons/admin.ts`

Audit findings:

- The `waitlist` template currently changes product copy and metrics only.
- There is no public waitlist form, referral code model, launch cohort state, or
  admin workflow for waitlist review.
- Existing email and analytics stubs can become optional integrations.

## Acceptance Criteria

- Generated waitlist projects include a public signup form that writes to Convex
  and prevents duplicate emails.
- Each waitlist entry can have a referral code, referral source, status, segment,
  and invite priority.
- Generated UI includes a referral share page and an admin or founder review
  surface.
- Email and analytics add-ons enrich the flow when enabled without becoming
  mandatory.
- Tests cover generated schema, functions, routes, and enabled/disabled email
  and analytics combinations.

## Steps

- [ ] Add a waitlist add-on or make the waitlist template generate domain
      tables by default.
- [ ] Generate Convex schema, signup mutation, referral lookup, and admin query.
- [ ] Replace generic landing content with a functional waitlist capture flow.
- [ ] Add referral share and status pages.
- [ ] Add optional email confirmation and analytics capture hooks.
- [ ] Add smoke coverage for the waitlist template.

## Decisions

- 2026-05-07: Prefer making waitlist behavior first-class for the `waitlist`
  template, because a prelaunch product without signup/referral mechanics is not
  founder-ready.

## Verification

- Planning review only. Future verification should include template-specific
  smoke tests and generated app fixture checks.

## Handoff

This feature turns one of the three existing template choices into a real
product workflow and should be prioritized before adding more prelaunch
templates.
