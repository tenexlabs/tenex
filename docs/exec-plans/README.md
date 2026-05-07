# Execution Plans

Execution plans preserve intent, progress, decisions, and verification for work
that should outlive one conversation.

## Layout

- `active/`: plans currently being executed.
- `todo/`: committed near-term work that is not currently active.
- `backlog/`: accepted future work that is not yet scheduled.
- `completed/`: finished plans with outcomes and verification.
- `templates/`: reusable plan templates.
- `tech-debt-tracker.md`: follow-up work discovered during implementation.

## Naming

Use lowercase kebab-case filenames:

- `active/add-provider-health-checks.md`
- `todo/expand-addon-tests.md`
- `backlog/p1-feat-support-additional-ai-providers.md`
- `completed/scaffold-harness-docs.md`

Backlog plans should start with priority and type prefixes:

- `p0-`: security, correctness, or release-blocking work.
- `p1-`: foundational near-term work.
- `p2-`: major product expansion or operational maturity.
- `p3-`: later-stage breadth, polish, or optional ecosystem work.

Use the type prefix after the priority:

- `feat-`: new product, CLI, generated-app, or add-on capability.
- `fix-`: correctness, security, reliability, or lifecycle fix.
- `test-`: verification, fixture, or coverage work.
- `dx-`: user, maintainer, or agent workflow improvement.
- `infra-`: packaging, release, deployment, migration, or extension
  infrastructure.

## Required Sections

Use `templates/exec-plan-template.md` for substantial work. Keep the progress
log current as steps are completed.
