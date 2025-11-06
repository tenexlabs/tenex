#!/usr/bin/env node
// Ensure Convex env vars (SITE_URL, BETTER_AUTH_SECRET) are set.
// Designed to run as a separate background process after `convex dev` starts.

import fs from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'
import crypto from 'node:crypto'
import http from 'node:http'
import https from 'node:https'

const cwd = process.cwd()

function convexCmdArgs(...args) {
  const localConvex = path.join(cwd, 'node_modules', 'convex', 'bin', 'main.js')
  if (fs.existsSync(localConvex)) {
    return { cmd: process.execPath, args: [localConvex, ...args] }
  }
  return { cmd: 'npx', args: ['convex', ...args] }
}

function run(cmd, args, options = {}) {
  const child = spawn(cmd, args, { stdio: 'inherit', shell: process.platform === 'win32', ...options })
  return new Promise((resolve, reject) => {
    child.on('exit', (code, signal) => {
      if (code === 0) resolve({ code })
      else reject(new Error(`${cmd} ${args.join(' ')} exited with code ${code ?? 'null'} signal ${signal ?? 'null'}`))
    })
    child.on('error', reject)
  })
}

function runCapture(cmd, args, options = {}) {
  const child = spawn(cmd, args, {
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: process.platform === 'win32',
    ...options,
  })
  return new Promise((resolve) => {
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (d) => (stdout += d.toString()))
    child.stderr.on('data', (d) => (stderr += d.toString()))
    child.on('error', (err) => resolve({ code: -1, stdout, stderr: stderr + String(err) }))
    child.on('exit', (code) => resolve({ code, stdout, stderr }))
  })
}

function loadLocalEnv(envPath) {
  const out = {}
  try {
    const contents = fs.readFileSync(envPath, 'utf8')
    const lines = contents.split(/\r?\n/)
    for (let raw of lines) {
      if (!raw || /^\s*#/.test(raw)) continue
      // Support optional leading 'export '
      raw = raw.replace(/^\s*export\s+/, '')
      const eq = raw.indexOf('=')
      if (eq === -1) continue
      const key = raw.slice(0, eq).trim()
      let value = raw.slice(eq + 1).trim()

      // Strip inline comments outside of quotes (a # preceded by whitespace)
      if (!(value.startsWith('"') || value.startsWith("'"))) {
        const hashIdx = value.indexOf('#')
        if (hashIdx !== -1) {
          const before = value.slice(0, hashIdx)
          const afterStartsComment = /\s$/.test(before)
          if (afterStartsComment) value = before.trimEnd()
        }
      }
      // Remove surrounding quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1)
      }
      if (key) out[key] = value
    }
  } catch {}
  return out
}

async function main() {
  const siteUrl = process.argv[2]
  const envPath = path.resolve(process.argv[3] || path.join(cwd, '.env.local'))
  if (!siteUrl) {
    console.error('[dev] ensure-convex-env: siteUrl arg is required')
    process.exit(2)
  }

  const localEnv = loadLocalEnv(envPath)
  const { cmd, args: baseArgs } = convexCmdArgs('env')
  const convexRpcUrl = localEnv.VITE_CONVEX_URL || 'http://127.0.0.1:3212'

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

  async function waitForLocalConvex(urlStr, timeoutMs = 60000) {
    const start = Date.now()
    while (Date.now() - start < timeoutMs) {
      try {
        const url = new URL(urlStr)
        const mod = url.protocol === 'https:' ? https : http
        await new Promise((resolve, reject) => {
          const req = mod.request(
            { hostname: url.hostname, port: url.port || (url.protocol === 'https:' ? 443 : 80), path: '/', method: 'GET', timeout: 1500 },
            (res) => {
              // Any HTTP response counts as available
              res.resume()
              res.on('end', resolve)
            },
          )
          req.on('timeout', () => {
            req.destroy(new Error('timeout'))
          })
          req.on('error', reject)
          req.end()
        })
        return true
      } catch (e) {
        // Not ready yet; wait and retry
        await sleep(500)
      }
    }
    return false
  }

  async function getVarResult(name) {
    return await runCapture(cmd, [...baseArgs, 'get', name], { env: { ...process.env, ...localEnv } })
  }

  async function setVar(name, value) {
    const args = [...baseArgs, 'set', name, String(value)]
    const MAX_TRIES = 5
    for (let i = 0; i < MAX_TRIES; i++) {
      const res = await runCapture(cmd, args, { env: { ...process.env, ...localEnv } })
      const out = (res.stdout || '') + (res.stderr || '')
      if (res.code === 0) return true
      // Retry on RaceDetected during push
      if (/RaceDetected|Environment variables have changed during push/i.test(out)) {
        await new Promise((r) => setTimeout(r, 1000 + i * 250))
        continue
      }
      // Any other failure: log and break
      process.stderr.write(`[dev] Failed to set ${name}: ${out}\n`)
      return false
    }
    return false
  }

  function generateSecret() {
    return crypto.randomBytes(32).toString('base64')
  }

  let stopped = false

  // First, ensure the local Convex JSON-RPC endpoint is accepting connections
  const ok = await waitForLocalConvex(convexRpcUrl)
  if (!ok) {
    console.warn(`[dev] Timed out waiting for Convex RPC at ${convexRpcUrl}; will still attempt env setup`)
  }
  const tick = async () => {
    if (stopped) return
    try {
      const siteRes = await getVarResult('SITE_URL')
      const secretRes = await getVarResult('BETTER_AUTH_SECRET')

      const currentSiteUrl = (siteRes.stdout || '').trim()
      const currentSecret = (secretRes.stdout || '').trim()

      let changed = false
      if (siteRes.code !== 0 || !currentSiteUrl || /not set|not found|error/i.test(currentSiteUrl)) {
        console.log(`[dev] Convex env SITE_URL not set; setting to ${siteUrl}`)
        changed = (await setVar('SITE_URL', siteUrl)) || changed
      }
      if (secretRes.code !== 0 || !currentSecret || /not set|not found|error/i.test(currentSecret)) {
        console.log('[dev] Convex env BETTER_AUTH_SECRET not set; generating one')
        changed = (await setVar('BETTER_AUTH_SECRET', generateSecret())) || changed
      }

      if (changed) console.log('[dev] Convex env synchronized (SITE_URL, BETTER_AUTH_SECRET)')

      // Verify both present now; treat non-zero code as not-present
      const checkSite = await getVarResult('SITE_URL')
      const checkSecret = await getVarResult('BETTER_AUTH_SECRET')
      const haveSite = checkSite.code === 0 && (checkSite.stdout || '').trim()
      const haveSecret = checkSecret.code === 0 && (checkSecret.stdout || '').trim()
      if (haveSite && haveSecret) {
        stopped = true
        clearInterval(interval)
        process.exit(0)
      }
    } catch (e) {
      // Likely Convex dev not ready yet; keep retrying
    }
  }

  // Try immediately, then poll until both vars exist
  await tick()
  const interval = setInterval(tick, 2000)

  const cleanExit = () => {
    stopped = true
    clearInterval(interval)
  }
  process.on('SIGINT', cleanExit)
  process.on('SIGTERM', cleanExit)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
