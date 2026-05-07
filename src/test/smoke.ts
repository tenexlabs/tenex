import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { applyAnalyticsAddon } from '../addons/analytics';
import {
  applyAuthAddon,
  BETTER_AUTH_VERSION,
  generateBetterAuthSecret,
} from '../addons/auth';
import { applyBetterAuthLocalInstall } from '../addons/better-auth-local';
import { applyBillingAddon } from '../addons/billing';
import { addonPackages, applyManifestAddons } from '../addons/catalog';
import { applyEmailAddon } from '../addons/email';
import { applyStorageAddon } from '../addons/storage';
import { applyTeamsAddon } from '../addons/teams';
import { hasFlag, parseArgs, readFlag, readStringFlag } from '../lib/args';
import { pathExists, readTextFile, removeDir, writeTextFile } from '../lib/fs';
import { sanitizeProjectName } from '../lib/project-name';
import { addonEnvRequirements, createTenexManifest } from '../lib/tenex-config';
import { applyTemplate } from '../templates';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function assertIncludes(
  contents: string,
  expected: string,
  message: string
): void {
  assert(contents.includes(expected), message);
}

function assertNotIncludes(
  contents: string,
  expected: string,
  message: string
): void {
  assert(!contents.includes(expected), message);
}

function assertArrayIncludes(
  values: string[],
  expected: string,
  message: string
): void {
  assert(values.includes(expected), message);
}

