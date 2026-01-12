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
  await writeTextFileIfChanged(path.join(routesDir, 'login.tsx'), loginRouteSource())
  await writeTextFileIfChanged(path.join(routesDir, 'signup.tsx'), signupRouteSource())
  await writeTextFileIfChanged(
    path.join(routesDir, 'dashboard.tsx'),
    dashboardRouteSource(),
  )

  await patchHomeRouteMaybe(path.join(routesDir, 'index.tsx'))

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

  const updated = replaceOrThrow(
    current,
    '  plugins: [',
    "  ssr: {\n    noExternal: ['@convex-dev/better-auth'],\n  },\n  plugins: [",
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

async function patchHomeRouteMaybe(indexRoutePath: string) {
  if (!(await pathExists(indexRoutePath))) return
  const current = await readTextFile(indexRoutePath)
  if (current.includes("to=\"/login\"") || current.includes("to='/login'")) return

  if (!current.includes('Convex + Tanstack Start')) return

  const updated = replaceOrThrow(
    current,
    "      <h1 className=\"text-4xl font-bold text-center\">\n        Convex + Tanstack Start\n      </h1>",
    "      <h1 className=\"text-4xl font-bold text-center\">\n        Convex + Tanstack Start\n      </h1>\n\n      <div className=\"flex gap-2 justify-center\">\n        <Link\n          to=\"/login\"\n          className=\"bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors text-center\"\n        >\n          Log In\n        </Link>\n        <Link\n          to=\"/signup\"\n          className=\"bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 px-4 py-2 rounded-md transition-colors text-center\"\n        >\n          Sign Up\n        </Link>\n        <Link\n          to=\"/dashboard\"\n          className=\"bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 px-4 py-2 rounded-md transition-colors text-center\"\n        >\n          Dashboard\n        </Link>\n      </div>",
    'Could not find the home page h1 heading to insert auth links',
  )

  await writeTextFileIfChanged(indexRoutePath, updated)
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
        title: 'TanStack Start Starter',
      },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
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
  notFoundComponent: () => <div>Route not found</div>,
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
      <body>
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
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-8">Log In</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="px-4 py-2 rounded-md border-2 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 focus:outline-none focus:border-blue-500"
              placeholder="you@example.com"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="px-4 py-2 rounded-md border-2 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 focus:outline-none focus:border-blue-500"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium px-4 py-2 rounded-md transition-colors mt-2"
          >
            {isLoading ? 'Logging in...' : 'Log In'}
          </button>

          <p className="text-sm text-center mt-4">
            Don't have an account?{' '}
            <a
              href="/signup"
              className="text-blue-600 underline hover:no-underline"
            >
              Sign up
            </a>
          </p>
        </form>
      </div>
    </main>
  )
}
`
}

function signupRouteSource() {
  return `import { createFileRoute, useRouter } from '@tanstack/react-router'
import { authClient } from '~/lib/auth-client'
import { useState, type FormEvent } from 'react'

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
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-8">Sign Up</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label htmlFor="name" className="text-sm font-medium">
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="px-4 py-2 rounded-md border-2 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 focus:outline-none focus:border-blue-500"
              placeholder="Jane Doe"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="px-4 py-2 rounded-md border-2 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 focus:outline-none focus:border-blue-500"
              placeholder="you@example.com"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="px-4 py-2 rounded-md border-2 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 focus:outline-none focus:border-blue-500"
              placeholder="••••••••"
            />
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Password must be at least 8 characters long
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium px-4 py-2 rounded-md transition-colors mt-2"
          >
            {isLoading ? 'Creating account...' : 'Sign Up'}
          </button>

          <p className="text-sm text-center mt-4">
            Already have an account?{' '}
            <a
              href="/login"
              className="text-blue-600 underline hover:no-underline"
            >
              Log in
            </a>
          </p>
        </form>
      </div>
    </main>
  )
}
`
}

function dashboardRouteSource() {
  return `import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { convexQuery } from '@convex-dev/react-query'
import { api } from '../../convex/_generated/api'
import { authClient } from '~/lib/auth-client'
import { useState } from 'react'

export const Route = createFileRoute('/dashboard')({
  beforeLoad: ({ context }) => {
    if (!context.isAuthenticated) {
      throw redirect({ to: '/login' })
    }
  },
  component: Dashboard,
})

function Dashboard() {
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const { data: user, isLoading } = useQuery(
    convexQuery(api.auth.getCurrentUser, {}),
  )

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await authClient.signOut()
      router.navigate({ to: '/' })
    } finally {
      setIsLoggingOut(false)
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </main>
    )
  }

  if (!user) {
    return null
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Dashboard</h1>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-50 px-4 py-2 rounded-md transition-colors"
          >
            {isLoggingOut ? 'Logging out...' : 'Log Out'}
          </button>
        </div>

        <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-lg mb-8">
          <h2 className="text-xl font-semibold mb-4">Welcome back!</h2>
          <div className="flex flex-col gap-2">
            <p className="text-sm">
              <span className="font-medium">Name:</span> {user.name}
            </p>
            <p className="text-sm">
              <span className="font-medium">Email:</span> {user.email}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              <span className="font-medium">User ID:</span> {user.id}
            </p>
          </div>
        </div>
      </div>
    </main>
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

export const authComponent = createClient<DataModel>(components.betterAuth)

export const createAuth = (ctx: GenericCtx<DataModel>) => {
  return betterAuth({
    baseURL: siteUrl,
    database: authComponent.adapter(ctx),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    plugins: [convex({ authConfig })],
  })
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
