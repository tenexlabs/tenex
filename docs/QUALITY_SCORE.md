# Quality Score

Last reviewed: 2026-05-05.

Use this document to make quality visible over time. Update scores after
meaningful changes, audits, or doc-gardening passes.

| Area | Score | Notes |
| --- | --- | --- |
| CLI command routing | B | Small command surface with clear routing. Needs argument-level tests beyond smoke coverage. |
| Generated file safety | B+ | Managed file conflict checks exist. More patch edge cases can be covered. |
| Add-on idempotency | B | Smoke tests cover representative paths. Provider-specific regressions need narrower tests. |
| Product specs | B | Core contracts are now documented. Keep them current as add-ons evolve. |
| Documentation harness | A- | Structure and checks exist. Freshness depends on regular use of generated docs. |
| CI feedback | B | Basic workflow exists. No release or package-publish validation yet. |

## Current Gaps

- Add command parser tests for non-interactive options.
- Expand add-on tests for provider-specific generated files.
- Add structural checks for `src/lib/` dependency direction if the codebase
  grows.
- Decide whether generated app visual regression testing belongs in this repo
  or downstream fixtures.
