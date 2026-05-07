# Plan: Add Revenue Forecasting Dashboard

Status: Backlog

Priority: P2

Type: feat

Owner: Agent

Created: 2026-05-07

## Goal

Generate revenue forecasting dashboards that combine billing, pipeline, usage,
and churn signals into founder-readable projections.

## Context

- Product intent: `docs/PRODUCT_SENSE.md`
- Billing plan:
  `docs/exec-plans/backlog/p1-feat-add-real-billing-flows.md`
- CRM plan: `docs/exec-plans/backlog/p2-feat-add-customer-crm-addon.md`
- Usage metering plan:
  `docs/exec-plans/backlog/p2-feat-add-usage-metering-and-entitlements.md`

Audit findings:

- Generated dashboards should help founders run the business, not only inspect
  app status.
- Billing, CRM, and usage add-ons create enough data for starter forecasts.
- Forecast rules should remain transparent and editable.

## Acceptance Criteria

- Tenex supports `tenex add revenue-forecasting`.
- Generated schema stores forecast snapshots, assumptions, scenario inputs, and
  source metrics.
- Generated UI includes MRR/ARR projection, pipeline forecast, usage-based
  upside, churn sensitivity, and scenario comparison.
- Optional billing, CRM, analytics, and usage hooks provide source data.
- Forecast formulas are generated as readable TypeScript helpers.
- Tests cover formula helpers, generated routes, add-on signal registration,
  and idempotency.

## Steps

- [ ] Add revenue forecasting add-on metadata and manifest support.
- [ ] Generate forecast schema and calculation helpers.
- [ ] Generate founder dashboard views and scenario controls.
- [ ] Wire optional billing, CRM, usage, and analytics sources.
- [ ] Add unit tests for formulas and smoke tests for generated routes.

## Decisions

- 2026-05-07: Keep forecasts simple and explainable rather than overfitting a
  financial planning model.

## Verification

- Planning review only. Future verification should include formula tests with
  fixture source data.

## Handoff

This would make Tenex-generated SaaS apps more directly useful for founder
decision-making.
