import { join } from 'node:path';
import { pathExists, readTextFile, writeTextFileIfChanged } from '../lib/fs';
import {
  type PackageManager,
  packageManagerDlxCommand,
  packageManagerExecCommand,
} from '../lib/package-manager';
import { replaceOrThrow } from '../lib/patch';
import { run } from '../lib/run';
import {
  requiresBetterAuthLocalInstall,
  type TenexManifest,
} from '../lib/tenex-config';
import { managedFile, writeAddonFiles } from './shared';

export async function applyBetterAuthLocalInstall(
  projectDir: string,
  manifest: TenexManifest,
  packageManager: PackageManager,
  options: {
    skipGenerate?: boolean;
  } = {}
): Promise<void> {
  if (!requiresBetterAuthLocalInstall(manifest)) {
    return;
  }

  await writeAddonFiles(localInstallFiles(projectDir));

  if (!options.skipGenerate) {
    const betterAuthDir = join(projectDir, 'convex', 'betterAuth');
    const generateSchema = packageManagerDlxCommand(
      packageManager,
      '@better-auth/cli@latest',
      ['generate', '-y']
    );
    await run(generateSchema.cmd, generateSchema.args, { cwd: betterAuthDir });

    const convexOnce = packageManagerExecCommand(packageManager, 'convex', [
      'dev',
      '--once',
    ]);
    await run(convexOnce.cmd, convexOnce.args, { cwd: projectDir });
  }

  await patchConvexConfigForLocalInstall(projectDir);
  await patchAuthForLocalInstall(projectDir);
}

function localInstallFiles(projectDir: string) {
  return [
    managedFile(
      join(projectDir, 'convex', 'betterAuth', 'convex.config.ts'),
      localConvexConfigSource()
    ),
    managedFile(
      join(projectDir, 'convex', 'betterAuth', 'auth.ts'),
      localAuthSource()
    ),
    managedFile(
      join(projectDir, 'convex', 'betterAuth', 'adapter.ts'),
      localAdapterSource()
    ),
  ];
}

async function patchAuthForLocalInstall(projectDir: string): Promise<void> {
  const authPath = join(projectDir, 'convex', 'auth.ts');
  if (!(await pathExists(authPath))) {
    throw new Error(`Missing auth config at ${authPath}`);
  }

  let current = await readTextFile(authPath);
  if (!current.includes("import authSchema from './betterAuth/schema'")) {
    current = replaceOrThrow(
      current,
      "import authConfig from './auth.config'\n",
      "import authConfig from './auth.config'\nimport authSchema from './betterAuth/schema'\n",
      'Could not add local Better Auth schema import to convex/auth.ts'
    );
  }

  if (!current.includes('createClient<DataModel, typeof authSchema>')) {
    current = replaceOrThrow(
      current,
      'export const authComponent = createClient<DataModel>(components.betterAuth)\n',
      `export const authComponent = createClient<DataModel, typeof authSchema>(components.betterAuth, {
  local: {
    schema: authSchema,
  },
})
`,
      'Could not enable local Better Auth schema client in convex/auth.ts'
    );
  }

  await writeTextFileIfChanged(authPath, current);
}

async function patchConvexConfigForLocalInstall(
  projectDir: string
): Promise<void> {
  const configPath = join(projectDir, 'convex', 'convex.config.ts');
  if (!(await pathExists(configPath))) {
    throw new Error(`Missing convex config at ${configPath}`);
  }

  let current = await readTextFile(configPath);
  if (!current.includes('./betterAuth/convex.config')) {
    current = replaceOrThrow(
      current,
      "import betterAuth from '@convex-dev/better-auth/convex.config'\n",
      "import betterAuth from './betterAuth/convex.config'\n",
      'Could not switch convex.config.ts to the local Better Auth install'
    );
  }

  await writeTextFileIfChanged(configPath, current);
}

function localConvexConfigSource(): string {
  return `import { defineComponent } from 'convex/server'

const component = defineComponent('betterAuth')

export default component
`;
}

function localAuthSource(): string {
  return `import { createAuth } from '../auth'

// Export a static auth instance so Better Auth can generate schema locally.
export const auth = createAuth({} as any)
`;
}

function localAdapterSource(): string {
  return `import { createApi } from '@convex-dev/better-auth'
import { createAuthOptions } from '../auth'
import schema from './schema'

export const {
  create,
  findOne,
  findMany,
  updateOne,
  updateMany,
  deleteOne,
  deleteMany,
} = createApi(schema, createAuthOptions)
`;
}
