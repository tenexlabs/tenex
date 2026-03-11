import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { parseDotenv } from './dotenv';
import { pathExists, readTextFile } from './fs';
import {
  detectPackageManager,
  type PackageManager,
  packageManagerExecCommand,
} from './package-manager';
import {
  addonEnvRequirements,
  readTenexManifest,
  type TenexManifest,
} from './tenex-config';

const LINE_SPLIT_REGEX = /\r?\n/;
const ENV_NAME_REGEX = /^\s*([A-Z0-9_]+)\b/;

export interface DoctorResult {
  convexEnvError?: string;
  manifest: TenexManifest;
  missingConvexEnvVars: string[];
  missingLocalEnvVars: string[];
  packageManager: PackageManager;
}

export async function inspectProjectHealth(
  projectDir: string
): Promise<DoctorResult> {
  const manifest = await readTenexManifest(projectDir);
  const packageManager = await detectPackageManager(projectDir);
  const requiredEnvVars = addonEnvRequirements(manifest);
  const localEnvVars = await readLocalEnvVars(projectDir);
  const requiredLocal = requiredEnvVars.filter((envVar) =>
    envVar.startsWith('VITE_')
  );
  const requiredConvex = requiredEnvVars.filter(
    (envVar) => !envVar.startsWith('VITE_')
  );
  const missingLocalEnvVars = requiredLocal.filter(
    (envVar) => !localEnvVars.has(envVar)
  );

  const convexEnvResult = readConvexEnvVars(projectDir, packageManager);
  const missingConvexEnvVars = convexEnvResult.values
    ? requiredConvex.filter((envVar) => !convexEnvResult.values?.has(envVar))
    : requiredConvex;

  return {
    manifest,
    packageManager,
    missingConvexEnvVars,
    missingLocalEnvVars,
    convexEnvError: convexEnvResult.error,
  };
}

async function readLocalEnvVars(projectDir: string): Promise<Set<string>> {
  const envPaths = [join(projectDir, '.env.local'), join(projectDir, '.env')];
  const envVars = new Set<string>();
  for (const envPath of envPaths) {
    if (!(await pathExists(envPath))) {
      continue;
    }
    const raw = await readTextFile(envPath);
    const parsed = parseDotenv(raw);
    for (const envVar of Object.keys(parsed)) {
      envVars.add(envVar);
    }
  }
  return envVars;
}

function readConvexEnvVars(
  projectDir: string,
  packageManager: PackageManager
): { error?: string; values?: Set<string> } {
  const command = packageManagerExecCommand(packageManager, 'convex', [
    'env',
    'list',
  ]);
  const result = spawnSync(command.cmd, command.args, {
    cwd: projectDir,
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });

  if (result.status !== 0) {
    return {
      error: (result.stderr || result.stdout || 'Failed to inspect Convex env')
        .trim()
        .slice(0, 300),
    };
  }

  const values = new Set<string>();
  for (const line of (result.stdout ?? '').split(LINE_SPLIT_REGEX)) {
    const match = line.match(ENV_NAME_REGEX);
    if (match?.[1]) {
      values.add(match[1]);
    }
  }
  return { values };
}
