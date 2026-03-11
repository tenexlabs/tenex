import { join } from 'node:path';
import { pathExists } from './fs';

export type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'bun';

export interface InstallPackage {
  name: string;
  dev?: boolean;
  exact?: boolean;
}

export async function detectPackageManager(
  projectDir: string
): Promise<PackageManager> {
  if (await pathExists(join(projectDir, 'pnpm-lock.yaml'))) {
    return 'pnpm';
  }
  if (await pathExists(join(projectDir, 'yarn.lock'))) {
    return 'yarn';
  }
  if (
    (await pathExists(join(projectDir, 'bun.lock'))) ||
    (await pathExists(join(projectDir, 'bun.lockb')))
  ) {
    return 'bun';
  }
  return 'npm';
}

export function packageManagerChoices(): Array<{
  label: string;
  value: PackageManager;
}> {
  return [
    { label: 'npm', value: 'npm' },
    { label: 'pnpm', value: 'pnpm' },
    { label: 'yarn', value: 'yarn' },
    { label: 'bun', value: 'bun' },
  ];
}

export function packageManagerCreateCommand(
  packageManager: PackageManager,
  projectName: string
): { cmd: string; args: string[] } {
  switch (packageManager) {
    case 'pnpm':
      return {
        cmd: 'pnpm',
        args: [
          'dlx',
          'create-convex@latest',
          projectName,
          '--',
          '-t',
          'tanstack-start',
        ],
      };
    case 'yarn':
      return {
        cmd: 'yarn',
        args: [
          'dlx',
          'create-convex@latest',
          projectName,
          '--',
          '-t',
          'tanstack-start',
        ],
      };
    case 'bun':
      return {
        cmd: 'bunx',
        args: [
          'create-convex@latest',
          projectName,
          '--',
          '-t',
          'tanstack-start',
        ],
      };
    default:
      return {
        cmd: 'npm',
        args: [
          'create',
          'convex@latest',
          projectName,
          '--',
          '-t',
          'tanstack-start',
        ],
      };
  }
}

export function packageManagerInstallCommand(
  packageManager: PackageManager,
  packages: InstallPackage[]
): { cmd: string; args: string[] }[] {
  const runtimePackages = packages.filter((pkg) => !pkg.dev);
  const devPackages = packages.filter((pkg) => pkg.dev);
  const commands: { cmd: string; args: string[] }[] = [];

  const pushInstall = (installPackages: InstallPackage[], dev: boolean) => {
    if (installPackages.length === 0) {
      return;
    }
    commands.push(
      packageManagerInstallCommandForGroup(packageManager, installPackages, dev)
    );
  };

  pushInstall(runtimePackages, false);
  pushInstall(devPackages, true);

  return commands;
}

export function packageManagerExecCommand(
  packageManager: PackageManager,
  bin: string,
  args: string[]
): { cmd: string; args: string[] } {
  switch (packageManager) {
    case 'pnpm':
      return { cmd: 'pnpm', args: ['exec', bin, ...args] };
    case 'yarn':
      return { cmd: 'yarn', args: [bin, ...args] };
    case 'bun':
      return { cmd: 'bunx', args: [bin, ...args] };
    default:
      return { cmd: 'npx', args: [bin, ...args] };
  }
}

export function packageManagerRunScriptCommand(
  packageManager: PackageManager,
  script: string
): { cmd: string; args: string[] } {
  switch (packageManager) {
    case 'pnpm':
      return { cmd: 'pnpm', args: [script] };
    case 'yarn':
      return { cmd: 'yarn', args: [script] };
    case 'bun':
      return { cmd: 'bun', args: ['run', script] };
    default:
      return { cmd: 'npm', args: ['run', script] };
  }
}

export function packageManagerDlxCommand(
  packageManager: PackageManager,
  packageName: string,
  args: string[]
): { cmd: string; args: string[] } {
  switch (packageManager) {
    case 'pnpm':
      return { cmd: 'pnpm', args: ['dlx', packageName, ...args] };
    case 'yarn':
      return { cmd: 'yarn', args: ['dlx', packageName, ...args] };
    case 'bun':
      return { cmd: 'bunx', args: [packageName, ...args] };
    default:
      return { cmd: 'npx', args: [packageName, ...args] };
  }
}

function renderInstallName(installPackage: InstallPackage): string {
  return installPackage.name;
}

function packageManagerInstallCommandForGroup(
  packageManager: PackageManager,
  installPackages: InstallPackage[],
  dev: boolean
): { cmd: string; args: string[] } {
  switch (packageManager) {
    case 'pnpm':
      return {
        cmd: 'pnpm',
        args: [
          'add',
          ...(dev ? ['-D'] : []),
          ...renderInstallNames(installPackages),
        ],
      };
    case 'yarn':
      return {
        cmd: 'yarn',
        args: [
          'add',
          ...(dev ? ['-D'] : []),
          ...renderInstallNames(installPackages),
        ],
      };
    case 'bun':
      return {
        cmd: 'bun',
        args: [
          'add',
          ...(dev ? ['-d'] : []),
          ...renderInstallNames(installPackages),
        ],
      };
    default:
      return {
        cmd: 'npm',
        args: [
          'install',
          ...(dev ? ['-D'] : []),
          ...renderNpmInstallNames(installPackages),
        ],
      };
  }
}

function renderInstallNames(installPackages: InstallPackage[]): string[] {
  return installPackages.map(renderInstallName);
}

function renderNpmInstallNames(installPackages: InstallPackage[]): string[] {
  const names: string[] = [];
  for (const installPackage of installPackages) {
    names.push(renderInstallName(installPackage));
    if (installPackage.exact) {
      names.push('--save-exact');
    }
  }
  return names;
}
