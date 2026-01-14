import * as path from 'node:path'
import * as crypto from 'node:crypto'
import * as p from '@clack/prompts'
import { pathExists, readTextFile, writeTextFileIfChanged } from '../lib/fs'
import { replaceOrThrow } from '../lib/patch'

export const BETTER_AUTH_VERSION = '1.4.9'

export async function applyAuthAddon(projectDir: string) {
  const srcDir = await resolveAppSourceDir(projectDir)
  const routesDir = path.join(srcDir, 'routes')

  await patchViteConfig(path.join(projectDir, 'vite.config.ts'))
  await patchTsconfig(path.join(projectDir, 'tsconfig.json'))
  await patchRouter(path.join(srcDir, 'router.tsx'))
  await writeRootRoute(path.join(routesDir, '__root.tsx'))

  await writeTextFileIfChanged(
    path.join(srcDir, 'lib', 'auth-client.ts'),
    authClientSource(),
  )
  await writeTextFileIfChanged(
    path.join(srcDir, 'lib', 'auth-server.ts'),
    authServerSource(),
  )
  await writeTextFileIfChanged(
    path.join(routesDir, 'api', 'auth', '$.ts'),
    authProxyRouteSource(),
  )
  await writeTextFileIfChanged(
    path.join(srcDir, 'components', 'Navbar.tsx'),
    navbarComponentSource(),
  )
  await writeTextFileIfChanged(path.join(routesDir, 'login.tsx'), loginRouteSource())
  await writeTextFileIfChanged(path.join(routesDir, 'signup.tsx'), signupRouteSource())
  await writeTextFileIfChanged(
    path.join(routesDir, 'dashboard.tsx'),
    dashboardRouteSource(),
  )

  await writeTextFileIfChanged(path.join(routesDir, 'index.tsx'), landingPageRouteSource())

  await writeTextFileIfChanged(
    path.join(projectDir, 'convex', 'convex.config.ts'),
    convexConfigSource(),
  )
  await writeTextFileIfChanged(
    path.join(projectDir, 'convex', 'auth.config.ts'),
    convexAuthConfigSource(),
  )
  await writeTextFileIfChanged(
    path.join(projectDir, 'convex', 'auth.ts'),
    convexAuthSource(),
  )
  await writeTextFileIfChanged(
    path.join(projectDir, 'convex', 'http.ts'),
    convexHttpSource(),
  )

  p.log.success('Added Better Auth (Convex component)')
}

export function generateBetterAuthSecret(): string {
  return crypto.randomBytes(32).toString('base64')
}

async function resolveAppSourceDir(projectDir: string): Promise<string> {
  const src = path.join(projectDir, 'src')
  if (await pathExists(src)) return src
  const app = path.join(projectDir, 'app')
  if (await pathExists(app)) return app
  throw new Error('Could not find app source directory (expected src/ or app/)')
}

async function patchViteConfig(viteConfigPath: string) {
  if (!(await pathExists(viteConfigPath))) {
    throw new Error(`Missing vite config at ${viteConfigPath}`)
  }
  const current = await readTextFile(viteConfigPath)
  if (current.includes("'@convex-dev/better-auth'") || current.includes('"@convex-dev/better-auth"')) {
    return
  }

  if (current.includes('ssr:')) {
    throw new Error(
      `vite.config.ts already has an ssr block; please add noExternal: ['@convex-dev/better-auth'] manually`,
    )
  }
  if (current.includes('optimizeDeps:')) {
    throw new Error(
      'vite.config.ts already has an optimizeDeps block; please add the Better Auth exclusions manually',
    )
  }

  const updated = replaceOrThrow(
    current,
    '  plugins: [',
    "  ssr: {\n    noExternal: ['@convex-dev/better-auth'],\n  },\n  optimizeDeps: {\n    entries: [\n      'src/routes/**/*.{ts,tsx}',\n      'app/routes/**/*.{ts,tsx}',\n    ],\n    ignoreOutdatedRequests: true,\n    exclude: [\n      '@convex-dev/better-auth',\n      '@convex-dev/better-auth/react',\n      '@convex-dev/better-auth/react-start',\n      '@convex-dev/better-auth/client/plugins',\n      'better-auth',\n      'better-auth/react',\n      'better-auth/minimal',\n      'better-auth/client',\n      'better-auth/client/plugins',\n      '@better-auth/utils',\n      '@better-auth/utils/base64',\n      '@better-auth/utils/binary',\n      '@better-auth/utils/hash',\n      '@better-auth/utils/hex',\n      '@better-auth/utils/hmac',\n      '@better-auth/utils/otp',\n      '@better-auth/utils/random',\n    ],\n  },\n  plugins: [",
    'Could not find plugins array in vite.config.ts to insert ssr.noExternal',
  )

  await writeTextFileIfChanged(viteConfigPath, updated)
}

