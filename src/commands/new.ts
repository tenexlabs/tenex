import { resolve } from 'node:path';
import {
  cancel,
  confirm,
  intro,
  isCancel,
  log,
  outro,
  select,
  text,
} from '@clack/prompts';
import { applyBetterAuthLocalInstall } from '../addons/better-auth-local';
import { addonPackages, applyManifestAddons } from '../addons/catalog';
import { hasFlag, parseArgs, readFlag, readStringFlag } from '../lib/args';
import { pathExists, removeDir } from '../lib/fs';
import {
  type PackageManager,
  packageManagerChoices,
  packageManagerCreateCommand,
  packageManagerInstallCommand,
} from '../lib/package-manager';
import { sanitizeProjectName } from '../lib/project-name';
import { writeProjectReadme } from '../lib/project-readme';
import { run } from '../lib/run';
import {
  type AdminProvider,
  type AnalyticsProvider,
  createTenexManifest,
  type EmailProvider,
  type NewProjectSelections,
  type TeamsProvider,
  writeTenexManifest,
} from '../lib/tenex-config';
import { applyTemplate, templateChoices } from '../templates';
import { addAuth } from './add-auth';

const BILLING_PROVIDERS = ['stripe', 'autumn', 'none'] as const;
const STORAGE_PROVIDERS = ['convex', 'r2', 'none'] as const;

export async function cmdNew(args: string[]) {
  intro('tenex new');

  const parsed = parseArgs(args);
  const yes = hasFlag(parsed, 'yes');

  let projectName = parsed.positional[0];

  if (!projectName) {
    const nameInput = await text({
      message: 'Project name',
      placeholder: 'my-app',
      defaultValue: 'my-app',
    });
    if (isCancel(nameInput) || !nameInput) {
      cancel('Operation cancelled.');
      return;
    }
    projectName = nameInput;
  }

  const sanitizedName = sanitizeProjectName(projectName);
  if (sanitizedName !== projectName) {
    log.warn(`Project name sanitized: "${projectName}" -> "${sanitizedName}"`);
    projectName = sanitizedName;
  }
  if (!projectName) {
    log.error('Invalid project name');
    process.exitCode = 1;
    return;
  }

  const projectDir = resolve(process.cwd(), projectName);

  if (await pathExists(projectDir)) {
    log.warn(`Directory "${projectName}" already exists`);
    const choice = await select({
      message: 'What would you like to do?',
      options: [
        { value: 'overwrite', label: 'Overwrite the existing directory' },
        { value: 'cancel', label: 'Cancel' },
      ],
      initialValue: 'cancel',
    });
    if (isCancel(choice) || choice === 'cancel') {
      cancel('Operation cancelled.');
      return;
    }
    await removeDir(projectDir);
  }

  const selections = await resolveSelections(projectName, parsed, yes);
  const manifest = createTenexManifest(selections);

  log.info(
    `Scaffolding TanStack Start + Convex with ${selections.packageManager}...`
  );
  const createCommand = packageManagerCreateCommand(
    selections.packageManager,
    projectName
  );
  await run(createCommand.cmd, createCommand.args, {
    cwd: process.cwd(),
  });

  log.info('Installing founder-ready auth scaffold...');
  await addAuth(projectDir, {
    allowOverwrite: true,
    packageManager: selections.packageManager,
    showIntro: false,
  });

  await writeTenexManifest(projectDir, manifest);
  await applyTemplate(projectDir, manifest, { allowOverwrite: true });

  const packages = addonPackages(manifest);
  if (packages.length > 0) {
    log.info('Installing selected addon packages...');
    for (const command of packageManagerInstallCommand(
      selections.packageManager,
      packages
    )) {
      await run(command.cmd, command.args, { cwd: projectDir });
    }
  }

  log.info('Applying addon scaffold...');
  await applyManifestAddons(projectDir, manifest);
  await applyBetterAuthLocalInstall(
    projectDir,
    manifest,
    selections.packageManager
  );
  await writeProjectReadme(projectDir, manifest);

  outro(
    `Created ${projectName}. Next: cd ${projectName} && tenex doctor && tenex dev`
  );
}

