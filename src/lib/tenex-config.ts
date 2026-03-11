import { join } from 'node:path';
import { readJsonFile, writeJsonFile } from './fs';
import type { PackageManager } from './package-manager';

export type TemplateId = 'saas-core' | 'ai-saas' | 'waitlist';
export type BillingProvider = 'stripe' | 'autumn' | 'none';
export type EmailProvider = 'resend' | 'none';
export type AnalyticsProvider = 'posthog' | 'none';
export type StorageProvider = 'convex' | 'r2' | 'none';
export type TeamsProvider = 'organization' | 'none';
export type AdminProvider = 'panel' | 'none';

export interface TenexManifestAddons {
  admin: AdminProvider;
  analytics: AnalyticsProvider;
  auth: 'better-auth-convex';
  billing: BillingProvider;
  email: EmailProvider;
  storage: StorageProvider;
  teams: TeamsProvider;
}

export interface TenexManifest {
  version: 1;
  projectName: string;
  packageManager: PackageManager;
  template: TemplateId;
  addons: TenexManifestAddons;
}

export interface NewProjectSelections {
  admin: AdminProvider;
  analytics: AnalyticsProvider;
  billing: BillingProvider;
  email: EmailProvider;
  packageManager: PackageManager;
  projectName: string;
  storage: StorageProvider;
  teams: TeamsProvider;
  template: TemplateId;
}

export const TENEX_MANIFEST_FILE = 'tenex.json';

export function createTenexManifest(
  selections: NewProjectSelections
): TenexManifest {
  return {
    version: 1,
    projectName: selections.projectName,
    packageManager: selections.packageManager,
    template: selections.template,
    addons: {
      admin: selections.admin,
      analytics: selections.analytics,
      auth: 'better-auth-convex',
      billing: selections.billing,
      email: selections.email,
      storage: selections.storage,
      teams: selections.teams,
    },
  };
}

export function tenexManifestPath(projectDir: string): string {
  return join(projectDir, TENEX_MANIFEST_FILE);
}

export async function readTenexManifest(
  projectDir: string
): Promise<TenexManifest> {
  return await readJsonFile<TenexManifest>(tenexManifestPath(projectDir));
}

export async function writeTenexManifest(
  projectDir: string,
  manifest: TenexManifest
): Promise<void> {
  await writeJsonFile(tenexManifestPath(projectDir), manifest);
}

export function addonEnvRequirements(manifest: TenexManifest): string[] {
  const envVars = ['VITE_CONVEX_URL', 'VITE_CONVEX_SITE_URL', 'VITE_SITE_URL'];
  envVars.push('BETTER_AUTH_SECRET', 'SITE_URL');

  if (manifest.addons.billing === 'stripe') {
    envVars.push(
      'STRIPE_SECRET_KEY',
      'STRIPE_WEBHOOK_SECRET',
      'VITE_STRIPE_PUBLISHABLE_KEY'
    );
  }
  if (manifest.addons.billing === 'autumn') {
    envVars.push(
      'AUTUMN_SECRET_KEY',
      'AUTUMN_WEBHOOK_SECRET',
      'VITE_AUTUMN_PRODUCT_ID'
    );
  }
  if (manifest.addons.email === 'resend') {
    envVars.push('RESEND_API_KEY', 'TENEX_EMAIL_FROM');
  }
  if (manifest.addons.analytics === 'posthog') {
    envVars.push('VITE_POSTHOG_KEY', 'VITE_POSTHOG_HOST');
  }
  if (manifest.addons.storage === 'r2') {
    envVars.push(
      'R2_ACCESS_KEY_ID',
      'R2_SECRET_ACCESS_KEY',
      'R2_BUCKET',
      'R2_ENDPOINT'
    );
  }
  if (manifest.addons.admin === 'panel') {
    envVars.push('TENEX_ADMIN_EMAILS');
  }
  return Array.from(new Set(envVars));
}

export function formatAddonSummary(manifest: TenexManifest): string[] {
  return [
    `template=${manifest.template}`,
    `billing=${manifest.addons.billing}`,
    `email=${manifest.addons.email}`,
    `analytics=${manifest.addons.analytics}`,
    `storage=${manifest.addons.storage}`,
    `teams=${manifest.addons.teams}`,
    `admin=${manifest.addons.admin}`,
  ];
}

export function requiresBetterAuthLocalInstall(
  manifest: Pick<TenexManifest, 'addons'>
): boolean {
  return (
    manifest.addons.admin === 'panel' ||
    manifest.addons.teams === 'organization'
  );
}
