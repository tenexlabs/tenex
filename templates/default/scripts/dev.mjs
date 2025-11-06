#!/usr/bin/env node
// Orchestrate dev: pick a free port, ensure VITE_CONVEX_SITE_URL points to Convex HTTP site,
// then run Vite + Convex.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'
import net from 'node:net'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const cwd = process.cwd()

async function findAvailablePort(startPort = 3000, maxAttempts = 50) {
  // Check both IPv4 and IPv6 loopback to avoid localhost mapping surprises.
  const hostsToCheck = ['127.0.0.1', '::1']

  function tryBind(port, host) {
    return new Promise((resolve) => {
      const server = net.createServer()
      server.unref()
      server.once('error', (err) => {
        // If the address family isn't available on this machine, skip this host.
        if (err && (err.code === 'EADDRNOTAVAIL' || err.code === 'EINVAL')) return resolve('skip')
        if (err && err.code === 'EAFNOSUPPORT') return resolve('skip')
        if (err && err.code === 'EADDRINUSE') return resolve('in_use')
        // Treat any other error as in use to be safe.
        return resolve('in_use')
      })
      server.listen(port, host, () => {
        server.close(() => resolve('ok'))
      })
    })
  }

  async function isFree(port) {
    for (const host of hostsToCheck) {
      const res = await tryBind(port, host)
      if (res === 'in_use') return false
    }
    return true
  }

  for (let i = 0; i < maxAttempts; i++) {
    const port = startPort + i
    if (await isFree(port)) return port
  }

  // Fallback: OS-chosen ephemeral port; validate it too.
  return await new Promise((resolve, reject) => {
    const server = net.createServer()
    server.unref()
    server.on('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address()
      server.close(async () => {
        if (await isFree(port)) resolve(port)
        else resolve(port + 1) // best-effort fallback
      })
    })
  })
}

function updateEnvLocal(appSiteUrl) {
  const envPath = path.join(cwd, '.env.local')
  let contents = ''
  try {
    contents = fs.readFileSync(envPath, 'utf8')
  } catch {
    // file may not exist; we'll create it
  }

  const lines = contents ? contents.split(/\r?\n/) : []
  // VITE_CONVEX_SITE_URL must point to Convex's HTTP site (httpRouter),
  // not the app's Start/Vite dev server. In local dev Convex serves this on 3210.
  // If CONVEX_SITE_URL is present we prefer it, otherwise fall back to 127.0.0.1:3210.
  const getVar = (name) => {
    const line = lines.find((l) => l.startsWith(name + '='))
    if (!line) return undefined
    return line.slice(name.length + 1)
  }
  const convexRpcUrl =
    getVar('VITE_CONVEX_URL') ||
    process.env.VITE_CONVEX_URL ||
    'http://127.0.0.1:3212'
  const convexSiteUrl = (() => {
    if (process.env.CONVEX_SITE_URL) return process.env.CONVEX_SITE_URL
    try {
      const url = new URL(convexRpcUrl)
      const basePort = url.port ? Number(url.port) : url.protocol === 'https:' ? 443 : 80
      const nextPort = Number.isFinite(basePort) ? basePort + 1 : basePort
      url.port = String(nextPort)
      return url.toString().replace(/\/$/, '')
    } catch {
      return 'http://127.0.0.1:3211'
    }
  })()

  const setVar = (name, value) => {
    const newLine = `${name}=${value}`
    let found = false
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith(name + '=')) {
        lines[i] = newLine
        found = true
        break
      }
    }
    if (!found) {
      if (lines.length && lines[lines.length - 1] !== '') lines.push('')
      lines.push(newLine)
    }
  }

  // Keep the app's site URL available for anything that needs it at runtime
  setVar('SITE_URL', appSiteUrl)
  // And point Better Auth integrations at Convex's HTTP site
  setVar('VITE_CONVEX_SITE_URL', convexSiteUrl)

  fs.writeFileSync(envPath, lines.join('\n'))
  return envPath
}

function watchConvexUrlAndSyncSiteUrl(envPath, appSiteUrl) {
  let lastRpcUrl

  const readRpcUrl = () => {
    try {
      const contents = fs.readFileSync(envPath, 'utf8')
      const lines = contents ? contents.split(/\r?\n/) : []
      const getVar = (name) => {
        const line = lines.find((l) => l.startsWith(name + '='))
        if (!line) return undefined
        return line.slice(name.length + 1)
      }
      return getVar('VITE_CONVEX_URL')
    } catch {
      return undefined
    }
  }

  lastRpcUrl = readRpcUrl()
  console.log(`[dev] Watching ${path.relative(cwd, envPath)} for VITE_CONVEX_URL changes`)

  let timer
  const onChange = () => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      const current = readRpcUrl()
      if (current && current !== lastRpcUrl) {
        console.log(`[dev] VITE_CONVEX_URL changed -> ${current}; updating VITE_CONVEX_SITE_URL (RPC+1)`) 
        // Re-run the same logic used initially to sync SITE_URL and VITE_CONVEX_SITE_URL
        updateEnvLocal(appSiteUrl)
        lastRpcUrl = current
      }
    }, 150)
  }

  const watchCb = (curr, prev) => {
    if (curr.mtimeMs !== prev.mtimeMs) onChange()
  }

  fs.watchFile(envPath, { interval: 300 }, watchCb)

  return {
    close() {
      fs.unwatchFile(envPath, watchCb)
    },
  }
}

