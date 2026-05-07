# Agent Guide

Tenex follows the harness-engineering pattern from OpenAI's Codex article:
keep this file short, keep repository knowledge versioned under `docs/`, and
promote repeated guidance into checks or scripts.

## Start Here

- Product overview: `README.md`
- Architecture map: `ARCHITECTURE.md`
- Knowledge base index: `docs/README.md`
- Code standards: `docs/CODE_STANDARDS.md`
- Product intent: `docs/PRODUCT_SENSE.md` and `docs/product-specs/`
- Active work: `docs/exec-plans/active/`
- Queued work: `docs/exec-plans/todo/`
- Backlog: `docs/exec-plans/backlog/`
- Completed work: `docs/exec-plans/completed/`
- Technical debt: `docs/exec-plans/tech-debt-tracker.md`
- Generated repo references: `docs/generated/`

## Required Workflow

1. Read the smallest relevant docs before editing. Start with this file, then
   follow links into the area you are touching.
2. For substantial or multi-step work, create an execution plan from
   `docs/exec-plans/templates/exec-plan-template.md` and keep it updated.
3. When a rule is likely to matter again, encode it in docs or tooling instead
   of leaving it only in a chat thread.
4. Before handoff, run the narrowest useful verification. Prefer `npm run check`
   for full verification and report any checks that could not be run.
5. Preserve user changes. Do not revert unrelated edits.

## Commands

- Install dependencies: `npm install`
- Build: `npm run build`
- Typecheck: `npm run typecheck`
- Smoke test: `npm test`
- Format and fix lint issues: `npm run fix`
- Check Ultracite: `npm exec -- ultracite check`
- Generate repo reference docs: `npm run docs:generate`
- Check harness structure: `npm run harness:check`
- Full local verification: `npm run check`

## Repository Shape

- `src/commands/` owns CLI command orchestration.
- `src/lib/` owns reusable filesystem, config, process, and patch helpers.
- `src/addons/` owns add-on specific generated files and package requirements.
- `src/templates.ts` owns base app scaffolding for supported templates.
- `src/test/` contains executable smoke coverage for generated output.
- `docs/` is the source of truth for durable project knowledge.

## Quality Bar

Follow `docs/CODE_STANDARDS.md`. Keep generated scaffolds legible, explicit, and
mechanically validated. If documentation and behavior diverge, fix both or
explain the gap in the relevant plan.
