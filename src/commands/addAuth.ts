import * as path from 'node:path'
import * as net from 'node:net'
import { spawn, type ChildProcess } from 'node:child_process'
import * as p from '@clack/prompts'
import { applyAuthAddon, BETTER_AUTH_VERSION, generateBetterAuthSecret } from '../addons/auth'
import { parseDotenv, upsertDotenvVar } from '../lib/dotenv'
import { pathExists, readTextFile, writeTextFileIfChanged } from '../lib/fs'
import { run } from '../lib/run'

export async function addAuth(projectDir: string) {
  p.intro('tenex add auth')

  await applyAuthAddon(projectDir)

  p.log.info('Installing dependencies...')
  await run('npm', ['install', 'convex@latest', '@convex-dev/better-auth'], { cwd: projectDir })
  await run('npm', ['install', `better-auth@${BETTER_AUTH_VERSION}`, '--save-exact'], {
    cwd: projectDir,
  })
  await run('npm', ['install', '-D', '@types/node'], { cwd: projectDir })

  p.log.info('Initializing Convex (this may prompt you to log in)...')
  await run('npx', ['convex', 'dev', '--once'], { cwd: projectDir })

  const { convexUrl, siteUrl } = await ensureDotEnvLocal(projectDir)

  p.log.info('Setting required Convex env vars...')

  if (isLocalConvexUrl(convexUrl)) {
    // For local deployments, `convex env set` requires the local backend to be running.
    await withConvexDevRunning(projectDir, convexUrl, async () => {
      await setEnvVars(projectDir, siteUrl)
    })
  } else {
    await setEnvVars(projectDir, siteUrl)
  }

  p.outro('Auth setup complete. Run: npm run dev')
}

async function ensureDotEnvLocal(
  projectDir: string,
): Promise<{ convexUrl: string; siteUrl: string }> {
  const envPath = path.join(projectDir, '.env.local')
  if (!(await pathExists(envPath))) {
    throw new Error(`Expected ${envPath} to exist after convex dev --once`)
  }

  const raw = await readTextFile(envPath)
  const env = parseDotenv(raw)

  const rpcUrl = env.VITE_CONVEX_URL
  if (!rpcUrl) {
    throw new Error('VITE_CONVEX_URL was not found in .env.local')
  }

  const convexSiteUrl = env.VITE_CONVEX_SITE_URL ?? deriveConvexSiteUrl(rpcUrl)
  if (!convexSiteUrl) {
    throw new Error('Could not derive VITE_CONVEX_SITE_URL from VITE_CONVEX_URL')
  }

  const siteUrl = env.VITE_SITE_URL ?? 'http://localhost:3000'

  let next = raw
  next = upsertDotenvVar(next, 'VITE_CONVEX_SITE_URL', convexSiteUrl)
  if (!env.VITE_SITE_URL) {
    next = upsertDotenvVar(next, 'VITE_SITE_URL', siteUrl)
  }

  await writeTextFileIfChanged(envPath, next)

  return { convexUrl: rpcUrl, siteUrl }
}

function deriveConvexSiteUrl(convexUrl: string): string | undefined {
  try {
    const url = new URL(convexUrl)

    if (url.hostname.endsWith('.convex.cloud')) {
      url.hostname = url.hostname.replace(/\.convex\.cloud$/, '.convex.site')
      return url.toString().replace(/\/$/, '')
    }

    const basePort = url.port
      ? Number(url.port)
      : url.protocol === 'https:'
        ? 443
        : 80

    if (Number.isFinite(basePort)) {
      url.port = String(basePort + 1)
      return url.toString().replace(/\/$/, '')
    }

    return undefined
  } catch {
    return undefined
  }
}

async function setEnvVars(projectDir: string, siteUrl: string) {
  const hasBetterAuthSecret = await convexEnvVarExists(
    projectDir,
    'BETTER_AUTH_SECRET',
  )
  if (hasBetterAuthSecret) {
    p.log.info('BETTER_AUTH_SECRET already set; leaving it unchanged')
  } else {
    await run(
      'npx',
      ['convex', 'env', 'set', 'BETTER_AUTH_SECRET', generateBetterAuthSecret()],
      {
        cwd: projectDir,
      },
    )
  }
  const hasSiteUrl = await convexEnvVarExists(projectDir, 'SITE_URL')
  if (hasSiteUrl) {
    p.log.info('SITE_URL already set; leaving it unchanged')
  } else {
    await run('npx', ['convex', 'env', 'set', 'SITE_URL', siteUrl], {
      cwd: projectDir,
    })
  }
}