function run(cmd, args, options = {}) {
  const child = spawn(cmd, args, { stdio: 'inherit', shell: process.platform === 'win32', ...options })
  return new Promise((resolve, reject) => {
    child.on('exit', (code, signal) => {
      if (code === 0) resolve()
      else reject(new Error(`${cmd} ${args.join(' ')} exited with code ${code ?? 'null'} signal ${signal ?? 'null'}`))
    })
    child.on('error', reject)
  })
}

function spawnBg(cmd, args, options = {}) {
  return spawn(cmd, args, { stdio: 'inherit', shell: process.platform === 'win32', ...options })
}

function convexCmdArgs(...args) {
  // Prefer the local Convex CLI entry to avoid buggy .bin shims
  const localConvex = path.join(cwd, 'node_modules', 'convex', 'bin', 'main.js')
  if (fs.existsSync(localConvex)) {
    // Use the current Node to run the CLI directly
    return { cmd: process.execPath, args: [localConvex, ...args] }
  }
  // Fallback to npx if local package not found
  return { cmd: 'npx', args: ['convex', ...args] }
}


async function main() {
  const startPort = Number(process.env.VITE_DEV_PORT ?? 3000)
  const port = await findAvailablePort(startPort)
  const host = 'localhost'
  const siteUrl = `http://${host}:${port}`

  const envPath = updateEnvLocal(siteUrl)
  console.log(`[dev] Using SITE_URL=${siteUrl}`)
  console.log(
    `[dev] Ensured VITE_CONVEX_SITE_URL points to Convex HTTP site (default http://127.0.0.1:3213) in ${path.relative(cwd, envPath)}`,
  )

  // Ensure Convex local dev state is prepared first (mirrors original script)
  {
    const { cmd, args } = convexCmdArgs('dev', '--once')
    await run(cmd, args)
  }

  // Start watching for VITE_CONVEX_URL updates to keep VITE_CONVEX_SITE_URL in sync
  const envWatcher = watchConvexUrlAndSyncSiteUrl(envPath, siteUrl)

  // Start Vite and Convex together
  // Prefer the local Vite CLI entry to avoid buggy .bin/npx shims
  const localVite = path.join(cwd, 'node_modules', 'vite', 'bin', 'vite.js')
  const vite = fs.existsSync(localVite)
    ? spawnBg(process.execPath, [localVite, 'dev', '--host', host, '--port', String(port), '--strictPort'])
    : spawnBg('npx', ['vite', 'dev', '--host', host, '--port', String(port), '--strictPort'])
  // Start Convex with piped stdio so we can detect readiness, while teeing output
  const { cmd: convexCmd, args: convexArgs } = convexCmdArgs('dev')
  const convexBg = spawn(convexCmd, convexArgs, {
    stdio: ['inherit', 'pipe', 'pipe'],
    shell: process.platform === 'win32',
  })

  // Tee Convex output to the console and detect readiness line
  let convexReady = false
  let convexEnvEnsurer = null
  let envEnsurerSpawned = false
  const ensureScript = path.join(__dirname, 'ensure-convex-env.mjs')
  const readyRegex = /Convex functions ready/i
  const spawnEnsurerOnce = () => {
    if (envEnsurerSpawned) return
    envEnsurerSpawned = true
    console.log('[dev] Spawning Convex env ensure worker...')
    convexEnvEnsurer = spawn(process.execPath, [ensureScript, siteUrl, envPath], {
      stdio: 'inherit',
      shell: process.platform === 'win32',
    })
  }
  const handleConvexData = (chunk) => {
    const text = chunk.toString()
    process.stdout.write(text)
    if (!convexReady && readyRegex.test(text)) {
      convexReady = true
      // Spawn a separate process to ensure Convex env vars after Convex is up
      spawnEnsurerOnce()
    }
  }
  convexBg.stdout.on('data', handleConvexData)
  convexBg.stderr.on('data', (d) => process.stderr.write(d))

  // Fallback: if the ready line isn't observed (e.g. format changes), spawn after a short delay.
  setTimeout(() => {
    if (!envEnsurerSpawned) spawnEnsurerOnce()
  }, 15000)

  const cleanExit = () => {
    vite.kill('SIGINT')
    convexBg.kill('SIGINT')
    envWatcher.close()
    if (convexEnvEnsurer) convexEnvEnsurer.kill('SIGINT')
  }
  process.on('SIGINT', cleanExit)
  process.on('SIGTERM', cleanExit)

  // Wait for any to exit; then exit with that code
  await new Promise((resolve) => {
    let finished = false
    const done = () => {
      if (finished) return
      finished = true
      cleanExit()
      resolve()
    }
    vite.on('exit', done)
    convexBg.on('exit', done)
  })
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
