# Plans

Plans are first-class repository artifacts when work has enough uncertainty,
risk, or scope that future agents need the reasoning trail.

## When To Create A Plan

Create an execution plan for:

- Multi-step features.
- Changes touching more than one architectural layer.
- Work that needs user acceptance criteria preserved.
- Refactors where the order of operations matters.
- Reliability, security, or generated-output changes with meaningful blast
  radius.

For small edits, a lightweight in-thread plan is enough.

## Locations

- Active plans live in `docs/exec-plans/active/`.
- Todo plans live in `docs/exec-plans/todo/` when the work is committed but
  not yet active.
- Backlog plans live in `docs/exec-plans/backlog/` when the work is accepted
  but not scheduled.
- Completed plans move to `docs/exec-plans/completed/`.
- Reusable plan format lives in
  `docs/exec-plans/templates/exec-plan-template.md`.
- Debt discovered during work goes in
  `docs/exec-plans/tech-debt-tracker.md`.

## Completion Rules

Before moving a plan to completed:

- Update the status and outcome.
- Record meaningful decisions and verification.
- Link follow-up debt if any remains.
- Make sure docs and generated references are current.
