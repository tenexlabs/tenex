# Repository Knowledge Base

This directory is the durable system of record for Tenex. The root `AGENTS.md`
is a map; this directory carries the deeper project context agents need to make
coherent changes.

## Top-Level Guides

- `CODE_STANDARDS.md`: Ultracite and project coding standards.
- `DESIGN.md`: Product and generated-app design principles.
- `FRONTEND.md`: Frontend rules for generated TanStack Start surfaces.
- `PLANS.md`: How to create, update, complete, and archive execution plans.
- `PRODUCT_SENSE.md`: Tenex product judgment and target user assumptions.
- `QUALITY_SCORE.md`: Current quality assessment and gaps.
- `RELIABILITY.md`: Reliability expectations for CLI and generated apps.
- `SECURITY.md`: Security expectations for scaffolding and generated code.

## Directories

- `design-docs/`: durable design decisions and operating beliefs.
- `exec-plans/`: active plans, completed plans, templates, and debt tracking.
- `generated/`: machine-generated reference docs about the repo.
- `product-specs/`: product-facing specs and contracts.
- `references/`: external references and summarized source material.
- `reviews/`: review checklists and agent-to-agent review prompts.

## Maintenance Rules

- Add new durable knowledge here, not to the root agent file.
- Cross-link docs when one document depends on another.
- Update `docs/generated/` with `npm run docs:generate` after source shape,
  command, package, or script changes.
- Run `npm run harness:check` when changing docs, scripts, or repo structure.
