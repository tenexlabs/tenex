import { type ChildProcess, spawn } from 'node:child_process';
import { createConnection } from 'node:net';
import { join } from 'node:path';
import { intro, log, outro } from '@clack/prompts';
import {
  applyAuthAddon,
  BETTER_AUTH_VERSION,
  generateBetterAuthSecret,
} from '../addons/auth';
import { parseDotenv, upsertDotenvVar } from '../lib/dotenv';
import { pathExists, readTextFile, writeTextFileIfChanged } from '../lib/fs';
import {
  detectPackageManager,
  type PackageManager,
  packageManagerExecCommand,
  packageManagerInstallCommand,
} from '../lib/package-manager';
import { run } from '../lib/run';

const CONVEX_CLOUD_REGEX = /\.convex\.cloud$/;
const TRAILING_SLASH_REGEX = /\/$/;
const TRANSIENT_ENV_OUTPUT_REGEX =
  /Environment variables have changed during push|Hit an error while pushing|Failed due to network error/i;
const CONVEX_READY_REGEX = /convex functions ready/i;
// biome-ignore lint/suspicious/noControlCharactersInRegex: ANSI escape sequences require ESC control character
const ANSI_ESCAPE_REGEX = /\u001b\[[0-9;]*[a-zA-Z]/g;
interface RunCaptureResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  signal: NodeJS.Signals | null;
}
interface ConvexDevReadyResult {
  ready: boolean;
  reason: 'ready' | 'exit' | 'timeout';
}

interface AddAuthOptions {
  allowOverwrite?: boolean;
  packageManager?: PackageManager;
  showIntro?: boolean;
}

export async function addAuth(
  projectDir: string,
  options: AddAuthOptions = {}
) {
  const packageManager =
    options.packageManager ?? (await detectPackageManager(projectDir));

  if (options.showIntro !== false) {
    intro('tenex add auth');
  }

  await applyAuthAddon(projectDir, {
    allowOverwrite: options.allowOverwrite,
  });

  log.info('Installing dependencies...');
  for (const command of packageManagerInstallCommand(packageManager, [
    { name: 'convex@latest' },
    { name: '@convex-dev/better-auth' },
    { name: `better-auth@${BETTER_AUTH_VERSION}`, exact: true },
    { name: '@types/node', dev: true },
  ])) {
    await run(command.cmd, command.args, { cwd: projectDir });
  }

  log.info('Initializing Convex (this may prompt you to log in)...');
  const convexOnce = packageManagerExecCommand(packageManager, 'convex', [
    'dev',
    '--once',
  ]);
  await run(convexOnce.cmd, convexOnce.args, { cwd: projectDir });

  const { convexUrl, siteUrl } = await ensureDotEnvLocal(projectDir);

  log.info('Setting required Convex env vars...');

  if (isLocalConvexUrl(convexUrl)) {
    // For local deployments, `convex env set` requires the local backend to be running.
    await withConvexDevRunning(
      projectDir,
      packageManager,
      convexUrl,
      async () => {
        await setEnvVars(projectDir, packageManager, siteUrl);
      }
    );
  } else {
    await setEnvVars(projectDir, packageManager, siteUrl);
  }

  if (options.showIntro !== false) {
    outro('Auth setup complete. Run: tenex dev');
  }
}

async function ensureDotEnvLocal(
  projectDir: string
): Promise<{ convexUrl: string; siteUrl: string }> {
  const envPath = join(projectDir, '.env.local');
  if (!(await pathExists(envPath))) {
    throw new Error(`Expected ${envPath} to exist after convex dev --once`);
  }

  const raw = await readTextFile(envPath);
  const env = parseDotenv(raw);

  const rpcUrl = env.VITE_CONVEX_URL;
  if (!rpcUrl) {
    throw new Error('VITE_CONVEX_URL was not found in .env.local');
  }

  const convexSiteUrl = env.VITE_CONVEX_SITE_URL ?? deriveConvexSiteUrl(rpcUrl);
  if (!convexSiteUrl) {
    throw new Error(
      'Could not derive VITE_CONVEX_SITE_URL from VITE_CONVEX_URL'
    );
  }

  const siteUrl = env.VITE_SITE_URL ?? 'http://localhost:3000';

  let next = raw;
  next = upsertDotenvVar(next, 'VITE_CONVEX_SITE_URL', convexSiteUrl);
  if (!env.VITE_SITE_URL) {
    next = upsertDotenvVar(next, 'VITE_SITE_URL', siteUrl);
  }

  await writeTextFileIfChanged(envPath, next);

  return { convexUrl: rpcUrl, siteUrl };
}

