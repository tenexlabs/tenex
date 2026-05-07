# Tenex CLI Spec

## Purpose

Tenex scaffolds TanStack Start and Convex applications with founder-ready
product surfaces and optional component-first add-ons.

## Commands

- `tenex new [name]` or `tenex init [name]`: create a new project and persist
  `tenex.json`.
- `tenex add <addon>`: add or enable an add-on in an existing Tenex project.
- `tenex doctor`: validate project config and env requirements.
- `tenex dev`: run Convex and the app through the selected package manager.
- `tenex deploy`: write `TENEX_HANDOFF.md` and run deployment checks.

## Templates

- `saas-core`: B2B SaaS workspace with core operating surfaces.
- `ai-saas`: usage-driven AI product shell.
- `waitlist`: prelaunch product with launch-readiness surfaces.

## Add-Ons

- Auth: Better Auth with Convex is part of the baseline scaffold.
- Billing: Stripe, Autumn, or none.
- Email: Resend or none.
- Analytics: PostHog or none.
- Storage: Convex file storage, Cloudflare R2, or none.
- Teams: Better Auth organization or none.
- Admin: same-app admin panel or none.

## State

`tenex.json` is the source of truth for selected template, package manager, and
enabled add-ons. Commands should read and update this manifest instead of
guessing project state from generated files.

## Error Behavior

- Refuse to overwrite unmanaged user files.
- Provide actionable errors for missing project files, invalid selections, and
  missing env vars.
- Keep command output concise and focused on next steps.