function assertArrayExcludes(
  values: string[],
  expected: string,
  message: string
): void {
  assert(!values.includes(expected), message);
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

function makeManifest(
  overrides: Partial<Parameters<typeof createTenexManifest>[0]> = {}
) {
  return createTenexManifest({
    admin: 'none',
    analytics: 'none',
    billing: 'none',
    email: 'none',
    packageManager: 'npm',
    projectName: 'signal-lab',
    storage: 'none',
    teams: 'none',
    template: 'saas-core',
    ...overrides,
  });
}

async function makeAuthProject(): Promise<string> {
  const projectDir = await makeTempProject();
  await applyAuthAddon(projectDir);
  return projectDir;
}

function packageNamesFor(
  overrides: Partial<Parameters<typeof createTenexManifest>[0]>
): string[] {
  return addonPackages(makeManifest(overrides)).map((pkg) => pkg.name);
}

function envRequirementsFor(
  overrides: Partial<Parameters<typeof createTenexManifest>[0]>
): string[] {
  return addonEnvRequirements(makeManifest(overrides));
}

function testCommandParserNonInteractiveOptions() {
  const parsed = parseArgs([
    'Acme Portal',
    '--yes',
    '--package-manager=pnpm',
    '--template',
    'ai-saas',
    '--billing=stripe',
    '--storage',
    'r2',
    '--email',
    '--analytics=none',
    '--teams=organization',
    '--admin',
    'none',
  ]);

  assert(
    parsed.positional[0] === 'Acme Portal',
    'parser should preserve the project name positional argument'
  );
  assert(hasFlag(parsed, 'yes'), 'parser should expand --yes as a boolean');
  assert(
    readStringFlag(parsed, 'package-manager') === 'pnpm',
    'parser should read --package-manager=value'
  );
  assert(
    readStringFlag(parsed, 'template') === 'ai-saas',
    'parser should read --template value'
  );
  assert(
    readStringFlag(parsed, 'billing') === 'stripe',
    'parser should read --billing=value'
  );
  assert(
    readStringFlag(parsed, 'storage') === 'r2',
    'parser should read --storage value'
  );
  assert(
    readFlag(parsed, 'email') === true,
    'parser should read fixed add-on booleans'
  );
  assert(
    readStringFlag(parsed, 'analytics') === 'none',
    'parser should read fixed add-on string values'
  );
  assert(
    readStringFlag(parsed, 'admin') === 'none',
    'parser should keep a fixed add-on disabled value'
  );

  const shortAndTerminated = parseArgs([
    '-y',
    '--pm',
    'bun',
    '--',
    '--literal',
  ]);
  assert(hasFlag(shortAndTerminated, 'yes'), 'parser should map -y to --yes');
  assert(
    readStringFlag(shortAndTerminated, 'pm') === 'bun',
    'parser should read --pm value'
  );
  assert(
    shortAndTerminated.positional[0] === '--literal',
    'parser should treat tokens after -- as positional values'
  );
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

async function testAnalyticsStubMatchesGeneratedCallsites() {
  const projectDir = await makeTempProject();

  try {
    const manifest = createTenexManifest({
      admin: 'none',
      analytics: 'none',
      billing: 'none',
      email: 'none',
      packageManager: 'npm',
      projectName: 'signal-lab',
      storage: 'none',
      teams: 'none',
      template: 'saas-core',
    });

    await applyManifestAddons(projectDir, manifest);

    const analytics = await readTextFile(
      join(projectDir, 'src', 'lib', 'analytics.ts')
    );
    assert(
      analytics.includes('_event?: string'),
      'analytics stub should accept the same event args as the real provider'
    );
    assert(
      analytics.includes('_userId?: string'),
      'analytics stub should accept the same identify args as the real provider'
    );
  } finally {
    await removeDir(projectDir);
  }
}

async function testBillingProviderScaffoldsAndMetadata() {
  const cases = [
    {
      provider: 'stripe' as const,
      componentImport: '@convex-dev/stripe/convex.config',
      componentUse: 'app.use(stripe)',
      expectedEnv: 'STRIPE_SECRET_KEY',
      expectedPackage: '@convex-dev/stripe',
      unexpectedEnv: 'AUTUMN_SECRET_KEY',
      unexpectedPackage: '@useautumn/convex',
    },
    {
      provider: 'autumn' as const,
      componentImport: '@useautumn/convex/convex.config',
      componentUse: 'app.use(autumn)',
      expectedEnv: 'AUTUMN_SECRET_KEY',
      expectedPackage: '@useautumn/convex',
      unexpectedEnv: 'STRIPE_SECRET_KEY',
      unexpectedPackage: '@convex-dev/stripe',
    },
  ];

  for (const testCase of cases) {
    const projectDir = await makeAuthProject();

    try {
      await applyBillingAddon(projectDir, testCase.provider);

      const convexConfig = await readTextFile(
        join(projectDir, 'convex', 'convex.config.ts')
      );
      const billingServer = await readTextFile(
        join(projectDir, 'convex', 'billing.ts')
      );
      const billingClient = await readTextFile(
        join(projectDir, 'src', 'lib', 'billing.ts')
      );
      const billingWebhook = await readTextFile(
        join(projectDir, 'src', 'routes', 'api', 'billing', '$.ts')
      );
      const packages = packageNamesFor({ billing: testCase.provider });
      const env = envRequirementsFor({ billing: testCase.provider });

      assertIncludes(
        convexConfig,
        testCase.componentImport,
        `${testCase.provider} billing should register its Convex component import`
      );
      assertIncludes(
        convexConfig,
        testCase.componentUse,
        `${testCase.provider} billing should register its Convex component use`
      );
      assertIncludes(
        billingServer,
        `billingProvider = "${testCase.provider}" as const`,
        `${testCase.provider} billing server should expose provider metadata`
      );
      assertIncludes(
        billingClient,
        `billingProvider = "${testCase.provider}" as const`,
        `${testCase.provider} billing client should expose provider metadata`
      );
      assertIncludes(
        billingWebhook,
        `provider: "${testCase.provider}"`,
        `${testCase.provider} billing webhook should expose provider metadata`
      );
      assertArrayIncludes(
        packages,
        testCase.expectedPackage,
        `${testCase.provider} billing should request its provider package`
      );
      assertArrayExcludes(
        packages,
        testCase.unexpectedPackage,
        `${testCase.provider} billing should not request the other provider package`
      );
      assertArrayIncludes(
        env,
        testCase.expectedEnv,
        `${testCase.provider} billing should require its provider env vars`
      );
      assertArrayExcludes(
        env,
        testCase.unexpectedEnv,
        `${testCase.provider} billing should not require the other provider env vars`
      );
    } finally {
      await removeDir(projectDir);
    }
  }
}

async function testEmailAnalyticsAndTeamsProviderScaffoldsAndMetadata() {
  const projectDir = await makeAuthProject();

  try {
    await applyEmailAddon(projectDir, 'resend');
    await applyTeamsAddon(projectDir, 'organization');

    const analyticsProjectDir = await makeTempProject();
    try {
      await applyAnalyticsAddon(analyticsProjectDir, 'posthog');

      const emailServer = await readTextFile(
        join(projectDir, 'convex', 'email.ts')
      );
      const emailClient = await readTextFile(
        join(projectDir, 'src', 'lib', 'email.ts')
      );
      const emailTemplates = await readTextFile(
        join(projectDir, 'src', 'emails', 'transactional.ts')
      );
      const authConfig = await readTextFile(
        join(projectDir, 'convex', 'auth.ts')
      );
      const teamsClient = await readTextFile(
        join(projectDir, 'src', 'lib', 'teams.ts')
      );
      const analyticsClient = await readTextFile(
        join(analyticsProjectDir, 'src', 'lib', 'analytics.ts')
      );
      const providerPackages = packageNamesFor({
        analytics: 'posthog',
        email: 'resend',
        teams: 'organization',
      });
      const disabledPackages = packageNamesFor({
        analytics: 'none',
        email: 'none',
        teams: 'none',
      });
      const providerEnv = envRequirementsFor({
        admin: 'panel',
        analytics: 'posthog',
        email: 'resend',
        teams: 'organization',
      });

      assertIncludes(
        emailServer,
        "provider: 'resend'",
        'email provider should generate Resend server metadata'
      );
      assertIncludes(
        emailClient,
        "provider: 'resend'",
        'email provider should generate Resend client metadata'
      );
      assertIncludes(
        emailTemplates,
        'verificationTemplate',
        'email provider should generate transactional templates'
      );
      assertIncludes(
        analyticsClient,
        "import posthog from 'posthog-js'",
        'analytics provider should generate PostHog client integration'
      );
      assertIncludes(
        analyticsClient,
        'posthog.identify(userId, properties)',
        'analytics provider should generate PostHog identify calls'
      );
      assertIncludes(
        authConfig,
        "import { organization } from 'better-auth/plugins'",
        'teams provider should import the Better Auth organization plugin'
      );
      assertIncludes(
        authConfig,
        'organization(), convex({ authConfig })',
        'teams provider should register the Better Auth organization plugin'
      );
      assertIncludes(
        teamsClient,
        "provider: 'organization'",
        'teams provider should generate organization client metadata'
      );
      assertArrayIncludes(
        providerPackages,
        'resend',
        'email provider should request the Resend runtime package'
      );
      assertArrayIncludes(
        providerPackages,
        'posthog-js',
        'analytics provider should request the PostHog browser package'
      );
      assertArrayIncludes(
        providerPackages,
        'posthog-node',
        'analytics provider should request the PostHog server package'
      );
      assert(
        disabledPackages.length === 0,
        'disabled add-ons should not request provider packages'
      );
      assertArrayIncludes(
        providerEnv,
        'RESEND_API_KEY',
        'email provider should require Resend env vars'
      );
      assertArrayIncludes(
        providerEnv,
        'VITE_POSTHOG_KEY',
        'analytics provider should require PostHog env vars'
      );
      assertArrayIncludes(
        providerEnv,
        'TENEX_ADMIN_EMAILS',
        'admin provider should require bootstrap admin env vars'
      );
    } finally {
      await removeDir(analyticsProjectDir);
    }
  } finally {
    await removeDir(projectDir);
  }
}

async function testStorageProviderScaffoldsAndMetadata() {
  const cases = [
    {
      provider: 'convex' as const,
      expectedRouteLabel: 'Convex file storage',
      expectedPackage: undefined,
      expectedEnv: undefined,
      shouldRegisterComponent: false,
    },
    {
      provider: 'r2' as const,
      expectedRouteLabel: 'Cloudflare R2 component',
      expectedPackage: '@convex-dev/r2',
      expectedEnv: 'R2_BUCKET',
      shouldRegisterComponent: true,
    },
  ];

  for (const testCase of cases) {
    const projectDir = await makeAuthProject();

    try {
      await applyStorageAddon(projectDir, testCase.provider);

      const convexConfig = await readTextFile(
        join(projectDir, 'convex', 'convex.config.ts')
      );
      const storageServer = await readTextFile(
        join(projectDir, 'convex', 'storage.ts')
      );
      const storageClient = await readTextFile(
        join(projectDir, 'src', 'lib', 'storage.ts')
      );
      const filesRoute = await readTextFile(
        join(projectDir, 'src', 'routes', 'files.tsx')
      );
      const packages = packageNamesFor({ storage: testCase.provider });
      const env = envRequirementsFor({ storage: testCase.provider });

      assertIncludes(
        storageServer,
        `storageProvider = "${testCase.provider}" as const`,
        `${testCase.provider} storage server should expose provider metadata`
      );
      assertIncludes(
        storageClient,
        `storageProvider = "${testCase.provider}" as const`,
        `${testCase.provider} storage client should expose provider metadata`
      );
      assertIncludes(
        filesRoute,
        testCase.expectedRouteLabel,
        `${testCase.provider} storage route should render provider-specific copy`
      );

      if (testCase.shouldRegisterComponent) {
        assertIncludes(
          convexConfig,
          '@convex-dev/r2/convex.config',
          'R2 storage should register the Convex R2 component import'
        );
        assertIncludes(
          convexConfig,
          'app.use(r2)',
          'R2 storage should register the Convex R2 component use'
        );
      } else {
        assertNotIncludes(
          convexConfig,
          '@convex-dev/r2/convex.config',
          'Convex storage should not register the R2 component import'
        );
      }

      if (testCase.expectedPackage) {
        assertArrayIncludes(
          packages,
          testCase.expectedPackage,
          `${testCase.provider} storage should request its provider package`
        );
      } else {
        assert(
          packages.length === 0,
          'Convex storage should not request provider packages'
        );
      }

      if (testCase.expectedEnv) {
        assertArrayIncludes(
          env,
          testCase.expectedEnv,
          `${testCase.provider} storage should require provider env vars`
        );
      } else {
        assertArrayExcludes(
          env,
          'R2_BUCKET',
          'Convex storage should not require R2 env vars'
        );
      }
    } finally {
      await removeDir(projectDir);
    }
  }
}

function testAddonPackageMetadataDeduplicatesProviders() {
  const manifest = makeManifest({
    analytics: 'posthog',
    billing: 'stripe',
    email: 'resend',
    storage: 'r2',
  });
  const packages = addonPackages(manifest);
  const packageKeys = packages.map(
    (pkg) => `${pkg.name}:${pkg.dev ? 'dev' : 'runtime'}`
  );
  const uniquePackageKeys = new Set(packageKeys);

  assert(
    packageKeys.length === uniquePackageKeys.size,
    'addon package metadata should deduplicate package manager inputs'
  );
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
    const convexSchema = await readTextFile(
      join(projectDir, 'convex', 'schema.ts')
    );
    const localBetterAuthConfig = await readTextFile(
      join(projectDir, 'convex', 'betterAuth', 'convex.config.ts')
    );
    const convexAdmin = await readTextFile(
      join(projectDir, 'convex', 'admin.ts')
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
      convexSchema.includes('tenex_admin_workspace') &&
        convexSchema.includes('tenex_admin_activity'),
      'admin addon should register its Convex tables in schema.ts'
    );
    assert(
      convexAdmin.includes('...defaultBootstrapState') &&
        convexAdmin.includes('await ctx.db.insert(WORKSPACE_TABLE, {'),
      'admin addon should seed bootstrap fields when inserting workspace config'
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
    const authClient = await readTextFile(
      join(projectDir, 'src', 'lib', 'auth-client.ts')
    );
    const rootRoute = await readTextFile(
      join(projectDir, 'src', 'routes', '__root.tsx')
    );
    const setupAdminRoute = await readTextFile(
      join(projectDir, 'src', 'routes', 'setup-admin.tsx')
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
      authClient.includes(
        "import { adminClient } from 'better-auth/client/plugins'"
      ),
      'generated auth client should include the Better Auth admin client plugin'
    );
    assert(
      authClient.includes('plugins: [adminClient(), convexClient()]'),
      'generated auth client should register the admin client plugin'
    );
    assert(
      rootRoute.includes(
        "import { AdminBootstrapGate } from '~/components/AdminBootstrapGate'"
      ),
      'admin addon should patch the root route to import AdminBootstrapGate'
    );
    assert(
      rootRoute.includes('<AdminBootstrapGate>'),
      'admin addon should wrap the root outlet with AdminBootstrapGate'
    );
    assert(
      setupAdminRoute.includes('waitForAuthenticatedBootstrapUser'),
      'admin bootstrap route should wait for Convex auth state before promoting the first admin'
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
      await pathExists(join(projectDir, 'src', 'routes', 'setup-admin.tsx')),
      'admin addon should generate the setup-admin bootstrap route'
    );
    assert(
      await pathExists(
        join(projectDir, 'src', 'components', 'AdminBootstrapGate.tsx')
      ),
      'admin addon should generate the bootstrap gate component'
    );
    assert(
      await pathExists(join(projectDir, 'convex', 'admin.ts')),
      'admin addon should generate root Convex admin functions'
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

  testCommandParserNonInteractiveOptions();
  testAddonPackageMetadataDeduplicatesProviders();

  await testAuthAddonPreservesExistingFiles();
  await testAuthAddonScaffoldIsIdempotent();
  await testAuthAddonCanOverwriteFreshStarterFiles();
  await testAnalyticsStubMatchesGeneratedCallsites();
  await testBillingProviderScaffoldsAndMetadata();
  await testEmailAnalyticsAndTeamsProviderScaffoldsAndMetadata();
  await testStorageProviderScaffoldsAndMetadata();
  await testFounderTemplateScaffold();

  console.log('smoke test ok');
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
