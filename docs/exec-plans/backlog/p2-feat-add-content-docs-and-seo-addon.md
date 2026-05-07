# Plan: Add Content Docs And SEO Addon

Status: Backlog

Priority: P2

Type: feat

Owner: Agent

Created: 2026-05-07

## Goal

Add a content, docs, changelog, legal, and SEO add-on that gives founders the
public pages needed to explain, support, and launch their product.

## Context

- Product sense: `docs/PRODUCT_SENSE.md`
- Generated app contract: `docs/product-specs/generated-app-contract.md`
- Templates: `src/templates.ts`
- Project README generation: `src/lib/project-readme.ts`

Audit findings:

- Generated apps include landing, pricing, dashboard, onboarding, settings, and
  optional admin/files routes.
- There is no docs site, changelog, blog, terms/privacy scaffold, sitemap, RSS,
  or metadata helper.
- The public landing route has template copy, but not a broader content system.

## Acceptance Criteria

- Tenex supports a `content` add-on that generates docs, changelog, legal, and
  optional blog routes from local content files.
- Generated metadata helpers support titles, descriptions, canonical paths, and
  social metadata per route.
- Generated app includes sitemap and robots output where supported by the
  framework.
- Content files are easy to edit and can be deleted without breaking private
  app routes.
- Tests cover generated routes, metadata helpers, and navigation links.

## Steps

- [ ] Decide whether content should be file-based markdown/MDX-like content or
      plain generated TS/TSX pages for the first version.
- [ ] Add content add-on manifest support and generated route files.
- [ ] Generate metadata helpers and example content pages.
- [ ] Add public navigation links and footer surface.
- [ ] Add sitemap/robots route generation if compatible with the app stack.
- [ ] Add smoke tests for generated public content routes.

## Decisions

- 2026-05-07: Start with simple editable generated files. A full CMS integration
  can be a later pack or add-on.

## Verification

- Planning review only. Future verification should include generated route tests
  and metadata output checks.

## Handoff

This helps founders ship a credible public product footprint without leaving the
Tenex-generated app.
