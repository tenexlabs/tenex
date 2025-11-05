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

### Examples

```bash
# With project name
npx tenex init my-awesome-app

# Without project name (interactive prompt)
npx tenex init
# You'll be prompted: Project name: my-app
```

## Features

### 🎯 Interactive Prompts
- **Arrow key navigation** for selecting options
- Beautiful, modern CLI interface powered by [clack](https://github.com/natemoo-re/clack)
- Intuitive prompts with helpful defaults

### 🛡️ Smart Project Name Handling
- **Auto-sanitization**: Invalid characters are automatically converted (e.g., `My Project!` → `my-project`)
- Names are automatically lowercased and formatted according to npm naming conventions

### 📁 Existing Directory Handling
If a directory with the same name already exists, you'll be prompted with options:
- **Use a different name** (with automatic suggestions like `project-name-1`)
- **Overwrite the existing directory**
- **Cancel** the operation

Use arrow keys to navigate and press Enter to select.

### ⚡ Automatic Setup
- Copies the complete template with all configuration files
- Automatically runs `npm install` to install all dependencies
- Updates `package.json` with your project name
- Provides clear next steps after completion

## What it does

When you run `tenex init`, it will:

1. **Prompt for project name** (if not provided as an argument)
   - Shows a default value that you can accept by pressing Enter
   - Auto-sanitizes invalid characters and shows a warning if changes were made

2. **Handle existing directories** (if applicable)
   - Prompts you to choose: use different name, overwrite, or cancel
   - Suggests available names automatically

3. **Create the project structure**
   - Copies the TanStack Start template with Convex integration
   - Includes Cursor rules for enhanced IDE support
   - Sets up all necessary configuration files

4. **Install dependencies**
   - Automatically runs `npm install` in the new project directory
   - Shows progress during installation

5. **Ready to go!**
   - Displays clear instructions on how to start your project:
     ```bash
     cd <project-name>
     npm run dev
     ```

## Template Includes

- ✅ TanStack Start with React Router
- ✅ Convex backend integration
- ✅ Cursor rules for better IDE experience
- ✅ TypeScript configuration
- ✅ ESLint setup
- ✅ Pre-configured routing structure
- ✅ Example pages and components

## Requirements

- Node.js (any recent version)
- npm

## License

Apache-2.0