function getDefaultPort(protocol: string): number {
  if (protocol === 'https:') {
    return 443;
  }
  return 80;
}

function deriveConvexSiteUrl(convexUrl: string): string | undefined {
  try {
    const url = new URL(convexUrl);

    if (url.hostname.endsWith('.convex.cloud')) {
      url.hostname = url.hostname.replace(CONVEX_CLOUD_REGEX, '.convex.site');
      return url.toString().replace(TRAILING_SLASH_REGEX, '');
    }

    const basePort = url.port ? Number(url.port) : getDefaultPort(url.protocol);

    if (Number.isFinite(basePort)) {
      url.port = String(basePort + 1);
      return url.toString().replace(TRAILING_SLASH_REGEX, '');
    }

    return undefined;
  } catch {
    return undefined;
  }
}

async function setEnvVars(
  projectDir: string,
  packageManager: PackageManager,
  siteUrl: string
) {
  const hasBetterAuthSecret = await convexEnvVarExists(
    projectDir,
    packageManager,
    'BETTER_AUTH_SECRET'
  );
  if (hasBetterAuthSecret) {
    log.info('BETTER_AUTH_SECRET already set; leaving it unchanged');
  } else {
    await runConvexEnvSet(
      projectDir,
      packageManager,
      'BETTER_AUTH_SECRET',
      generateBetterAuthSecret()
    );
    log.success('Set BETTER_AUTH_SECRET');
  }
  const hasSiteUrl = await convexEnvVarExists(
    projectDir,
    packageManager,
    'SITE_URL'
  );
  if (hasSiteUrl) {
    log.info('SITE_URL already set; leaving it unchanged');
  } else {
    await runConvexEnvSet(projectDir, packageManager, 'SITE_URL', siteUrl);
    log.success('Set SITE_URL');
  }
}

async function convexEnvVarExists(
  projectDir: string,
  packageManager: PackageManager,
  name: string
) {
  const convexList = packageManagerExecCommand(packageManager, 'convex', [
    'env',
    'list',
  ]);
  const { stdout } = await runCapture(convexList.cmd, convexList.args, {
    cwd: projectDir,
  });
  return new RegExp(`\\b${escapeRegExp(name)}\\b`).test(stdout);
}

async function runConvexEnvSet(
  projectDir: string,
  packageManager: PackageManager,
  name: string,
  value: string
) {
  const maxAttempts = 3;
  let lastOutput = '';

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const convexSet = packageManagerExecCommand(packageManager, 'convex', [
      'env',
      'set',
      name,
      value,
    ]);
    const result = await runCapture(convexSet.cmd, convexSet.args, {
      cwd: projectDir,
      allowNonZeroExit: true,
    });

    lastOutput = formatRunCaptureResult(result);

    let exists = false;
    try {
      exists = await convexEnvVarExists(projectDir, packageManager, name);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      lastOutput = [lastOutput, `convex env list check failed: ${message}`]
        .filter(Boolean)
        .join('\n');
    }
    if (exists) {
      return;
    }

    if (!isTransientConvexEnvOutput(lastOutput) || attempt === maxAttempts) {
      break;
    }

    await sleep(500 * attempt);
  }

  const trimmedOutput = lastOutput.trim();
  const suffix = trimmedOutput ? `\n${trimmedOutput}` : '';
  throw new Error(`Failed to set ${name} in Convex.${suffix}`);
}

