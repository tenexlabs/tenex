# Harness Engineering Reference

Source:
[Harness engineering: leveraging Codex in an agent-first world](https://openai.com/index/harness-engineering/),
OpenAI, published 2026-02-11.

## Local Takeaways

- Keep `AGENTS.md` short and use it as a map.
- Treat structured `docs/` as the repository system of record.
- Store execution plans, design decisions, product specs, quality notes, and
  generated references in version control.
- Make application state, logs, docs, and tests legible to agents.
- Enforce architecture and taste with checks where possible.
- Turn repeated cleanup into recurring, targeted work instead of occasional
  large rewrites.

## Tenex Implementation

- Root agent files now point into `docs/`.
- `docs/exec-plans/` provides active and completed plan directories plus a
  template.
- `docs/generated/` is refreshed by `npm run docs:generate`.
- `npm run harness:check` enforces the minimum knowledge-base structure and
  generated-doc freshness.
- `docs/QUALITY_SCORE.md` and `docs/exec-plans/tech-debt-tracker.md` make gaps
  explicit for future agent runs.
