# tenex

Founder-ready CLI for scaffolding TanStack Start + Convex apps with Better Auth and component-first add-ons.

## What Tenex Creates

- Guided project builder with persisted `tenex.json`
- Three templates:
  - `saas-core`
  - `ai-saas`
  - `waitlist`
- Better Auth + Convex auth scaffold
- Founder-facing product shell:
  - Landing page
  - Dashboard
  - Onboarding
  - Settings
  - Pricing
- Component-first add-ons when available:
  - Billing: Stripe component or Autumn component
  - Email: Resend component
  - Analytics: PostHog
  - Storage: Convex file storage or Cloudflare R2 component
  - Teams: Better Auth organization
  - Admin: custom same-app admin panel

## Install

Use directly:

```bash
npx tenex new my-app
```

Or install globally:

```bash
npm install -g tenex
```

## Commands

### `tenex new [name]`

Creates a new founder-ready app and prompts for:

- package manager
- template
- billing provider
- storage provider
- optional email
- optional analytics
- optional teams
- optional admin panel

Non-interactive example:

```bash
npx tenex new my-app \
  --yes \
  --template saas-core \
  --package-manager npm \
  --billing stripe \
  --storage convex \
  --email resend \
  --analytics posthog \
  --teams organization \
  --admin panel
```

### `tenex add <addon>`

Adds or enables an addon in an existing Tenex project.

```bash
tenex add billing --provider stripe
tenex add storage --provider r2
tenex add email --provider resend
tenex add analytics --provider posthog
tenex add teams --provider organization
tenex add admin --provider panel
```

### `tenex doctor`

Checks `tenex.json`, local env files, and Convex env vars against the enabled addon set.

### `tenex dev`

Runs Convex and the app together using the project package manager.

### `tenex deploy`

Writes `TENEX_HANDOFF.md` and runs the Convex deploy step after env validation.

## Generated Project Files

Tenex writes:

- `tenex.json` for scaffold state
- a project-specific `README.md`
- managed scaffold files for the selected template
- addon-specific files and Convex config updates

## Development

```bash
npm run build
npm test
npm exec -- ultracite check
```
