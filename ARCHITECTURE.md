# Architecture

Tenex is a TypeScript CLI that scaffolds founder-ready TanStack Start and
Convex applications. The architecture is intentionally simple so agents can
navigate it from a small number of stable boundaries.

## Runtime Boundary

The published executable is `dist/cli.js`, built from `src/cli.ts`. The CLI
parses the command, delegates to a command module, and lets command modules
orchestrate prompts, project discovery, generated files, package installation,
and validation.

## Source Layout

- `src/cli.ts` is the executable entrypoint and command router.
- `src/commands/` contains command-level workflows such as `new`, `add`,
  `doctor`, `dev`, and `deploy`.
- `src/lib/` contains shared helpers for arguments, filesystem access,
  generated-file safety, project config, package manager commands, patches, and
  process execution.
- `src/addons/` contains provider-specific add-on implementations.
- `src/templates.ts` contains the base project scaffold for supported Tenex
  templates.
- `src/test/` contains smoke tests that exercise generated output.

## Dependency Direction

Keep dependencies moving in this direction:

1. `src/cli.ts` may import command modules.
2. Command modules may import `src/lib/`, `src/addons/`, and `src/templates.ts`.
3. Add-on modules may import `src/lib/` helpers and shared add-on helpers.
4. `src/lib/` should not import command modules, add-on modules, or templates.
5. Tests may import any production module needed to validate behavior.

When this direction is awkward, prefer extracting a helper into `src/lib/` over
creating a back edge.

## Generated File Contract

Generated app files must go through `src/lib/generated-files.ts` so Tenex can
detect conflicts before writing. Managed files should be wrapped with the
managed-source banner. If a command needs to edit an existing user file, use the
patch helpers and keep the patch idempotent.

## Add-On Contract

Each add-on owns:

- Prompt and provider labels when applicable.
- Generated source files for that provider.
- Required packages.
- Env vars surfaced through `src/lib/tenex-config.ts`.
- Doctor/deploy expectations when the provider affects runtime behavior.

Add-ons should be independently idempotent and safe to re-run.

## Verification

Use the tightest verification that covers the change:

- `npm run typecheck` for TypeScript contracts.
- `npm test` for generated scaffold behavior.
- `npm exec -- ultracite check` for formatting and lint rules.
- `npm run harness:check` for repository knowledge-base structure.
- `npm run check` before larger handoffs.