function isTransientConvexEnvOutput(output: string): boolean {
  return TRANSIENT_ENV_OUTPUT_REGEX.test(output);
}

async function runCapture(
  cmd: string,
  args: string[],
  options: {
    cwd: string;
    env?: NodeJS.ProcessEnv;
    allowNonZeroExit?: boolean;
  }
): Promise<RunCaptureResult> {
  return await new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd: options.cwd,
      env: options.env,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: process.platform === 'win32',
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.setEncoding('utf8');
    child.stderr?.setEncoding('utf8');

    child.stdout?.on('data', (chunk) => {
      stdout += String(chunk);
    });
    child.stderr?.on('data', (chunk) => {
      stderr += String(chunk);
    });

    child.on('error', reject);
    child.on('exit', (code, signal) => {
      const result: RunCaptureResult = {
        stdout,
        stderr,
        exitCode: code,
        signal,
      };

      if (code === 0 || options.allowNonZeroExit) {
        return resolve(result);
      }

      reject(
        new Error(
          `${cmd} ${args.join(' ')} exited with code ${code ?? 'null'} signal ${signal ?? 'null'}\n${stderr || stdout}`
        )
      );
    });
  });
}

function formatRunCaptureResult(result: RunCaptureResult): string {
  return [
    result.stdout,
    result.stderr,
    result.exitCode === 0
      ? ''
      : `exit code ${result.exitCode ?? 'null'} signal ${result.signal ?? 'null'}`,
  ]
    .filter(Boolean)
    .join('\n');
}

function escapeRegExp(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isLocalConvexUrl(convexUrl: string): boolean {
  try {
    const url = new URL(convexUrl);
    return (
      url.hostname === '127.0.0.1' ||
      url.hostname === 'localhost' ||
      url.hostname === '0.0.0.0' ||
      url.hostname === '::1'
    );
  } catch {
    return false;
  }
}

async function withConvexDevRunning<T>(
  projectDir: string,
  packageManager: PackageManager,
  convexUrl: string,
  fn: () => Promise<T>
): Promise<T> {
  log.info('Starting Convex local backend (convex dev)...');

  // Run `convex dev` non-interactively. When stdin is a TTY, Convex enables
  // keyboard controls (raw mode) which can crash with `setRawMode EIO` on some
  // setups (and it also conflicts with other commands we run in this process).
  const convexDev = packageManagerExecCommand(packageManager, 'convex', [
    'dev',
  ]);
  const child = spawn(convexDev.cmd, convexDev.args, {
    cwd: projectDir,
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: process.platform === 'win32',
    detached: process.platform !== 'win32',
    env: {
      ...process.env,
      CI: process.env.CI ?? '1',
    },
  });

  const readyPromise = observeConvexDevOutput(child, 60_000);

  try {
    const [, readyResult] = await Promise.all([
      waitForTcpFromUrl(convexUrl, 60_000, child),
      readyPromise,
    ]);
    if (!readyResult.ready) {
      throw convexDevNotReadyError(readyResult);
    }
    return await fn();
  } finally {
    await stopChildProcess(child);
  }
}

function observeConvexDevOutput(
  child: ChildProcess,
  timeoutMs: number
): Promise<ConvexDevReadyResult> {
  return new Promise((resolve) => {
    let resolved = false;
    const stdoutBuffer = { value: '' };
    const stderrBuffer = { value: '' };
    const cleanups: Array<() => void> = [];

    const finish = (result: ConvexDevReadyResult) => {
      if (resolved) {
        return;
      }
      resolved = true;
      for (const cleanup of cleanups) {
        cleanup();
      }
      resolve(result);
    };

    const handleLine = (line: string) => {
      const cleaned = stripAnsi(line);
      if (CONVEX_READY_REGEX.test(cleaned)) {
        finish({ ready: true, reason: 'ready' });
      }
    };

    cleanups.push(
      attachConvexDevStream(
        child.stdout,
        stdoutBuffer,
        process.stdout,
        handleLine
      )
    );
    cleanups.push(
      attachConvexDevStream(
        child.stderr,
        stderrBuffer,
        process.stderr,
        handleLine
      )
    );

    const onExit = () => finish({ ready: false, reason: 'exit' });
    child.once('exit', onExit);
    cleanups.push(() => child.off('exit', onExit));

    const timeout = setTimeout(
      () => finish({ ready: false, reason: 'timeout' }),
      timeoutMs
    );
    cleanups.push(() => clearTimeout(timeout));
  });
}

function convexDevNotReadyError(result: ConvexDevReadyResult): Error {
  if (result.reason === 'exit') {
    return new Error(
      'convex dev exited before reporting that functions were ready'
    );
  }
  return new Error(
    'Timed out waiting for convex dev to report that functions were ready'
  );
}

function noop() {
  // Intentionally empty - used as a no-op callback
}

function attachConvexDevStream(
  stream: NodeJS.ReadableStream | null,
  buffer: { value: string },
  target: NodeJS.WritableStream,
  onLine: (line: string) => void
): () => void {
  if (!stream) {
    return noop;
  }
  stream.setEncoding('utf8');

  const onData = (chunk: string) => {
    target.write(chunk);
    buffer.value += chunk;

    const normalized = buffer.value.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const parts = normalized.split('\n');
    buffer.value = parts.pop() ?? '';
    for (const line of parts) {
      if (line.trim()) {
        onLine(line);
      }
    }
  };

  stream.on('data', onData);
  return () => stream.off('data', onData);
}

function stripAnsi(value: string): string {
  return value.replace(ANSI_ESCAPE_REGEX, '');
}

async function waitForTcpFromUrl(
  targetUrl: string,
  timeoutMs: number,
  child?: ChildProcess
) {
  const url = new URL(targetUrl);
  const port = url.port ? Number(url.port) : getDefaultPort(url.protocol);
  const host = url.hostname;

  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (child?.exitCode != null) {
      throw new Error(`convex dev exited early with code ${child.exitCode}`);
    }

    const ok = await canConnectTcp(host, port);
    if (ok) {
      return;
    }
    await sleep(250);
  }
  throw new Error(`Timed out waiting for Convex backend at ${host}:${port}`);
}

