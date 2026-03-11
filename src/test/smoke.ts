import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  applyAuthAddon,
  BETTER_AUTH_VERSION,
  generateBetterAuthSecret,
} from '../addons/auth';
import { applyBetterAuthLocalInstall } from '../addons/better-auth-local';
import { applyManifestAddons } from '../addons/catalog';
import { pathExists, readTextFile, removeDir, writeTextFile } from '../lib/fs';
import { sanitizeProjectName } from '../lib/project-name';
import { createTenexManifest } from '../lib/tenex-config';
import { applyTemplate } from '../templates';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function makeTempProject(): Promise<string> {
  const projectDir = await mkdtemp(join(tmpdir(), 'tenex-smoke-'));

  await writeTextFile(
    join(projectDir, 'vite.config.ts'),
    `export default defineConfig({
  plugins: [],
})
`
  );
  await writeTextFile(
    join(projectDir, 'tsconfig.json'),
    `{
  "compilerOptions": {
    "target": "ES2020"
  }
}
`
  );
  await writeTextFile(
    join(projectDir, 'src', 'router.tsx'),
    `export const router = createRouter({
  context: { queryClient },
})
`
  );

  return projectDir;
}

async function testAuthAddonPreservesExistingFiles() {
  const projectDir = await makeTempProject();

  try {
    const conflictingIndex = join(projectDir, 'src', 'routes', 'index.tsx');
    const originalRouter = await readTextFile(
      join(projectDir, 'src', 'router.tsx')
    );

    await writeTextFile(
      conflictingIndex,
      'export const existingRoute = true\n'
    );

    let error: Error | undefined;
    try {
      await applyAuthAddon(projectDir);
    } catch (caught) {
      error = caught instanceof Error ? caught : new Error(String(caught));
    }

    assert(
      error,
      'applyAuthAddon should fail when a generated file already exists'
    );
    assert(
      error.message.includes('src/routes/index.tsx'),
      'conflict error should list the existing route file'
    );
    assert(
      (await readTextFile(conflictingIndex)) ===
        'export const existingRoute = true\n',
      'existing route content should remain unchanged'
    );
    assert(
      (await readTextFile(join(projectDir, 'src', 'router.tsx'))) ===
        originalRouter,
      'preflight conflict detection should stop before patching other files'
    );
    assert(
      !(await pathExists(join(projectDir, 'src', 'lib', 'auth-client.ts'))),
      'generated auth files should not be written when conflicts exist'
    );
  } finally {
    await removeDir(projectDir);
  }
}

async function testAuthAddonScaffoldIsIdempotent() {
  const projectDir = await makeTempProject();

  try {
    await applyAuthAddon(projectDir);
    await applyAuthAddon(projectDir);

    const convexAuth = await readTextFile(
      join(projectDir, 'convex', 'auth.ts')
    );
    assert(
      convexAuth.includes('.split(/[\\s,]+/g)'),
      'generated convex auth file should split trusted origins on whitespace'
    );
  } finally {
    await removeDir(projectDir);
  }
}

async function testAuthAddonCanOverwriteFreshStarterFiles() {
  const projectDir = await makeTempProject();

  try {
    await writeTextFile(
      join(projectDir, 'src', 'routes', '__root.tsx'),
      'export const starterRoot = true\n'
    );
    await writeTextFile(
      join(projectDir, 'src', 'routes', 'index.tsx'),
      'export const starterIndex = true\n'
    );

    await applyAuthAddon(projectDir, { allowOverwrite: true });

    const rootRoute = await readTextFile(
      join(projectDir, 'src', 'routes', '__root.tsx')
    );
    assert(
      rootRoute.includes('ConvexBetterAuthProvider'),
      'allowOverwrite should replace the baseline starter root route'
    );
  } finally {
    await removeDir(projectDir);
  }
}

