import { cancel, confirm, isCancel, log, select } from '@clack/prompts';
import { applyBetterAuthLocalInstall } from '../addons/better-auth-local';
import { addonPackages, applyManifestAddons } from '../addons/catalog';
import { parseArgs, readFlag, readStringFlag } from '../lib/args';
import {
  detectPackageManager,
  packageManagerInstallCommand,
} from '../lib/package-manager';
import { writeProjectReadme } from '../lib/project-readme';
import { run } from '../lib/run';
import {
  type AdminProvider,
  type AnalyticsProvider,
  type BillingProvider,
  type EmailProvider,
  readTenexManifest,
  type StorageProvider,
  type TeamsProvider,
  writeTenexManifest,
} from '../lib/tenex-config';
import { applyTemplate } from '../templates';
import { addAuth } from './add-auth';

export async function cmdAdd(args: string[]) {
  const parsed = parseArgs(args);
  const addon = parsed.positional[0];
  if (!addon) {
    log.error(
      'Usage: tenex add <auth|billing|email|analytics|storage|teams|admin>'
    );
    process.exitCode = 1;
    return;
  }

  if (addon === 'auth') {
    await addAuth(process.cwd());
    return;
  }

  const manifest = await readTenexManifest(process.cwd());
  const provider = await resolveAddonProvider(addon, parsed);

  switch (addon) {
    case 'billing':
      manifest.addons.billing = provider as BillingProvider;
      break;
    case 'email':
      manifest.addons.email = provider as EmailProvider;
      break;
    case 'analytics':
      manifest.addons.analytics = provider as AnalyticsProvider;
      break;
    case 'storage':
      manifest.addons.storage = provider as StorageProvider;
      break;
    case 'teams':
      manifest.addons.teams = provider as TeamsProvider;
      break;
    case 'admin':
      manifest.addons.admin = provider as AdminProvider;
      break;
    default:
      throw new Error(`Unknown add-on: ${addon}`);
  }

  await writeTenexManifest(process.cwd(), manifest);
  await applyTemplate(process.cwd(), manifest);

  const packageManager = await detectPackageManager(process.cwd());
  for (const command of packageManagerInstallCommand(
    packageManager,
    addonPackages(manifest)
  )) {
    await run(command.cmd, command.args, { cwd: process.cwd() });
  }

  await applyManifestAddons(process.cwd(), manifest);
  await applyBetterAuthLocalInstall(process.cwd(), manifest, packageManager);
  await writeProjectReadme(process.cwd(), manifest);
  log.success(
    `Added ${addon}${provider === 'none' ? ' (disabled)' : ` with ${provider}`}`
  );
}

async function resolveAddonProvider(
  addon: string,
  parsed: ReturnType<typeof parseArgs>
): Promise<string> {
  const provider = readStringFlag(parsed, 'provider');
  if (provider) {
    return provider;
  }

  if (addon === 'billing') {
    const choice = await select({
      message: 'Choose a billing provider',
      options: [
        { value: 'stripe', label: 'Stripe component' },
        { value: 'autumn', label: 'Autumn component' },
        { value: 'none', label: 'Disable billing' },
      ],
      initialValue: 'stripe',
    });
    return unwrapSelect(choice);
  }

  if (addon === 'storage') {
    const choice = await select({
      message: 'Choose a storage provider',
      options: [
        { value: 'convex', label: 'Convex file storage' },
        { value: 'r2', label: 'Cloudflare R2 component' },
        { value: 'none', label: 'Disable storage' },
      ],
      initialValue: 'convex',
    });
    return unwrapSelect(choice);
  }

  const providerFlag = readFlag(parsed, addon);
  if (providerFlag === true) {
    return defaultAddonProvider(addon);
  }

  const enabled = await confirm({
    message: `Enable ${addon}?`,
    initialValue: true,
  });
  if (isCancel(enabled)) {
    cancel('Operation cancelled.');
    process.exit();
  }
  return enabled ? defaultAddonProvider(addon) : 'none';
}

function defaultAddonProvider(addon: string): string {
  switch (addon) {
    case 'email':
      return 'resend';
    case 'analytics':
      return 'posthog';
    case 'teams':
      return 'organization';
    case 'admin':
      return 'panel';
    default:
      throw new Error(`No default provider for ${addon}`);
  }
}

function unwrapSelect(choice: unknown): string {
  if (isCancel(choice)) {
    cancel('Operation cancelled.');
    process.exit();
  }
  return String(choice);
}