async function patchTsconfig(tsconfigPath: string) {
  if (!(await pathExists(tsconfigPath))) {
    throw new Error(`Missing tsconfig at ${tsconfigPath}`)
  }

  const current = await readTextFile(tsconfigPath)
  let next = current

  // create-convex's tsconfig.json is JSONC (it contains comments), so we patch it as text.
  next = upsertTsconfigType(next, 'vite/client')
  next = upsertTsconfigType(next, 'node')

  await writeTextFileIfChanged(tsconfigPath, next)
}

function upsertTsconfigType(tsconfigContents: string, typeName: string): string {
  const typesProp = /(^\s*)"types"\s*:\s*\[([\s\S]*?)\]([ \t]*,?)/m
  const match = tsconfigContents.match(typesProp)

  if (match) {
    const indent = match[1] ?? ''
    const inside = match[2] ?? ''
    const trailing = match[3] ?? ''

    const found = new Set<string>()
    for (const m of inside.matchAll(/["']([^"']+)["']/g)) {
      found.add(m[1])
    }
    if (found.has(typeName)) return tsconfigContents

    // Keep vite/client first if present.
    const values = Array.from(found)
    if (values.includes('vite/client')) {
      values.splice(values.indexOf('vite/client'), 1)
      values.unshift('vite/client')
    }
    values.push(typeName)

    const replacement = `${indent}"types": [${values
      .map((v) => JSON.stringify(v))
      .join(', ')}]${trailing}`

    return tsconfigContents.replace(match[0], replacement)
  }

  // No existing `types` array: insert it into compilerOptions.
  const compilerOptionsOpen = /(^\s*)"compilerOptions"\s*:\s*\{/m
  const compilerMatch = tsconfigContents.match(compilerOptionsOpen)
  if (!compilerMatch) {
    throw new Error('Could not find compilerOptions in tsconfig.json to add types')
  }

  const compilerOptionsIndent = compilerMatch[1] ?? ''
  const entryIndent = `${compilerOptionsIndent}  `

  return tsconfigContents.replace(
    compilerOptionsOpen,
    `${compilerOptionsIndent}"compilerOptions": {\n${entryIndent}"types": ["vite/client", "node"],`,
  )
}

async function patchRouter(routerPath: string) {
  if (!(await pathExists(routerPath))) {
    throw new Error(`Missing router file at ${routerPath}`)
  }

  const current = await readTextFile(routerPath)
  if (current.includes('convexQueryClient') && current.includes('context: { queryClient, convexQueryClient')) {
    return
  }

  const updated = replaceOrThrow(
    current,
    /context:\s*\{\s*queryClient\s*\}/,
    'context: { queryClient, convexQueryClient }',
    'Could not find router context block to add convexQueryClient (expected context: { queryClient })',
  )

  await writeTextFileIfChanged(routerPath, updated)
}

async function writeRootRoute(rootRoutePath: string) {
  await writeTextFileIfChanged(rootRoutePath, rootRouteSource())
}

function navbarComponentSource() {
  return `import { Link, useRouteContext, useLocation } from '@tanstack/react-router'
import { authClient } from '~/lib/auth-client'
import { useRouter } from '@tanstack/react-router'
import { useState } from 'react'

export function Navbar() {
  const router = useRouter()
  const location = useLocation()
  const context = useRouteContext({ from: '__root__' })
  const isAuthenticated = context.isAuthenticated
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const isOnDashboard = location.pathname === '/dashboard'

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await authClient.signOut()
      router.navigate({ to: '/' })
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <nav className="border-b border-neutral-800 bg-black">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-xl font-bold text-white">
            Tenex App
          </Link>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                {!isOnDashboard && (
                  <Link
                    to="/dashboard"
                    className="text-neutral-400 hover:text-white transition-colors"
                  >
                    Dashboard
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-white px-4 py-2 rounded-md transition-colors text-sm"
                >
                  {isLoggingOut ? 'Logging out...' : 'Log Out'}
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-neutral-400 hover:text-white transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/signup"
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors text-sm"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
`
}

function landingPageRouteSource() {
  return `import { createFileRoute, Link, useRouteContext } from '@tanstack/react-router'
import { Navbar } from '~/components/Navbar'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  const context = useRouteContext({ from: '__root__' })
  const isAuthenticated = context.isAuthenticated

  return (
    <div className="min-h-screen flex flex-col bg-black">
      <Navbar />

      <main className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-5xl font-bold tracking-tight mb-6 text-white">
            Build faster with <span className="text-red-500">Tenex</span>
          </h1>
          <p className="text-xl text-neutral-400 mb-8">
            A modern full-stack starter powered by TanStack Start, Convex, and Better Auth.
            Everything you need to ship your next project.
          </p>

          <div className="flex gap-4 justify-center">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-md transition-colors text-lg font-medium"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/signup"
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-md transition-colors text-lg font-medium"
                >
                  Get Started
                </Link>
                <Link
                  to="/login"
                  className="bg-neutral-800 hover:bg-neutral-700 text-white px-6 py-3 rounded-md transition-colors text-lg font-medium"
                >
                  Log In
                </Link>
              </>
            )}
          </div>
        </div>
      </main>

      <footer className="py-6 text-center text-sm text-neutral-500">
        Built with Tenex CLI
      </footer>
    </div>
  )
}
`
}

function authClientSource() {
  return `import { createAuthClient } from 'better-auth/react'
import { convexClient } from '@convex-dev/better-auth/client/plugins'

export const authClient = createAuthClient({
  plugins: [convexClient()],
})
`
}

function authServerSource() {
  return `import { convexBetterAuthReactStart } from '@convex-dev/better-auth/react-start'

export const { handler, getToken, fetchAuthQuery, fetchAuthMutation, fetchAuthAction } =
  convexBetterAuthReactStart({
    convexUrl: import.meta.env.VITE_CONVEX_URL!,
    convexSiteUrl: import.meta.env.VITE_CONVEX_SITE_URL!,
  })
`
}

function authProxyRouteSource() {
  return `import { createFileRoute } from '@tanstack/react-router'
import { handler } from '~/lib/auth-server'

export const Route = createFileRoute('/api/auth/$')({
  server: {
    handlers: {
      GET: ({ request }) => handler(request),
      POST: ({ request }) => handler(request),
    },
  },
})
`
}

function rootRouteSource() {
  return `/// <reference types="vite/client" />
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
  useRouteContext,
} from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { ConvexBetterAuthProvider } from '@convex-dev/better-auth/react'
import type { ConvexQueryClient } from '@convex-dev/react-query'
import type { QueryClient } from '@tanstack/react-query'
import * as React from 'react'
import appCss from '~/styles/app.css?url'
import { authClient } from '~/lib/auth-client'
import { getToken } from '~/lib/auth-server'

const getAuth = createServerFn({ method: 'GET' }).handler(async () => {
  return await getToken()
})

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient
  convexQueryClient: ConvexQueryClient
}>()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Tenex App',
      },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
      { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap' },
      {
        rel: 'apple-touch-icon',
        sizes: '180x180',
        href: '/apple-touch-icon.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '32x32',
        href: '/favicon-32x32.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '16x16',
        href: '/favicon-16x16.png',
      },
      { rel: 'manifest', href: '/site.webmanifest', color: '#fffff' },
      { rel: 'icon', href: '/favicon.ico' },
    ],
  }),
  beforeLoad: async (ctx) => {
    const token = await getAuth()

    // Authenticate SSR queries (the only time serverHttpClient exists).
    if (token) {
      ctx.context.convexQueryClient.serverHttpClient?.setAuth(token)
    }

    return {
      isAuthenticated: !!token,
      token,
    }
  },
  notFoundComponent: () => <div className="font-mono text-white bg-black min-h-screen flex items-center justify-center">Route not found</div>,
  component: RootComponent,
})

function RootComponent() {
  const context = useRouteContext({ from: Route.id })
  return (
    <ConvexBetterAuthProvider
      client={context.convexQueryClient.convexClient}
      authClient={authClient}
      initialToken={context.token}
    >
      <RootDocument>
        <Outlet />
      </RootDocument>
    </ConvexBetterAuthProvider>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <head>
        <HeadContent />
      </head>
      <body className="font-mono bg-black text-white">
        {children}
        <Scripts />
      </body>
    </html>
  )
}
`
}

function loginRouteSource() {
  return `import { createFileRoute, useRouter } from '@tanstack/react-router'
import { authClient } from '~/lib/auth-client'
import { useState, type FormEvent } from 'react'
import { Navbar } from '~/components/Navbar'

export const Route = createFileRoute('/login')({
  component: Login,
})

function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const result = await authClient.signIn.email({
        email,
        password,
      })

      if (result.error) {
        setError(result.error.message || 'Login failed. Please try again.')
        setIsLoading(false)
      } else {
        router.navigate({ to: '/dashboard' })
      }
    } catch {
      setError('An unexpected error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-black">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-bold text-center mb-8 text-white">Log In</h1>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div className="bg-red-900/50 border border-red-600 text-red-200 p-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-sm font-medium text-neutral-300">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="px-4 py-2 rounded-md border-2 bg-neutral-900 border-neutral-700 text-white focus:outline-none focus:border-red-500"
                placeholder="you@example.com"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="password" className="text-sm font-medium text-neutral-300">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="px-4 py-2 rounded-md border-2 bg-neutral-900 border-neutral-700 text-white focus:outline-none focus:border-red-500"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:opacity-50 text-white font-medium px-4 py-2 rounded-md transition-colors mt-2"
            >
              {isLoading ? 'Logging in...' : 'Log In'}
            </button>

            <p className="text-sm text-center mt-4 text-neutral-400">
              Don't have an account?{' '}
              <a
                href="/signup"
                className="text-red-500 underline hover:no-underline"
              >
                Sign up
              </a>
            </p>
          </form>
        </div>
      </main>
    </div>
  )
}
`
}

function signupRouteSource() {
  return `import { createFileRoute, useRouter } from '@tanstack/react-router'
import { authClient } from '~/lib/auth-client'
import { useState, type FormEvent } from 'react'
import { Navbar } from '~/components/Navbar'

export const Route = createFileRoute('/signup')({
  component: Signup,
})

function Signup() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const result = await authClient.signUp.email({
        name,
        email,
        password,
      })

      if (result.error) {
        setError(result.error.message || 'Signup failed. Please try again.')
        setIsLoading(false)
      } else {
        router.navigate({ to: '/dashboard' })
      }
    } catch {
      setError('An unexpected error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-black">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-bold text-center mb-8 text-white">Sign Up</h1>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div className="bg-red-900/50 border border-red-600 text-red-200 p-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <label htmlFor="name" className="text-sm font-medium text-neutral-300">
                Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="px-4 py-2 rounded-md border-2 bg-neutral-900 border-neutral-700 text-white focus:outline-none focus:border-red-500"
                placeholder="Jane Doe"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-sm font-medium text-neutral-300">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="px-4 py-2 rounded-md border-2 bg-neutral-900 border-neutral-700 text-white focus:outline-none focus:border-red-500"
                placeholder="you@example.com"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="password" className="text-sm font-medium text-neutral-300">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="px-4 py-2 rounded-md border-2 bg-neutral-900 border-neutral-700 text-white focus:outline-none focus:border-red-500"
                placeholder="••••••••"
              />
              <p className="text-xs text-neutral-500">
                Password must be at least 8 characters long
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:opacity-50 text-white font-medium px-4 py-2 rounded-md transition-colors mt-2"
            >
              {isLoading ? 'Creating account...' : 'Sign Up'}
            </button>

            <p className="text-sm text-center mt-4 text-neutral-400">
              Already have an account?{' '}
              <a
                href="/login"
                className="text-red-500 underline hover:no-underline"
              >
                Log in
              </a>
            </p>
          </form>
        </div>
      </main>
    </div>
  )
}
`
}

function dashboardRouteSource() {
  return `import { createFileRoute, redirect } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { convexQuery } from '@convex-dev/react-query'
import { api } from '../../convex/_generated/api'
import { Navbar } from '~/components/Navbar'

export const Route = createFileRoute('/dashboard')({
  beforeLoad: ({ context }) => {
    if (!context.isAuthenticated) {
      throw redirect({ to: '/login' })
    }
  },
  component: Dashboard,
})

function Dashboard() {
  const { data: user, isLoading } = useQuery(
    convexQuery(api.auth.getCurrentUser, {}),
  )

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-black">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-lg text-white">Loading...</div>
        </main>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen flex flex-col bg-black">
      <Navbar />
      <main className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-white">Dashboard</h1>

          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4 text-white">Welcome back!</h2>
            <div className="flex flex-col gap-2">
              <p className="text-sm text-neutral-300">
                <span className="font-medium text-white">Name:</span> {user.name}
              </p>
              <p className="text-sm text-neutral-300">
                <span className="font-medium text-white">Email:</span> {user.email}
              </p>
              <p className="text-sm text-neutral-500">
                <span className="font-medium text-neutral-400">User ID:</span> {user.id}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
`
}

function convexConfigSource() {
  return `import { defineApp } from 'convex/server'
import betterAuth from '@convex-dev/better-auth/convex.config'

const app = defineApp()
app.use(betterAuth)

export default app
`
}

function convexAuthConfigSource() {
  return `import { getAuthConfigProvider } from '@convex-dev/better-auth/auth-config'
import type { AuthConfig } from 'convex/server'

export default {
  providers: [getAuthConfigProvider()],
} satisfies AuthConfig
`
}

function convexAuthSource() {
  return `import { betterAuth } from 'better-auth/minimal'
import { createClient, type GenericCtx } from '@convex-dev/better-auth'
import { convex } from '@convex-dev/better-auth/plugins'
import authConfig from './auth.config'
import { components } from './_generated/api'
import { query } from './_generated/server'
import type { DataModel } from './_generated/dataModel'

const siteUrl = process.env.SITE_URL!
const extraTrustedOrigins = parseTrustedOrigins(
  process.env.BETTER_AUTH_TRUSTED_ORIGINS,
)

const isLocalDevSiteUrl = (() => {
  try {
    const { hostname } = new URL(siteUrl)
    return (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname === '[::1]'
    )
  } catch {
    return false
  }
})()

type HeadersLike = {
  get(name: string): string | null
}

type RequestLike = {
  headers?: HeadersLike
  url?: string
}

const trustedOrigins = async (request?: RequestLike) => {
  const baseOrigins = isLocalDevSiteUrl
    ? [
        siteUrl,
        'http://localhost:*',
        'http://127.0.0.1:*',
        'http://0.0.0.0:*',
        'http://[::1]:*',
        'https://localhost:*',
        'https://127.0.0.1:*',
        'https://0.0.0.0:*',
        'https://[::1]:*',
      ]
    : [siteUrl]

  const devOriginFromRequest = isLocalDevSiteUrl
    ? getDevOriginFromRequest(request)
    : undefined

  return uniqueStrings([
    ...baseOrigins,
    ...extraTrustedOrigins,
    ...(devOriginFromRequest ? [devOriginFromRequest] : []),
  ])
}

export const authComponent = createClient<DataModel>(components.betterAuth)

export const createAuth = (ctx: GenericCtx<DataModel>) => {
  return betterAuth({
    baseURL: siteUrl,
    trustedOrigins,
    database: authComponent.adapter(ctx),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    plugins: [convex({ authConfig })],
  })
}

function parseTrustedOrigins(value?: string): string[] {
  if (!value) return []
  return value
    .split(/[\s,]+/g)
    .map((origin) => origin.trim())
    .filter(Boolean)
}

function uniqueStrings(values: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const value of values) {
    if (!value || seen.has(value)) continue
    seen.add(value)
    out.push(value)
  }
  return out
}

function getDevOriginFromRequest(request?: RequestLike): string | undefined {
  if (!request) return undefined
  const origin = getHeaderValue(request.headers, 'origin')
  if (!origin) return undefined

  let originUrl: URL
  try {
    originUrl = new URL(origin)
  } catch {
    return undefined
  }
  if (originUrl.protocol !== 'http:' && originUrl.protocol !== 'https:') return undefined

  const requestHosts = getRequestHosts(request)
  if (!requestHosts.length) return undefined

  if (requestHosts.includes(originUrl.host)) {
    return originUrl.protocol + '//' + originUrl.host
  }

  return undefined
}

function getRequestHosts(request: RequestLike): string[] {
  const hosts: string[] = []

  const forwardedHost = getHeaderValue(request.headers, 'x-forwarded-host')
  if (forwardedHost) hosts.push(...splitHeaderList(forwardedHost))

  const host = getHeaderValue(request.headers, 'host')
  if (host) hosts.push(...splitHeaderList(host))

  if (typeof request.url === 'string') {
    try {
      hosts.push(new URL(request.url).host)
    } catch {
      // ignore
    }
  }

  return uniqueStrings(hosts.map((value) => value.trim()).filter(Boolean))
}

function getHeaderValue(headers: HeadersLike | undefined, name: string): string | undefined {
  if (!headers) return undefined
  return headers.get(name) ?? headers.get(name.toLowerCase()) ?? undefined
}

function splitHeaderList(value: string): string[] {
  return value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
}

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    try {
      const user = await authComponent.getAuthUser(ctx)
      if (!user) return null
      return { ...user, id: (user as any).userId ?? (user as any)._id }
    } catch {
      return null
    }
  },
})
`
}

function convexHttpSource() {
  return `import { httpRouter } from 'convex/server'
import { authComponent, createAuth } from './auth'

const http = httpRouter()
authComponent.registerRoutes(http, createAuth)

export default http
`
}
