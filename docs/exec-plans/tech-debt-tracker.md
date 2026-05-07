# Technical Debt Tracker

Use this file for follow-up work that should be visible to future agents but
does not need to block the current change.

| Date | Area | Debt | Suggested Next Step | Status |
| --- | --- | --- | --- | --- |
| 2026-05-05 | Testing | Command parser behavior has limited direct tests. | Add focused tests for non-interactive `tenex new` and `tenex add` options. | Open |
| 2026-05-05 | Architecture | Dependency direction is documented but not structurally enforced. | Add a small import-boundary check if `src/` grows beyond the current layout. | Open |
