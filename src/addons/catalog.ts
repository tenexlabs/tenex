import type { InstallPackage } from '../lib/package-manager';
import type { TenexManifest } from '../lib/tenex-config';
import { applyAdminAddon } from './admin';
import { analyticsPackages, applyAnalyticsAddon } from './analytics';
import { applyBillingAddon, billingPackages } from './billing';
import { applyEmailAddon, emailPackages } from './email';
import { applyStorageAddon, storagePackages } from './storage';
import { applyTeamsAddon } from './teams';

export async function applyManifestAddons(
  projectDir: string,
  manifest: TenexManifest
): Promise<void> {
  await applyBillingAddon(projectDir, manifest.addons.billing);
  await applyEmailAddon(projectDir, manifest.addons.email);
  await applyAnalyticsAddon(projectDir, manifest.addons.analytics);
  await applyStorageAddon(projectDir, manifest.addons.storage);
  await applyTeamsAddon(projectDir, manifest.addons.teams);
  await applyAdminAddon(projectDir, manifest.addons.admin);
}

export function addonPackages(manifest: TenexManifest): InstallPackage[] {
  const allPackages = [
    ...billingPackages(manifest.addons.billing),
    ...emailPackages(manifest.addons.email),
    ...analyticsPackages(manifest.addons.analytics),
    ...storagePackages(manifest.addons.storage),
  ];

  const seen = new Set<string>();
  const uniquePackages: InstallPackage[] = [];
  for (const pkg of allPackages) {
    const key = `${pkg.name}:${pkg.dev ? 'dev' : 'runtime'}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    uniquePackages.push(pkg);
  }
  return uniquePackages;
}
