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
- `backlog/support-additional-ai-providers.md`
- `completed/scaffold-harness-docs.md`

## Required Sections

Use `templates/exec-plan-template.md` for substantial work. Keep the progress
log current as steps are completed.
