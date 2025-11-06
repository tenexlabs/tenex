#!/usr/bin/env -S npx --yes tsx

import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';
import * as p from '@clack/prompts';
import { cancel, isCancel } from '@clack/prompts';

const args = process.argv.slice(2);
const command = args[0];


// Load .gitignore-style patterns from a directory
function loadIgnoreFile(rootDir: string) {
  const ignorePath = path.join(rootDir, '.gitignore');
  if (!fs.existsSync(ignorePath)) return null as const;

  const raw = fs.readFileSync(ignorePath, 'utf-8');
  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));

  type Rule = {
    negate: boolean;
    dirOnly: boolean;
    anchored: boolean;
    hasGlob: boolean;
    pattern: string; // normalized POSIX pattern without leading '!' or trailing '/'
    parts: string[]; // split by '/'
  };

  const rules: Rule[] = lines.map((line) => {
    let negate = false;
    if (line.startsWith('!')) {
      negate = true;
      line = line.slice(1);
    }
    let dirOnly = false;
    if (line.endsWith('/')) {
      dirOnly = true;
      line = line.slice(0, -1);
    }
    let anchored = false;
    if (line.startsWith('/')) {
      anchored = true;
      line = line.slice(1);
    }
    // Normalize to POSIX separators
    const pattern = line.replace(/\\/g, '/');
    const parts = pattern.split('/').filter(Boolean);
    const hasGlob = /[\*\?]/.test(pattern);
    return { negate, dirOnly, anchored, hasGlob, pattern, parts };
  });

  const toPosix = (p: string) => p.split(path.sep).join('/');

  const basename = (p: string) => {
    const idx = p.lastIndexOf('/');
    return idx >= 0 ? p.slice(idx + 1) : p;
  };

  const escapeRegex = (s: string) => s.replace(/[.+^${}()|[\]\\]/g, '\\$&');

  const makeNameRegex = (g: string) => new RegExp('^' + escapeRegex(g).replace(/\\\*/g, '[^/]*').replace(/\\\?/g, '[^/]') + '$');

  function ruleMatches(rule: Rule, relPosix: string, isDir: boolean): boolean {
    // Root normalize: remove leading './'
    if (relPosix.startsWith('./')) relPosix = relPosix.slice(2);
    // Simple name rule without glob and without '/': matches any segment name
    if (!rule.anchored && !rule.hasGlob && rule.parts.length === 1) {
      const name = rule.parts[0];
      const relBase = basename(relPosix);
      return relBase === name;
    }

    // Anchored path without globs: treat as path prefix for directories, exact for files
    if (rule.anchored && !rule.hasGlob) {
      const pat = rule.parts.join('/');
      if (isDir) {
        return relPosix === pat || relPosix.startsWith(pat + '/');
      }
      return relPosix === pat;
    }

    // Unanchored path without globs but with '/': match if any path segment sequence equals pattern
    if (!rule.anchored && !rule.hasGlob && rule.parts.length > 1) {
      // Check any occurrence of the pattern within rel path
      const pat = '/' + rule.parts.join('/') + (isDir ? '/' : '');
      const hay = '/' + relPosix + (isDir ? '/' : '');
      return hay.includes(pat);
    }

    // Glob patterns
    const pattern = rule.pattern;
    const re = makeNameRegex(pattern);

    if (rule.anchored || pattern.includes('/')) {
      // Path-aware glob: test against the whole relative path
      return re.test(relPosix);
    } else {
      // Name-only glob: test basename
      return re.test(basename(relPosix));
    }
  }

  const ignores = (relPath: string, isDir: boolean) => {
    const relPosix = toPosix(relPath);
    let ignored = false;
    for (const rule of rules) {
      const match = ruleMatches(rule, relPosix, isDir);
      if (match) {
        ignored = !rule.negate;
      }
    }
    // If dirOnly flag exists on a matching rule, we already used it via isDir checks by caller
    return ignored;
  };

  return { ignores };
}

// Helper function to recursively copy a directory honoring .gitignore in the template
function copyDirectory(src: string, dest: string, rootSrc?: string, ignorer?: { ignores: (p: string, isDir: boolean) => boolean }): void {
  if (!rootSrc) rootSrc = src;
  if (!ignorer) ignorer = loadIgnoreFile(rootSrc) || undefined;
  // Create destination directory if it doesn't exist
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    const relPath = path.relative(rootSrc, srcPath);

    // Skip if ignored by template's .gitignore rules
    if (ignorer && ignorer.ignores(relPath, entry.isDirectory())) {
      continue;
    }

    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath, rootSrc, ignorer);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Helper function to sanitize project name (remove invalid characters)
function sanitizeProjectName(name: string): string {
  // Replace invalid characters with hyphens, remove leading/trailing hyphens
  return name
    .replace(/[^a-z0-9-]/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

// Helper function to find an available directory name
function findAvailableDirectory(baseName: string, baseDir: string = process.cwd()): string {
  let projectDir = path.join(baseDir, baseName);
  let counter = 1;
  
  while (fs.existsSync(projectDir)) {
    const newName = `${baseName}-${counter}`;
    projectDir = path.join(baseDir, newName);
    counter++;
  }
  
  return path.basename(projectDir);
}

// Helper function to run npm install in a directory
function runNpmInstall(cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log('\nInstalling dependencies...');
    const npmProcess = spawn('npm', ['install'], {
      cwd,
      stdio: 'inherit',
      shell: true,
    });

    npmProcess.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`npm install failed with exit code ${code}`));
      }
    });

    npmProcess.on('error', (err) => {
      reject(new Error(`Failed to run npm install: ${err.message}`));
    });
  });
}

