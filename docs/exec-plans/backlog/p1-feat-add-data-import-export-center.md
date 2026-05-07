# Plan: Add Data Import Export Center

Status: Backlog

Priority: P1

Type: feat

Owner: Agent

Created: 2026-05-07

## Goal

Generate a data import and export center so founders can move real customer,
lead, product, and operational data into and out of generated apps.

## Context

- Product intent: `docs/PRODUCT_SENSE.md`
- Generated app contract: `docs/product-specs/generated-app-contract.md`
- Add-ons: `src/addons/`
- File storage add-on plan:
  `docs/exec-plans/backlog/p2-feat-add-file-library-and-upload-workflows.md`

Audit findings:

- Generated apps are useful faster when founders can seed them with real data.
- CRM, waitlist, forms, support, billing, and analytics features all need
  practical CSV import/export paths.
- Tenex currently has no durable pattern for generated data portability.

## Acceptance Criteria

- Tenex supports `tenex add data-tools`.
- Generated UI includes import jobs, field mapping, validation previews,
  failure downloads, export jobs, and data retention notes.
- Generated Convex tables track import/export jobs, files, row counts, errors,
  actor, and timestamps.
- Add-ons can register importable/exportable resource definitions.
- Exports support CSV and JSONL starters without requiring a third-party data
  warehouse.
- Tests cover generated schema, route links, add-on registrations, and
  idempotency.

## Steps

- [ ] Add data tools add-on metadata and manifest state.
- [ ] Generate import/export job schema and helpers.
- [ ] Generate UI for uploads, mapping, previews, and exports.
- [ ] Add resource registration hooks for CRM, waitlist, support, and forms.
- [ ] Add smoke and parser validation tests.

## Decisions

- 2026-05-07: Favor explicit resource adapters over generic table dumping so
  founders can preserve validation and privacy boundaries.

## Verification

- Planning review only. Future verification should include fixture CSV parsing
  tests and generated app smoke coverage.

## Handoff

This would reduce migration friction and make generated apps viable with real
business data much sooner.
