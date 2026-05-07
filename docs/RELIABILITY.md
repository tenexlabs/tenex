# Reliability

Tenex reliability means the CLI can be re-run safely, generated files do not
silently overwrite user work, and users get actionable diagnostics when setup is
incomplete.

## Expectations

- Preflight conflict checks before writing managed files.
- Idempotent add-on application where possible.
- Clear error messages for missing files, unsupported project shape, and missing
  env vars.
- Doctor checks that align with enabled add-ons in `tenex.json`.
- Deploy handoff output that records required manual follow-up.

## Verification

- Use `npm test` for generated scaffold smoke coverage.
- Add focused tests when changing patching, env var requirements, or add-on
  idempotency.
- Use `npm run harness:check` after changing repository structure or docs.

## Failure Handling

- Throw `Error` objects with actionable messages.
- Avoid partially mutating projects when a conflict is detectable upfront.
- When partial mutation cannot be avoided, document the recovery path in command
  output or a handoff file.
