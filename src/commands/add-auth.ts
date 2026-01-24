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
import { run } from '../lib/run';

const CONVEX_CLOUD_REGEX = /\.convex\.cloud$/;
const TRAILING_SLASH_REGEX = /\/$/;
const TRANSIENT_ENV_OUTPUT_REGEX =
  /Environment variables have changed during push|Hit an error while pushing|Failed due to network error/i;
const CONVEX_READY_REGEX = /convex functions ready/i;
// biome-ignore lint/suspicious/noControlCharactersInRegex: ANSI escape sequences require ESC control character
const ANSI_ESCAPE_REGEX = /\u001b\[[0-9;]*[a-zA-Z]/g;

export async function addAuth(projectDir: string) {
  intro('tenex add auth');

  await applyAuthAddon(projectDir);

  log.info('Installing dependencies...');
  await run('npm', ['install', 'convex@latest', '@convex-dev/better-auth'], {
    cwd: projectDir,
  });
  await run(
    'npm',
    ['install', `better-auth@${BETTER_AUTH_VERSION}`, '--save-exact'],
    {
      cwd: projectDir,
    }
  );
  await run('npm', ['install', '-D', '@types/node'], { cwd: projectDir });

  log.info('Initializing Convex (this may prompt you to log in)...');
  await run('npx', ['convex', 'dev', '--once'], { cwd: projectDir });

  const { convexUrl, siteUrl } = await ensureDotEnvLocal(projectDir);

  log.info('Setting required Convex env vars...');

  if (isLocalConvexUrl(convexUrl)) {
    // For local deployments, `convex env set` requires the local backend to be running.
    await withConvexDevRunning(projectDir, convexUrl, async () => {
      await setEnvVars(projectDir, siteUrl);
    });
  } else {
    await setEnvVars(projectDir, siteUrl);
  }

  outro('Auth setup complete. Run: npm run dev');
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

async function setEnvVars(projectDir: string, siteUrl: string) {
  const hasBetterAuthSecret = await convexEnvVarExists(
    projectDir,
    'BETTER_AUTH_SECRET'
  );
  if (hasBetterAuthSecret) {
    log.info('BETTER_AUTH_SECRET already set; leaving it unchanged');
  } else {
    await runConvexEnvSet(
      projectDir,
      'BETTER_AUTH_SECRET',
      generateBetterAuthSecret()
    );
    log.success('Set BETTER_AUTH_SECRET');
  }
  const hasSiteUrl = await convexEnvVarExists(projectDir, 'SITE_URL');
  if (hasSiteUrl) {
    log.info('SITE_URL already set; leaving it unchanged');
  } else {
    await runConvexEnvSet(projectDir, 'SITE_URL', siteUrl);
    log.success('Set SITE_URL');
  }
}

async function convexEnvVarExists(projectDir: string, name: string) {
  const { stdout } = await runCapture('npx', ['convex', 'env', 'list'], {
    cwd: projectDir,
  });
  return new RegExp(`\\b${escapeRegExp(name)}\\b`).test(stdout);
}

async function runConvexEnvSet(
  projectDir: string,
  name: string,
  value: string
) {
  const maxAttempts = 3;
  let lastOutput = '';

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const { stdout, stderr } = await runCapture(
      'npx',
      ['convex', 'env', 'set', name, value],
      { cwd: projectDir }
    );

    lastOutput = [stdout, stderr].filter(Boolean).join('\n');

    const exists = await convexEnvVarExists(projectDir, name);
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
  options: { cwd: string; env?: NodeJS.ProcessEnv }
): Promise<{ stdout: string; stderr: string }> {
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
      if (code === 0) {
        return resolve({ stdout, stderr });
      }

      reject(
        new Error(
          `${cmd} ${args.join(' ')} exited with code ${code ?? 'null'} signal ${signal ?? 'null'}\n${stderr || stdout}`
        )
      );
    });
  });
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
  convexUrl: string,
  fn: () => Promise<T>
): Promise<T> {
  log.info('Starting Convex local backend (convex dev)...');

  // Run `convex dev` non-interactively. When stdin is a TTY, Convex enables
  // keyboard controls (raw mode) which can crash with `setRawMode EIO` on some
  // setups (and it also conflicts with other commands we run in this process).
  const child = spawn('npx', ['convex', 'dev'], {
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
    await Promise.all([
      waitForTcpFromUrl(convexUrl, 60_000, child),
      readyPromise,
    ]);
    return await fn();
  } finally {
    await stopChildProcess(child);
  }
}

function observeConvexDevOutput(
  child: ChildProcess,
  timeoutMs: number
): Promise<boolean> {
  return new Promise((resolve) => {
    let resolved = false;
    const stdoutBuffer = { value: '' };
    const stderrBuffer = { value: '' };
    const cleanups: Array<() => void> = [];

    const finish = (value: boolean) => {
      if (resolved) {
        return;
      }
      resolved = true;
      for (const cleanup of cleanups) {
        cleanup();
      }
      resolve(value);
    };

    const handleLine = (line: string) => {
      const cleaned = stripAnsi(line);
      if (CONVEX_READY_REGEX.test(cleaned)) {
        finish(true);
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

    const onExit = () => finish(false);
    child.once('exit', onExit);
    cleanups.push(() => child.off('exit', onExit));

    const timeout = setTimeout(() => finish(false), timeoutMs);
    cleanups.push(() => clearTimeout(timeout));
  });
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
