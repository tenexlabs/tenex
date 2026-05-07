# Plan: Add Customer CRM Addon

Status: Backlog

Priority: P2

Type: feat

Owner: Agent

Created: 2026-05-07

## Goal

Generate a lightweight founder CRM for leads, accounts, contacts, lifecycle
stage, notes, and follow-up actions inside the Tenex app.

## Context

- Product intent: `docs/PRODUCT_SENSE.md`
- Generated app contract: `docs/product-specs/generated-app-contract.md`
- Templates: `src/templates.ts`
- Admin add-on: `src/addons/admin.ts`
- Email and analytics add-ons: `src/addons/email.ts`, `src/addons/analytics.ts`

Audit findings:

- Generated dashboards show placeholder pipeline metrics but do not give
  founders a place to manage real customers or prospects.
- Existing admin surfaces are operator-focused, not customer pipeline-focused.
- Convex is a good fit for a small editable CRM scaffold that founders can
  extend.

## Acceptance Criteria

- Tenex supports a `crm` add-on with Convex tables for accounts, contacts,
  notes, lifecycle stages, and next actions.
- Generated routes include pipeline board, account list, account detail, contact
  detail, and quick-add forms.
- Dashboard metrics can read from CRM data instead of static placeholder values
  when the add-on is enabled.
- Optional email and analytics hooks support outreach events and conversion
  tracking.
- Tests cover generated files, schema patching, route links, and idempotency.

## Steps

- [ ] Add CRM provider type and manifest support.
- [ ] Generate schema, indexes, queries, and mutations.
- [ ] Generate CRM routes and reusable UI components.
- [ ] Patch dashboard and navigation to surface CRM data.
- [ ] Add optional integration hooks for email and analytics.
- [ ] Add smoke coverage for `saas-core` plus CRM.

## Decisions

- 2026-05-07: Keep the CRM intentionally founder-scale. It should be a usable
  starting point, not a full sales platform clone.

## Verification

- Planning review only. Future verification should include generated app syntax
  checks and add-on permutation tests.

## Handoff

This would make generated SaaS apps immediately useful for founder-led sales and
customer discovery, which is a direct fit for Tenex's target user.
