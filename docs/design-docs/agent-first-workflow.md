# Agent-First Workflow

Tenex adapts harness engineering as a repository workflow rather than a product
feature. The goal is to make agent work easier to specify, verify, and maintain.

## Workflow

1. Start from `AGENTS.md`.
2. Follow the smallest relevant docs under `docs/`.
3. Create or update an execution plan for substantial work.
4. Make the code, docs, and generated references agree.
5. Run focused verification.
6. Promote repeated feedback into docs, tests, or scripts.

## Feedback Loops

- `npm run docs:generate` refreshes generated repo references.
- `npm run harness:check` verifies that the knowledge base remains navigable.
- `npm run check` runs the full local quality gate.
- `docs/exec-plans/tech-debt-tracker.md` records cleanup work that should not
  block the current change.

## Escalation

Escalate to a human when a decision changes product scope, provider strategy,
security posture, or compatibility guarantees. Otherwise prefer making the
smallest reversible change that follows the documented contracts.