async function canConnectTcp(host: string, port: number): Promise<boolean> {
  return await new Promise<boolean>((resolve) => {
    const socket = createConnection({ host, port });
    socket.setTimeout(500);
    socket.once('connect', () => {
      socket.end();
      resolve(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => {
      resolve(false);
    });
  });
}

async function stopChildProcess(child: ChildProcess) {
  if (child.exitCode != null) {
    return;
  }

  const waitForExit = async (timeoutMs: number) => {
    return await Promise.race([
      onceExit(child).then(() => true),
      sleep(timeoutMs).then(() => false),
    ]);
  };

  const tryKill = async (signal: NodeJS.Signals, timeoutMs: number) => {
    killProcessTree(child, signal);
    return await waitForExit(timeoutMs);
  };

  // Try to gracefully stop `convex dev`.
  if (process.platform !== 'win32' && (await tryKill('SIGINT', 10_000))) {
    return;
  }
  if (await tryKill('SIGTERM', 10_000)) {
    return;
  }
  if (await tryKill('SIGKILL', 10_000)) {
    return;
  }
}

function killProcessTree(child: ChildProcess, signal: NodeJS.Signals) {
  const pid = child.pid;
  if (pid && process.platform !== 'win32') {
    try {
      process.kill(-pid, signal);
      return;
    } catch {
      // Fall back to direct kill.
    }
  }

  try {
    child.kill(signal);
  } catch {
    // Ignore.
  }
}

async function onceExit(child: ChildProcess) {
  if (child.exitCode != null) {
    return;
  }

  await new Promise<void>((resolve) => {
    child.once('exit', () => resolve());
  });
}

async function sleep(ms: number) {
  await new Promise<void>((resolve) => setTimeout(resolve, ms));
}
