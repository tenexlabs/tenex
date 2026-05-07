# Quality Score

Last reviewed: 2026-05-07.

Use this document to make quality visible over time. Update scores after
meaningful changes, audits, or doc-gardening passes.

| Area | Score | Evidence |
| --- | --- | --- |
| CLI command routing | 100% / A+ / 10/10 | `src/cli.ts` keeps routing small and explicit. `src/test/smoke.ts` covers positional args, `--flag=value`, `--flag value`, `--yes`, `-y`, fixed add-on booleans, disabled add-on values, `--pm`, and `--` terminator behavior used by non-interactive commands. |
| Generated file safety | 100% / A+ / 10/10 | Managed files flow through `src/lib/generated-files.ts`; auth conflict preflight preserves existing files and prevents partial writes; smoke coverage checks overwrite-safe starter replacement and generated-file idempotency. |
| Add-on idempotency | 100% / A+ / 10/10 | Smoke coverage verifies representative re-runs plus provider-specific generated files, package metadata, and env requirements for Stripe, Autumn, Resend, PostHog, Convex storage, R2 storage, teams, and admin. |
| Product specs | 100% / A+ / 10/10 | `docs/product-specs/tenex-cli.md` and `docs/product-specs/generated-app-contract.md` define command, manifest, generated-file, runtime, UX, verification, and visual-regression boundaries. |
| Documentation harness | 100% / A+ / 10/10 | `npm run harness:check` enforces required docs, generated-doc freshness, plan directory usability, root-agent links, doc-index links, and `src/lib/` dependency direction. |
| CI feedback | 100% / A+ / 10/10 | CI runs `npm run check`; that now includes typecheck, smoke tests, Ultracite, harness checks, and `npm run pack:check` package dry-run validation. `prepublishOnly` also runs the full check. |

## Current Gaps

None for the current repository-owned quality criteria.
