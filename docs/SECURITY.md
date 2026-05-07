# Security

Tenex scaffolds auth, billing, email, analytics, storage, teams, and admin
surfaces. Security rules should be explicit because generated code is copied
into user-owned applications.

## CLI Rules

- Do not log secrets.
- Do not write real credentials into generated source files.
- Keep env requirements centralized through `src/lib/tenex-config.ts`.
- Validate provider selections before generating files.
- Avoid executing package-manager commands that are not tied to the selected
  package manager.

## Generated App Rules

- Auth scaffold must preserve trusted-origin and secret requirements.
- Billing and webhook code should keep secrets server-side.
- Admin scaffolding must require explicit admin identifiers.
- Storage providers should document public/private object assumptions.
- Analytics scaffolding should keep client keys distinct from server secrets.

## Review Checklist

- Does this change introduce a new env var? Update doctor expectations and docs.
- Does generated code touch auth, billing, storage, or admin behavior? Add
  focused verification.
- Does command output include user-supplied values? Check for secret exposure.
- Does a patch edit existing app code? Confirm it is idempotent.