async function testFounderTemplateScaffold() {
  const projectDir = await makeTempProject();

  try {
    await applyAuthAddon(projectDir);

    const manifest = createTenexManifest({
      admin: 'panel',
      analytics: 'posthog',
      billing: 'stripe',
      email: 'resend',
      packageManager: 'npm',
      projectName: 'orbit-ops',
      storage: 'r2',
      teams: 'organization',
      template: 'saas-core',
    });

    await applyTemplate(projectDir, manifest, { allowOverwrite: true });
    await applyManifestAddons(projectDir, manifest);
    await applyBetterAuthLocalInstall(projectDir, manifest, 'npm', {
      skipGenerate: true,
    });

    const generated = await readTextFile(
      join(projectDir, 'src', 'lib', 'tenex.generated.ts')
    );
    assert(
      generated.includes("template: 'saas-core'") ||
        generated.includes('template: "saas-core"'),
      'template scaffold should write template config'
    );
    assert(
      generated.includes("provider: 'stripe'") ||
        generated.includes('provider: "stripe"'),
      'template scaffold should include addon provider metadata'
    );

    const convexConfig = await readTextFile(
      join(projectDir, 'convex', 'convex.config.ts')
    );
    const localBetterAuthConfig = await readTextFile(
      join(projectDir, 'convex', 'betterAuth', 'convex.config.ts')
    );
    assert(
      convexConfig.includes('@convex-dev/stripe/convex.config'),
      'billing addon should register the Stripe component'
    );
    assert(
      convexConfig.includes('@convex-dev/resend/convex.config'),
      'email addon should register the Resend component'
    );
    assert(
      convexConfig.includes('@convex-dev/r2/convex.config'),
      'storage addon should register the R2 component'
    );
    assert(
      convexConfig.includes('./betterAuth/convex.config'),
      'teams and admin addons should switch to the local Better Auth install'
    );
    assert(
      !localBetterAuthConfig.includes('component.use('),
      'local Better Auth component config should match the Convex docs'
    );

    const authConfig = await readTextFile(
      join(projectDir, 'convex', 'auth.ts')
    );
    const localAuthConfig = await readTextFile(
      join(projectDir, 'convex', 'betterAuth', 'auth.ts')
    );
    const localAdapter = await readTextFile(
      join(projectDir, 'convex', 'betterAuth', 'adapter.ts')
    );
    assert(
      authConfig.includes(
        "import { organization, admin } from 'better-auth/plugins'"
      ) ||
        authConfig.includes(
          "import { admin, organization } from 'better-auth/plugins'"
        ),
      'teams and admin addons should extend Better Auth plugins'
    );
    assert(
      localAuthConfig.includes('export const auth = createAuth({} as any)'),
      'local Better Auth auth.ts should expose a static auth instance'
    );
    assert(
      localAdapter.includes(
        "import { createApi } from '@convex-dev/better-auth'"
      ),
      'local Better Auth adapter should use the documented createApi import'
    );

    assert(
      await pathExists(join(projectDir, 'src', 'routes', 'admin.tsx')),
      'admin route should be generated'
    );
    assert(
      await pathExists(join(projectDir, 'src', 'routes', 'files.tsx')),
      'files route should be generated'
    );
  } finally {
    await removeDir(projectDir);
  }
}

async function main() {
  assert(
    sanitizeProjectName('My App') === 'my-app',
    'sanitizeProjectName failed'
  );
  assert(BETTER_AUTH_VERSION === '1.4.9', 'Unexpected BETTER_AUTH_VERSION');

  const secret = generateBetterAuthSecret();
  assert(
    typeof secret === 'string' && secret.length > 10,
    'Bad secret generation'
  );

  await testAuthAddonPreservesExistingFiles();
  await testAuthAddonScaffoldIsIdempotent();
  await testAuthAddonCanOverwriteFreshStarterFiles();
  await testFounderTemplateScaffold();

  console.log('smoke test ok');
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