async function convexEnvVarExists(projectDir: string, name: string) {
  const { stdout } = await runCapture('npx', ['convex', 'env', 'list'], {
    cwd: projectDir,
  })
  return new RegExp(`\\b${escapeRegExp(name)}\\b`).test(stdout)
}

async function runCapture(
  cmd: string,
  args: string[],
  options: { cwd: string },
): Promise<{ stdout: string; stderr: string }> {
  return await new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd: options.cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: process.platform === 'win32',
    })

    let stdout = ''
    let stderr = ''

    child.stdout?.setEncoding('utf8')
    child.stderr?.setEncoding('utf8')

    child.stdout?.on('data', (chunk) => {
      stdout += String(chunk)
    })
    child.stderr?.on('data', (chunk) => {
      stderr += String(chunk)
    })

    child.on('error', reject)
    child.on('exit', (code, signal) => {
      if (code === 0) return resolve({ stdout, stderr })

      reject(
        new Error(
          `${cmd} ${args.join(' ')} exited with code ${code ?? 'null'} signal ${signal ?? 'null'}\n${stderr || stdout}`,
        ),
      )
    })
  })
}

function escapeRegExp(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function isLocalConvexUrl(convexUrl: string): boolean {
  try {
    const url = new URL(convexUrl)
    return (
      url.hostname === '127.0.0.1' ||
      url.hostname === 'localhost' ||
      url.hostname === '0.0.0.0' ||
      url.hostname === '::1'
    )
  } catch {
    return false
  }
}

async function withConvexDevRunning<T>(
  projectDir: string,
  convexUrl: string,
  fn: () => Promise<T>,
): Promise<T> {
  p.log.info('Starting Convex local backend (convex dev)...')

  // Run `convex dev` non-interactively. When stdin is a TTY, Convex enables
  // keyboard controls (raw mode) which can crash with `setRawMode EIO` on some
  // setups (and it also conflicts with other commands we run in this process).
  const child = spawn('npx', ['convex', 'dev'], {
    cwd: projectDir,
    stdio: ['ignore', 'inherit', 'inherit'],
    shell: process.platform === 'win32',
    env: {
      ...process.env,
      CI: process.env.CI ?? '1',
    },
  })

  try {
    await waitForTcpFromUrl(convexUrl, 60_000, child)
    return await fn()
  } finally {
    await stopChildProcess(child)
  }
}

async function waitForTcpFromUrl(
  targetUrl: string,
  timeoutMs: number,
  child?: ChildProcess,
) {
  const url = new URL(targetUrl)
  const port = url.port
    ? Number(url.port)
    : url.protocol === 'https:'
      ? 443
      : 80
  const host = url.hostname

  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (child?.exitCode != null) {
      throw new Error(`convex dev exited early with code ${child.exitCode}`)
    }

    const ok = await canConnectTcp(host, port)
    if (ok) return
    await sleep(250)
  }
  throw new Error(`Timed out waiting for Convex backend at ${host}:${port}`)
}

async function canConnectTcp(host: string, port: number): Promise<boolean> {
  return await new Promise<boolean>((resolve) => {
    const socket = net.createConnection({ host, port })
    socket.setTimeout(500)
    socket.once('connect', () => {
      socket.end()
      resolve(true)
    })
    socket.once('timeout', () => {
      socket.destroy()
      resolve(false)
    })
    socket.once('error', () => {
      resolve(false)
    })
  })
}

async function stopChildProcess(child: ChildProcess) {
  if (child.exitCode != null) return

  const waitForExit = async (timeoutMs: number) => {
    return await Promise.race([
      onceExit(child).then(() => true),
      sleep(timeoutMs).then(() => false),
    ])
  }

  const tryKill = async (signal: NodeJS.Signals, timeoutMs: number) => {
    try {
      child.kill(signal)
    } catch {
      // Ignore.
    }
    return await waitForExit(timeoutMs)
  }

  // Try to gracefully stop `convex dev`.
  if (process.platform !== 'win32') {
    if (await tryKill('SIGINT', 10_000)) return
  }
  if (await tryKill('SIGTERM', 10_000)) return
  if (await tryKill('SIGKILL', 10_000)) return
}

async function onceExit(child: ChildProcess) {
  if (child.exitCode != null) return

  await new Promise<void>((resolve) => {
    child.once('exit', () => resolve())
  })
}

async function sleep(ms: number) {
  await new Promise<void>((resolve) => setTimeout(resolve, ms))
}
