# Product Specs

Product specs describe the behavior Tenex should preserve across agent runs.

## Specs

- `tenex-cli.md`: command surface, project state, add-ons, and expected command
  behavior.
- `generated-app-contract.md`: contract for files and behavior Tenex generates
  into user projects.

## Maintenance Rules

- Update specs when changing user-visible CLI behavior.
- Link specs from execution plans that depend on them.
- Keep specs concrete enough to drive tests and review.
