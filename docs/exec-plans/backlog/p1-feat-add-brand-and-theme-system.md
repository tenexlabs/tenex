# Plan: Add Brand And Theme System

Status: Backlog

Priority: P1

Type: feat

Owner: Agent

Created: 2026-05-07

## Goal

Add a brand and theme system so generated apps can use founder-provided naming,
tone, color tokens, typography choices, and UI density without hard-coded visual
identity in template strings.

## Context

- Design guidance: `docs/DESIGN.md`
- Frontend guidance: `docs/FRONTEND.md`
- Product blueprint opportunity:
  `docs/exec-plans/backlog/p1-feat-add-product-blueprint-wizard.md`
- Template source: `src/templates.ts`
- Generated app config: `src/lib/tenex.generated.ts` output from
  `src/templates.ts`

Audit findings:

- Current generated UI is strongly black/red/monospace, regardless of template
  or founder brand.
- Template configs include `brand.name`, `accent`, and tagline, but styling does
  not consume a real token system.
- Generated CSS and route classes are embedded in large template strings, which
  makes broad theme changes expensive.

## Acceptance Criteria

- Tenex can capture or infer brand name, tone, accent palette, neutral palette,
  radius scale, and density preference.
- Generated app writes theme tokens in a central file and consumes them across
  routes/components.
- Existing templates retain strong defaults while allowing project-specific
  brand overrides.
- Generated UI remains accessible and responsive across light/dark or
  high-contrast variants if those modes are supported.
- Tests cover generated token output and route/component references.

## Steps

- [ ] Define theme token schema and where it lives in generated apps.
- [ ] Add blueprint or command prompts for brand/theme choices.
- [ ] Refactor generated components/routes to consume tokens instead of repeated
      hard-coded class groups.
- [ ] Add optional theme preview route or settings section.
- [ ] Add smoke assertions for theme token generation.
- [ ] Update design docs with generated theme rules.

## Decisions

- 2026-05-07: Keep theme output as readable generated code, not an opaque design
  system dependency, so founders can edit it directly.

## Verification

- Planning review only. Future verification should include generated UI checks
  and accessibility-focused review.

## Handoff

This makes generated apps feel less generic and reduces the immediate redesign
burden on founders.