if (command === 'init') {
  // Run commands sequentially
  (async () => {
    try {
      // Get project name from argument or prompt
      let projectName = args[1];
      
      if (!projectName) {
        const nameInput = await p.text({
          message: 'Project name',
          placeholder: 'my-app',
          defaultValue: 'my-app',
        });
        
        if (isCancel(nameInput) || !nameInput) {
          cancel('Operation cancelled.');
          process.exit(0);
        }
        projectName = nameInput;
      }
      
      // Sanitize project name (auto-fix invalid characters)
      const sanitizedName = sanitizeProjectName(projectName);
      if (sanitizedName !== projectName) {
        p.log.warn(`Project name sanitized: "${projectName}" → "${sanitizedName}"`);
        projectName = sanitizedName;
      }
      
      if (!projectName) {
        console.error('Project name cannot be empty after sanitization');
        process.exit(1);
      }
      
      // Check if directory already exists and prompt user for action
      let finalProjectName = projectName;
      const baseProjectDir = path.join(process.cwd(), projectName);
      
      if (fs.existsSync(baseProjectDir)) {
        const availableName = findAvailableDirectory(projectName);
        const suggestedName = availableName !== projectName ? availableName : `${projectName}-1`;
        
        p.log.warn(`Directory "${projectName}" already exists`);
        
        const choice = await p.select({
          message: 'What would you like to do?',
          options: [
            { value: 'different', label: `Use a different name (suggested: "${suggestedName}")` },
            { value: 'overwrite', label: 'Overwrite the existing directory' },
            { value: 'cancel', label: 'Cancel' },
          ],
          initialValue: 'different',
        });
        
        if (isCancel(choice) || choice === 'cancel') {
          cancel('Operation cancelled.');
          process.exit(0);
        } else if (choice === 'overwrite') {
          // Remove the existing directory
          p.log.info(`Removing existing directory "${projectName}"...`);
          fs.rmSync(baseProjectDir, { recursive: true, force: true });
          finalProjectName = projectName;
        } else {
          // Use different name - prompt for new name with suggested default
          const nameInput = await p.text({
            message: 'Enter a new project name',
            placeholder: suggestedName,
            defaultValue: suggestedName,
          });
          
          if (isCancel(nameInput)) {
            cancel('Operation cancelled.');
            process.exit(0);
          }
          
          let newName = nameInput || suggestedName;
          if (newName.trim() === '') {
            newName = suggestedName;
          }
          newName = sanitizeProjectName(newName);
          if (!newName) {
            p.log.error('Invalid project name');
            process.exit(1);
          }
          // Check if this new name also exists
          let newProjectDir = path.join(process.cwd(), newName);
          if (fs.existsSync(newProjectDir)) {
            // Automatically find available name if the entered one exists
            finalProjectName = findAvailableDirectory(newName);
            if (finalProjectName !== newName) {
              p.log.warn(`Directory "${newName}" also exists, using "${finalProjectName}" instead`);
            } else {
              finalProjectName = newName;
            }
          } else {
            finalProjectName = newName;
          }
        }
      }
      
      const projectDir = path.join(process.cwd(), finalProjectName);
      
      // Get the template directory path (relative to this CLI file)
      // process.argv[1] is the script file being executed (the CLI file)
      // Resolve symlinks to get the actual file path (handles npm link)
      let cliFilePath = process.argv[1];
      try {
        // Resolve all symlinks in the path (handles npm link which creates nested symlinks)
        let resolved = fs.realpathSync(cliFilePath);
        cliFilePath = resolved;
      } catch (e) {
        // If realpathSync fails, try manual symlink resolution
        try {
          while (fs.lstatSync(cliFilePath).isSymbolicLink()) {
            const linkTarget = fs.readlinkSync(cliFilePath);
            cliFilePath = path.isAbsolute(linkTarget) 
              ? linkTarget 
              : path.resolve(path.dirname(cliFilePath), linkTarget);
          }
        } catch (e2) {
          // If symlink resolution fails, use the original path
        }
      }
      const cliDir = path.dirname(cliFilePath);
      const templateDir = path.join(cliDir, '..', 'templates', 'default');
      
      if (!fs.existsSync(templateDir)) {
        throw new Error(`Template directory not found: ${templateDir}`);
      }
      
      // Copy template to project directory
      p.log.info(`Creating convex project "${finalProjectName}" with tanstack-start template...`);
      copyDirectory(templateDir, projectDir);
      
      // Update package.json with the new project name
      const packageJsonPath = path.join(projectDir, 'package.json');
      if (!fs.existsSync(packageJsonPath)) {
        throw new Error(`package.json not found in ${projectDir}`);
      }
      
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      packageJson.name = finalProjectName;
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
      
      // Run npm install in the new project directory
      await runNpmInstall(projectDir);
      
      p.log.success('Setup complete!');
      console.log('\nNext steps:');
      console.log(`  cd ${finalProjectName}`);
      console.log('  npm run dev');
      
      // Ensure clean exit
      process.exit(0);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Error:', errorMessage);
      process.exit(1);
    }
  })();
} else if (command) {
  console.error(`Unknown command: ${command}`);
  console.error('Usage: tenex init [project-name]');
  process.exit(1);
} else {
  console.error('Usage: tenex init [project-name]');
  process.exit(1);
}
