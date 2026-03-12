import { join } from 'node:path';
import type { InstallPackage } from '../lib/package-manager';
import type { AnalyticsProvider } from '../lib/tenex-config';
import { managedFile, projectScaffoldPaths, writeAddonFiles } from './shared';

export function analyticsPackages(
  provider: AnalyticsProvider
): InstallPackage[] {
  if (provider !== 'posthog') {
    return [];
  }
  return [{ name: 'posthog-js' }, { name: 'posthog-node' }];
}

export async function applyAnalyticsAddon(
  projectDir: string,
  provider: AnalyticsProvider
): Promise<void> {
  const { srcDir } = await projectScaffoldPaths(projectDir);
  const contents =
    provider === 'posthog' ? analyticsProviderSource() : analyticsStubSource();

  await writeAddonFiles([
    managedFile(join(srcDir, 'lib', 'analytics.ts'), contents),
  ]);
}

function analyticsStubSource(): string {
  return `export async function captureTenexEvent(
  _event?: string,
  _properties?: Record<string, unknown>,
) {
  return undefined
}

export async function identifyTenexUser(
  _userId?: string,
  _properties?: Record<string, unknown>,
) {
  return undefined
}
`;
}

function analyticsProviderSource(): string {
  return `import posthog from 'posthog-js'

let initialized = false

function ensurePosthog() {
  if (initialized) {
    return
  }
  const apiKey = import.meta.env.VITE_POSTHOG_KEY
  const apiHost = import.meta.env.VITE_POSTHOG_HOST
  if (!apiKey || !apiHost) {
    return
  }
  posthog.init(apiKey, {
    api_host: apiHost,
    capture_pageview: true,
  })
  initialized = true
}

export async function captureTenexEvent(event: string, properties?: Record<string, unknown>) {
  ensurePosthog()
  posthog.capture(event, properties)
}

export async function identifyTenexUser(userId: string, properties?: Record<string, unknown>) {
  ensurePosthog()
  posthog.identify(userId, properties)
}
`;
}
