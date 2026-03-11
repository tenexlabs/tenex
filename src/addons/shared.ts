import { join } from 'node:path';
import { resolveAppSourceDir } from '../lib/app-source';
import { pathExists, readTextFile, writeTextFileIfChanged } from '../lib/fs';
import {
  assertNoGeneratedFileConflicts,
  type GeneratedFile,
  makeManagedSource,
  writeGeneratedFiles,
} from '../lib/generated-files';
import { replaceOrThrow } from '../lib/patch';

const BETTER_AUTH_PLUGIN_IMPORT_REGEX =
  /import \{ ([^}]+) \} from 'better-auth\/plugins'/;

export async function writeAddonFiles(files: GeneratedFile[]): Promise<void> {
  await assertNoGeneratedFileConflicts(files);
  await writeGeneratedFiles(files);
}

export function managedFile(filePath: string, contents: string): GeneratedFile {
  return {
    filePath,
    contents: makeManagedSource(contents),
    managed: true,
  };
}

export async function ensureConvexComponentInConfig(options: {
  importName: string;
  importPath: string;
  projectDir: string;
  useStatement: string;
}): Promise<void> {
  const configPath = join(options.projectDir, 'convex', 'convex.config.ts');
  if (!(await pathExists(configPath))) {
    throw new Error(`Missing convex config at ${configPath}`);
  }

  let current = await readTextFile(configPath);
  const importStatement = `import ${options.importName} from '${options.importPath}'`;
  if (!current.includes(importStatement)) {
    current = replaceOrThrow(
      current,
      "import betterAuth from '@convex-dev/better-auth/convex.config'\n",
      `import betterAuth from '@convex-dev/better-auth/convex.config'\n${importStatement}\n`,
      `Could not add ${options.importName} import to convex.config.ts`
    );
  }
  if (!current.includes(options.useStatement)) {
    current = replaceOrThrow(
      current,
      'app.use(betterAuth)\n',
      `app.use(betterAuth)\n${options.useStatement}\n`,
      `Could not register ${options.importName} in convex.config.ts`
    );
  }

  await writeTextFileIfChanged(configPath, current);
}

export async function ensureBetterAuthPlugins(options: {
  pluginCalls: string[];
  pluginImports: string[];
  projectDir: string;
}): Promise<void> {
  const authPath = join(options.projectDir, 'convex', 'auth.ts');
  if (!(await pathExists(authPath))) {
    throw new Error(`Missing auth config at ${authPath}`);
  }

  let current = await readTextFile(authPath);

  if (options.pluginImports.length > 0) {
    const importStatement = `import { ${options.pluginImports.join(', ')} } from 'better-auth/plugins'`;
    if (current.includes("from 'better-auth/plugins'")) {
      for (const pluginImport of options.pluginImports) {
        if (current.includes(pluginImport)) {
          continue;
        }
        current = current.replace(
          BETTER_AUTH_PLUGIN_IMPORT_REGEX,
          (_match, imports) =>
            `import { ${imports}, ${pluginImport} } from 'better-auth/plugins'`
        );
      }
    } else {
      current = replaceOrThrow(
        current,
        "import { convex } from '@convex-dev/better-auth/plugins'\n",
        `import { convex } from '@convex-dev/better-auth/plugins'\n${importStatement}\n`,
        'Could not add Better Auth plugin imports to convex/auth.ts'
      );
    }
  }

  for (const pluginCall of options.pluginCalls) {
    if (current.includes(pluginCall)) {
      continue;
    }
    current = replaceOrThrow(
      current,
      'convex({ authConfig })',
      `${pluginCall}, convex({ authConfig })`,
      `Could not add ${pluginCall} to Better Auth plugins`
    );
  }

  await writeTextFileIfChanged(authPath, current);
}

export async function projectScaffoldPaths(projectDir: string): Promise<{
  srcDir: string;
  routesDir: string;
}> {
  const srcDir = await resolveAppSourceDir(projectDir);
  return {
    srcDir,
    routesDir: join(srcDir, 'routes'),
  };
}