async function resolveSelections(
  projectName: string,
  parsed: ReturnType<typeof parseArgs>,
  yes: boolean
): Promise<NewProjectSelections> {
  const packageManager = await resolvePackageManager(parsed, yes);
  const template = await resolveTemplate(parsed, yes);
  const billing = await resolveEnumSelection(
    parsed,
    yes,
    'billing',
    BILLING_PROVIDERS,
    'Choose a billing provider',
    [
      { value: 'stripe', label: 'Stripe component' },
      { value: 'autumn', label: 'Autumn component' },
      { value: 'none', label: 'No billing yet' },
    ]
  );
  const storage = await resolveEnumSelection(
    parsed,
    yes,
    'storage',
    STORAGE_PROVIDERS,
    'Choose a storage provider',
    [
      { value: 'convex', label: 'Convex file storage' },
      { value: 'r2', label: 'Cloudflare R2 component' },
      { value: 'none', label: 'No storage yet' },
    ]
  );

  const email = await resolveFixedAddon<EmailProvider>(
    parsed,
    yes,
    'email',
    'resend',
    'Enable email with the Resend component?'
  );
  const analytics = await resolveFixedAddon<AnalyticsProvider>(
    parsed,
    yes,
    'analytics',
    'posthog',
    'Enable analytics with PostHog?'
  );
  const teams = await resolveFixedAddon<TeamsProvider>(
    parsed,
    yes,
    'teams',
    'organization',
    'Enable team workspaces with Better Auth organization?'
  );
  const admin = await resolveFixedAddon<AdminProvider>(
    parsed,
    yes,
    'admin',
    'panel',
    'Enable the custom admin panel?'
  );

  return {
    admin,
    analytics,
    billing,
    email,
    packageManager,
    projectName,
    storage,
    teams,
    template,
  };
}

async function resolvePackageManager(
  parsed: ReturnType<typeof parseArgs>,
  yes: boolean
): Promise<PackageManager> {
  const fromFlag =
    readStringFlag(parsed, 'package-manager') ?? readStringFlag(parsed, 'pm');
  if (fromFlag) {
    assertValue(
      fromFlag,
      packageManagerChoices().map((choice) => choice.value),
      'package manager'
    );
    return fromFlag as PackageManager;
  }
  if (yes) {
    return 'npm';
  }
  const choice = await select({
    message: 'Choose a package manager',
    options: packageManagerChoices().map((choice) => ({
      value: choice.value,
      label: choice.label,
    })),
    initialValue: 'npm',
  });
  if (isCancel(choice)) {
    cancel('Operation cancelled.');
    process.exit();
  }
  return choice as PackageManager;
}

async function resolveTemplate(
  parsed: ReturnType<typeof parseArgs>,
  yes: boolean
) {
  const fromFlag = readStringFlag(parsed, 'template');
  if (fromFlag) {
    assertValue(
      fromFlag,
      templateChoices().map((choice) => choice.value),
      'template'
    );
    return fromFlag as NewProjectSelections['template'];
  }
  if (yes) {
    return 'saas-core';
  }
  const choice = await select({
    message: 'Choose a starter template',
    options: templateChoices().map((choice) => ({
      value: choice.value,
      label: choice.label,
      hint: choice.description,
    })),
    initialValue: 'saas-core',
  });
  if (isCancel(choice)) {
    cancel('Operation cancelled.');
    process.exit();
  }
  return choice as NewProjectSelections['template'];
}

async function resolveEnumSelection<T extends string>(
  parsed: ReturnType<typeof parseArgs>,
  yes: boolean,
  flagName: string,
  allowed: readonly T[],
  prompt: string,
  options: Array<{ label: string; value: T }>
): Promise<T> {
  const fromFlag = readStringFlag(parsed, flagName);
  if (fromFlag) {
    assertValue(fromFlag, allowed, flagName);
    return fromFlag as T;
  }
  if (yes) {
    throw new Error(`--${flagName} is required when using --yes`);
  }
  const choice = await select({
    message: prompt,
    options: options as Array<{ label: string; value: string }>,
    initialValue: options[0]?.value,
  });
  if (isCancel(choice)) {
    cancel('Operation cancelled.');
    process.exit();
  }
  return choice as T;
}

async function resolveFixedAddon<T extends string>(
  parsed: ReturnType<typeof parseArgs>,
  yes: boolean,
  flagName: string,
  provider: Exclude<T, 'none'>,
  prompt: string
): Promise<T> {
  const flagValue = readFlag(parsed, flagName);
  if (flagValue === true) {
    return provider as T;
  }
  if (typeof flagValue === 'string') {
    if (flagValue !== provider && flagValue !== 'none') {
      throw new Error(`Invalid --${flagName} value: ${flagValue}`);
    }
    return flagValue as T;
  }
  if (yes) {
    return 'none' as T;
  }
  const enabled = await confirm({
    message: prompt,
    initialValue: flagName !== 'admin',
  });
  if (isCancel(enabled)) {
    cancel('Operation cancelled.');
    process.exit();
  }
  return (enabled ? provider : 'none') as T;
}

function assertValue(
  value: string,
  allowed: readonly string[],
  label: string
): void {
  if (!allowed.includes(value)) {
    throw new Error(`Invalid ${label}: ${value}`);
  }
}
