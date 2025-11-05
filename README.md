# tenex

CLI tool to initialize Convex projects with TanStack Start template and Cursor rules.

## Installation

You can use `tenex` directly via `npx` without installing:

```bash
npx tenex init
```

Or install it globally:

```bash
npm install -g tenex
```

## Usage

### Initialize a new project

```bash
npx tenex init [project-name]
```

**Options:**
- `project-name` (optional): Name of your project directory. If not provided, you'll be prompted interactively with a default value of `my-app`.

### Example

```bash
# With project name
npx tenex init my-awesome-app

# Without project name (interactive prompt)
npx tenex init
# Project name: my-app
```

## What it does

When you run `tenex init`, it will:

1. **Create a new Convex project** with the TanStack Start template
   - Runs: `npm create convex@latest <project-name> -- -t tanstack-start`

2. **Install Cursor rules** for enhanced IDE support
   - Runs: `npx vibe-rules install cursor` inside the created project directory
   - Installs rules for TanStack React Router and other dependencies

3. **Ready to go!** You'll see instructions on how to start your project

## Requirements

- Node.js (any recent version)
- npm

## License

Apache-2.0