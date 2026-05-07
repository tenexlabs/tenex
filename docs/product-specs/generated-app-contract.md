# Generated App Contract

Tenex-generated applications should be easy for founders and agents to inspect,
edit, and extend.

## File Ownership

- Managed files must carry the Tenex generated-source banner.
- Existing user files should only be changed through idempotent patches.
- Generated route and component names should remain stable across re-runs.

## Runtime Contract

- Generated apps use TanStack Start and Convex.
- Auth uses Better Auth with Convex integration.
- Optional add-ons expose setup requirements through env vars and generated
  handoff text.
- Template metadata lives in `src/lib/tenex.generated.ts`.

## UX Contract

- Generated screens should be usable immediately.
- Add-on status should be visible in founder-facing surfaces where relevant.
- Empty states should show concrete next actions.
- Settings and admin surfaces should avoid placeholder-only UI.

## Verification Contract

Changes to templates or add-ons should include smoke coverage that reads the
generated files and checks for the expected integration points.

## Visual Regression Boundary

Tenex does not keep browser screenshot baselines in the core CLI repository.
This repository owns deterministic checks that can run without provider
credentials: TypeScript contracts, source smoke assertions, generated-doc
freshness, harness structure, and package dry-run validation.

Visual regression testing belongs in downstream generated-app fixture suites.
Those suites can install a packaged Tenex CLI, create representative apps, run
the TanStack Start and Convex dev servers, and compare rendered browser states
with stable fixture assets. Pull visual regression into this repository only if
those fixture apps become a maintained local test target.
