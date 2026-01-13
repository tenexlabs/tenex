# tenex

CLI tool to scaffold full-stack apps with TanStack Start, Convex, and Better Auth.

## Installation

Use directly via `npx`:

```bash
npx tenex new my-app
```

Or install globally:

```bash
npm install -g tenex
```

## Commands

### `tenex new [name]` / `tenex init [name]`

Create a new project with TanStack Start + Convex + Better Auth.

```bash
npx tenex new my-app
```

This will:
1. Scaffold a TanStack Start project with Convex using `create-convex`
2. Add Better Auth with Convex integration
3. Generate a clean landing page, login, signup, and dashboard
4. Set up a shared navbar component with auth state handling

### `tenex add auth`

Add Better Auth to an existing TanStack Start + Convex project:

```bash
npx tenex add auth
```

## What You Get

- **TanStack Start** - Full-stack React framework with file-based routing
- **Convex** - Real-time backend with automatic syncing
- **Better Auth** - Email/password authentication out of the box
- **Black & Red Theme** - Clean, modern UI with Space Mono font
- **Shared Navbar** - Responsive navigation with auth-aware buttons
- **Pre-built Pages**:
  - Landing page with hero section
  - Login and signup forms
  - Protected dashboard with user info

## Quick Start

```bash
# Create new project
npx tenex new my-app

# Navigate to project
cd my-app

# Start Convex dev server (in one terminal)
npx convex dev

# Start the app (in another terminal)
npm run dev
```

## Requirements

- Node.js 18+
- npm

## License

Apache-2.0
