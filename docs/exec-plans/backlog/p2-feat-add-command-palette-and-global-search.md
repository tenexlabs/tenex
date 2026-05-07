# Plan: Add Command Palette And Global Search

Status: Backlog

Priority: P2

Type: feat

Owner: Agent

Created: 2026-05-07

## Goal

Generate a command palette and global search surface so users can quickly
navigate records, settings, actions, and add-on pages in Tenex-generated apps.

## Context

- Product intent: `docs/PRODUCT_SENSE.md`
- Frontend guidance: `docs/FRONTEND.md`
- Templates: `src/templates.ts`
- Add-on generated routes: `src/addons/`

Audit findings:

- Generated apps grow many routes as add-ons are enabled, but navigation remains
  mostly static.
- Founder-facing operational tools need fast keyboard-first navigation once CRM,
  support, files, admin, and settings surfaces exist.
- Tenex can generate a shared route/action registry that add-ons extend.

## Acceptance Criteria

- Generated app shell includes a keyboard-accessible command palette.
- Route registry includes core pages and add-on pages with labels, descriptions,
  icons, and permissions metadata.
- Search can include local static actions immediately and Convex-backed records
  when supported add-ons are enabled.
- Actions include create resource, invite teammate, open settings, view docs,
  and run add-on-specific quick actions.
- Tests cover route registry generation, shell patching, keyboard hint display,
  and add-on idempotency.

## Steps

- [ ] Add shared generated route/action registry.
- [ ] Patch templates with command palette shell UI.
- [ ] Let add-ons register palette entries and record search providers.
- [ ] Add permission-aware filtering hooks.
- [ ] Add smoke coverage for enabled and disabled add-on entries.

## Decisions

- 2026-05-07: Start with local command metadata and progressive Convex search
  adapters instead of introducing an external search service.

## Verification

- Planning review only. Future verification should include generated app route
  smoke tests and accessibility checks for the palette trigger.

## Handoff

This improves the day-two usability of every generated app as product surfaces
accumulate.
