# Plan: Add Template Copy And Content Studio

Status: Backlog

Priority: P2

Type: feat

Owner: Agent

Created: 2026-05-07

## Goal

Generate a copy and content studio for editing product messaging, empty states,
emails, onboarding text, pricing copy, and public page content from one place.

## Context

- Product intent: `docs/PRODUCT_SENSE.md`
- Design guidance: `docs/DESIGN.md`
- Brand and theme plan:
  `docs/exec-plans/backlog/p2-feat-add-brand-and-theme-system.md`
- Content docs plan:
  `docs/exec-plans/backlog/p2-feat-add-content-docs-and-seo-addon.md`

Audit findings:

- Tenex templates need domain-specific copy, but editing scattered template
  strings is tedious.
- Brand and content plans cover visual identity and public content, while
  product microcopy needs its own structured surface.
- Founders benefit from seeing all generated customer-facing copy in one place.

## Acceptance Criteria

- Tenex supports `tenex add content-studio`.
- Generated code centralizes editable copy tokens for core templates and
  enabled add-ons.
- Generated UI includes copy inventory, edit forms, preview contexts, and
  publish status.
- Copy tokens cover onboarding, empty states, pricing, emails, support,
  notifications, and public pages where enabled.
- Tests cover copy token generation, route links, add-on token registration,
  and idempotency.

## Steps

- [ ] Define copy token schema and generated module convention.
- [ ] Extract template and add-on copy into registries.
- [ ] Generate content studio routes and preview helpers.
- [ ] Integrate brand, email, docs, onboarding, and notification copy tokens.
- [ ] Add smoke tests for generated copy references.

## Decisions

- 2026-05-07: Keep copy as explicit generated data/code, not a remote CMS
  dependency.

## Verification

- Planning review only. Future verification should include generated references
  checks to avoid stale copy token keys.

## Handoff

This would make Tenex-generated apps feel less generic and easier for founders
to tailor quickly.
