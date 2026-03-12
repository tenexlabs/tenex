import { join } from 'node:path';
import { pathExists, readTextFile, writeTextFileIfChanged } from '../lib/fs';
import { replaceOrThrow } from '../lib/patch';
import type { AdminProvider } from '../lib/tenex-config';
import {
  ensureBetterAuthPlugins,
  managedFile,
  projectScaffoldPaths,
  writeAddonFiles,
} from './shared';

const CONVEX_SERVER_IMPORT_SINGLE_QUOTE_REGEX =
  /import\s*\{\s*([^}]+)\s*\}\s*from\s*'convex\/server'/;
const CONVEX_SERVER_IMPORT_DOUBLE_QUOTE_REGEX =
  /import\s*\{\s*([^}]+)\s*\}\s*from\s*"convex\/server"/;

export async function applyAdminAddon(
  projectDir: string,
  provider: AdminProvider
): Promise<void> {
  if (provider !== 'panel') {
    return;
  }

  await ensureBetterAuthPlugins({
    projectDir,
    pluginImports: ['admin'],
    pluginCalls: ['admin()'],
  });
  await ensureAdminSchema(projectDir);
  await patchRootRouteForBootstrapGate(projectDir);

  const { routesDir, srcDir } = await projectScaffoldPaths(projectDir);
  await writeAddonFiles([
    managedFile(
      join(srcDir, 'components', 'AdminBootstrapGate.tsx'),
      adminBootstrapGateSource()
    ),
    managedFile(join(routesDir, 'admin.tsx'), adminRouteSource()),
    managedFile(join(routesDir, 'setup-admin.tsx'), setupAdminRouteSource()),
    managedFile(join(projectDir, 'convex', 'admin.ts'), adminServerSource()),
  ]);
}

async function ensureAdminSchema(projectDir: string): Promise<void> {
  const schemaPath = join(projectDir, 'convex', 'schema.ts');
  const adminTables = `  tenex_admin_workspace: defineTable({
    adminSetupAt: v.number(),
    adminSetupCompleted: v.boolean(),
    adminSetupEmail: v.string(),
    adminSetupName: v.string(),
    adminUserId: v.string(),
    analyticsReady: v.boolean(),
    billingReady: v.boolean(),
    emailReady: v.boolean(),
    inviteOnly: v.boolean(),
    key: v.string(),
    launchStage: v.string(),
    maintenanceMode: v.boolean(),
    notes: v.string(),
    primaryDomain: v.string(),
    productName: v.string(),
    selfServeEnabled: v.boolean(),
    statusBanner: v.string(),
    storageReady: v.boolean(),
    supportEmail: v.string(),
    updatedAt: v.number(),
    updatedBy: v.string(),
  }),
  tenex_admin_activity: defineTable({
    action: v.string(),
    actorEmail: v.string(),
    actorName: v.string(),
    createdAt: v.number(),
    summary: v.string(),
  }),
`;

  if (!(await pathExists(schemaPath))) {
    await writeTextFileIfChanged(
      schemaPath,
      `import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
${adminTables}})
`
    );
    return;
  }

  let current = await readTextFile(schemaPath);
  if (current.includes('tenex_admin_workspace')) {
    if (!current.includes('adminSetupCompleted: v.boolean()')) {
      current = replaceOrThrow(
        current,
        '  tenex_admin_workspace: defineTable({\n',
        '  tenex_admin_workspace: defineTable({\n    adminSetupAt: v.number(),\n    adminSetupCompleted: v.boolean(),\n    adminSetupEmail: v.string(),\n    adminSetupName: v.string(),\n    adminUserId: v.string(),\n',
        'Could not add admin bootstrap fields to convex/schema.ts'
      );
      await writeTextFileIfChanged(schemaPath, current);
    }
    return;
  }

  current = ensureSchemaServerImports(current);
  current = ensureSchemaValueImport(current);

  if (current.includes('export default defineSchema({')) {
    current = replaceOrThrow(
      current,
      'export default defineSchema({\n',
      `export default defineSchema({\n${adminTables}`,
      'Could not add admin tables to convex/schema.ts'
    );
  } else {
    throw new Error(
      `convex/schema.ts exists at ${schemaPath} but Tenex could not patch it automatically`
    );
  }

  await writeTextFileIfChanged(schemaPath, current);
}

function ensureSchemaServerImports(source: string): string {
  if (
    source.includes(
      "import { defineSchema, defineTable } from 'convex/server'"
    ) ||
    source.includes('import { defineSchema, defineTable } from "convex/server"')
  ) {
    return source;
  }

  if (source.includes("from 'convex/server'")) {
    return source.replace(
      CONVEX_SERVER_IMPORT_SINGLE_QUOTE_REGEX,
      (_match, imports: string) => {
        const values = new Set(
          imports
            .split(',')
            .map((value) => value.trim())
            .filter(Boolean)
        );
        values.add('defineSchema');
        values.add('defineTable');
        return `import { ${Array.from(values).join(', ')} } from 'convex/server'`;
      }
    );
  }

  if (source.includes('from "convex/server"')) {
    return source.replace(
      CONVEX_SERVER_IMPORT_DOUBLE_QUOTE_REGEX,
      (_match, imports: string) => {
        const values = new Set(
          imports
            .split(',')
            .map((value) => value.trim())
            .filter(Boolean)
        );
        values.add('defineSchema');
        values.add('defineTable');
        return `import { ${Array.from(values).join(', ')} } from "convex/server"`;
      }
    );
  }

  return `import { defineSchema, defineTable } from 'convex/server'\n${source}`;
}

function ensureSchemaValueImport(source: string): string {
  if (
    source.includes("import { v } from 'convex/values'") ||
    source.includes('import { v } from "convex/values"')
  ) {
    return source;
  }
  return `import { v } from 'convex/values'\n${source}`;
}

async function patchRootRouteForBootstrapGate(
  projectDir: string
): Promise<void> {
  const { routesDir } = await projectScaffoldPaths(projectDir);
  const rootRoutePath = join(routesDir, '__root.tsx');
  if (!(await pathExists(rootRoutePath))) {
    throw new Error(`Missing root route at ${rootRoutePath}`);
  }

  let current = await readTextFile(rootRoutePath);
  if (current.includes('AdminBootstrapGate')) {
    return;
  }

  current = replaceOrThrow(
    current,
    "import { getToken } from '~/lib/auth-server'\n",
    "import { getToken } from '~/lib/auth-server'\nimport { AdminBootstrapGate } from '~/components/AdminBootstrapGate'\n",
    'Could not add AdminBootstrapGate import to root route'
  );
  current = replaceOrThrow(
    current,
    '        <Outlet />\n',
    '        <AdminBootstrapGate>\n          <Outlet />\n        </AdminBootstrapGate>\n',
    'Could not wrap the root outlet with AdminBootstrapGate'
  );

  await writeTextFileIfChanged(rootRoutePath, current);
}

function adminServerSource(): string {
  return `import { v } from 'convex/values'
import { components } from './_generated/api'
import { mutation, query } from './_generated/server'
import { authComponent } from './auth'

const WORKSPACE_TABLE = 'tenex_admin_workspace'
const ACTIVITY_TABLE = 'tenex_admin_activity'
const GLOBAL_CONFIG_KEY = 'global'

const defaultWorkspaceConfig = {
  analyticsReady: false,
  billingReady: false,
  emailReady: false,
  inviteOnly: false,
  launchStage: 'draft',
  maintenanceMode: false,
  notes: '',
  primaryDomain: '',
  productName: '',
  selfServeEnabled: true,
  statusBanner: '',
  storageReady: false,
  supportEmail: '',
}

const defaultBootstrapState = {
  adminSetupAt: 0,
  adminSetupCompleted: false,
  adminSetupEmail: '',
  adminSetupName: '',
  adminUserId: '',
}

export const getBootstrapStatus = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getCurrentUserRecord(ctx)
    const bootstrap = normalizeBootstrapState(await getWorkspaceDocument(ctx))

    return {
      currentUser,
      hasAdmin: bootstrap.adminSetupCompleted || hasAdminRole(currentUser?.role),
      isAuthenticated: Boolean(currentUser),
      setup: bootstrap,
    }
  },
})

export const bootstrapFirstAdmin = mutation({
  args: {},
  handler: async (ctx) => {
    const currentUser = await requireCurrentUser(ctx)
    const existing = await getWorkspaceDocument(ctx)
    const bootstrap = normalizeBootstrapState(existing)

    if (bootstrap.adminSetupCompleted) {
      throw new Error('Admin onboarding is already complete.')
    }

    await promoteUserToAdmin(ctx, currentUser.authId)
    await markBootstrapComplete(ctx, existing, currentUser)

    await recordActivity(ctx, {
      action: 'admin.bootstrap.completed',
      actorEmail: currentUser.email,
      actorName: currentUser.name,
      summary: 'Created the first admin account from the setup flow.',
    })

    return {
      adminEmail: currentUser.email,
      becameAdmin: true,
      ok: true,
    }
  },
})

export const getConsoleState = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getCurrentUserRecord(ctx)
    const allowedEmails = parseAllowedAdminEmails()
    const canClaimAdmin = Boolean(
      currentUser?.email && allowedEmails.includes(currentUser.email.toLowerCase()),
    )
    const isAdmin = hasAdminRole(currentUser?.role)

    const workspace = await readWorkspaceConfig(ctx)
    const recentActivity = (await ctx.db.query(ACTIVITY_TABLE).order('desc').take(10)).map(
      (entry) => ({
        action: getString(entry.action),
        actorEmail: getString(entry.actorEmail),
        actorName: getString(entry.actorName),
        createdAt: entry._creationTime,
        id: String(entry._id),
        summary: getString(entry.summary),
      }),
    )

    return {
      allowedAdminCount: allowedEmails.length,
      canClaimAdmin,
      currentUser,
      isAdmin,
      recentActivity,
      workspace,
    }
  },
})

export const claimAdminAccess = mutation({
  args: {},
  handler: async (ctx) => {
    const currentUser = await requireCurrentUser(ctx)
    const existing = await getWorkspaceDocument(ctx)
    if (hasAdminRole(currentUser.role)) {
      return { becameAdmin: false, role: normalizeRoleValue(currentUser.role) }
    }
    if (!canClaimAdminAccess(currentUser.email)) {
      throw new Error('This account is not listed in TENEX_ADMIN_EMAILS.')
    }

    await promoteUserToAdmin(ctx, currentUser.authId)
    await markBootstrapComplete(ctx, existing, currentUser)

    await recordActivity(ctx, {
      action: 'admin.access.claimed',
      actorEmail: currentUser.email,
      actorName: currentUser.name,
      summary: 'Claimed bootstrap admin access from TENEX_ADMIN_EMAILS.',
    })

    return {
      becameAdmin: true,
      role: 'admin',
    }
  },
})

export const saveWorkspaceConfig = mutation({
  args: {
    analyticsReady: v.boolean(),
    billingReady: v.boolean(),
    emailReady: v.boolean(),
    inviteOnly: v.boolean(),
    launchStage: v.union(
      v.literal('draft'),
      v.literal('internal'),
      v.literal('beta'),
      v.literal('public'),
    ),
    maintenanceMode: v.boolean(),
    notes: v.string(),
    primaryDomain: v.string(),
    productName: v.string(),
    selfServeEnabled: v.boolean(),
    statusBanner: v.string(),
    storageReady: v.boolean(),
    supportEmail: v.string(),
  },
  handler: async (ctx, args) => {
    const actor = await assertAdminConsoleAccess(ctx)
    const existing = await getWorkspaceDocument(ctx)
    const payload = {
      ...args,
      key: GLOBAL_CONFIG_KEY,
      updatedAt: Date.now(),
      updatedBy: actor.id,
    }

    if (existing) {
      await ctx.db.patch(existing._id, payload)
    } else {
      await ctx.db.insert(WORKSPACE_TABLE, {
        ...defaultBootstrapState,
        ...payload,
      })
    }

    await recordActivity(ctx, {
      action: 'workspace.updated',
      actorEmail: actor.email,
      actorName: actor.name,
      summary: 'Saved admin workspace configuration in Convex.',
    })

    return {
      ok: true,
      workspace: normalizeWorkspaceRecord(payload),
    }
  },
})

async function getWorkspaceDocument(ctx: any) {
  const records = await ctx.db.query(WORKSPACE_TABLE).collect()
  return records.find((entry: Record<string, unknown>) => getString(entry.key) === GLOBAL_CONFIG_KEY)
}

async function readWorkspaceConfig(ctx: any) {
  const existing = await getWorkspaceDocument(ctx)
  if (!existing) {
    return defaultWorkspaceConfig
  }
  return normalizeWorkspaceRecord(existing)
}

function normalizeWorkspaceRecord(record: Record<string, unknown>) {
  return {
    analyticsReady: getBoolean(record.analyticsReady, defaultWorkspaceConfig.analyticsReady),
    billingReady: getBoolean(record.billingReady, defaultWorkspaceConfig.billingReady),
    emailReady: getBoolean(record.emailReady, defaultWorkspaceConfig.emailReady),
    inviteOnly: getBoolean(record.inviteOnly, defaultWorkspaceConfig.inviteOnly),
    launchStage: getLaunchStage(record.launchStage),
    maintenanceMode: getBoolean(record.maintenanceMode, defaultWorkspaceConfig.maintenanceMode),
    notes: getString(record.notes),
    primaryDomain: getString(record.primaryDomain),
    productName: getString(record.productName),
    selfServeEnabled: getBoolean(record.selfServeEnabled, defaultWorkspaceConfig.selfServeEnabled),
    statusBanner: getString(record.statusBanner),
    storageReady: getBoolean(record.storageReady, defaultWorkspaceConfig.storageReady),
    supportEmail: getString(record.supportEmail),
  }
}

function normalizeBootstrapState(record: Record<string, unknown> | null | undefined) {
  if (!record) {
    return defaultBootstrapState
  }

  return {
    adminSetupAt: getNumber(record.adminSetupAt),
    adminSetupCompleted: getBoolean(
      record.adminSetupCompleted,
      defaultBootstrapState.adminSetupCompleted,
    ),
    adminSetupEmail: getString(record.adminSetupEmail),
    adminSetupName: getString(record.adminSetupName),
    adminUserId: getString(record.adminUserId),
  }
}

async function promoteUserToAdmin(ctx: any, authId: string) {
  await ctx.runMutation(
    components.betterAuth.adapter.updateOne as any,
    {
      input: {
        model: 'user',
        update: {
          role: 'admin',
        },
        where: [{ field: '_id', value: authId }],
      },
    } as any
  )
}

async function markBootstrapComplete(
  ctx: any,
  existing: Record<string, unknown> | null | undefined,
  currentUser: {
    authId: string
    email: string
    id: string
    name: string
  },
) {
  const now = Date.now()
  const payload = {
    adminSetupAt: now,
    adminSetupCompleted: true,
    adminSetupEmail: currentUser.email,
    adminSetupName: currentUser.name || currentUser.email,
    adminUserId: currentUser.id,
    key: GLOBAL_CONFIG_KEY,
    updatedAt: now,
    updatedBy: currentUser.id,
  }

  if (existing) {
    await ctx.db.patch(existing._id, payload)
    return
  }

  await ctx.db.insert(WORKSPACE_TABLE, {
    ...defaultWorkspaceConfig,
    ...payload,
  })
}

async function assertAdminConsoleAccess(ctx: any) {
  const currentUser = await requireCurrentUser(ctx)
  if (hasAdminRole(currentUser.role) || canClaimAdminAccess(currentUser.email)) {
    return currentUser
  }
  throw new Error('Admin access required.')
}

async function requireCurrentUser(ctx: any) {
  const currentUser = await getCurrentUserRecord(ctx)
  if (!currentUser) {
    throw new Error('Authentication required.')
  }
  return currentUser
}

async function getCurrentUserRecord(ctx: any) {
  try {
    const user = await authComponent.getAuthUser(ctx as never)
    if (!user) {
      return null
    }

    const idCandidate =
      getString((user as Record<string, unknown>).userId) ||
      getString((user as Record<string, unknown>)._id)

    if (!idCandidate) {
      return null
    }

    return {
      authId:
        getString((user as Record<string, unknown>)._id) ||
        getString((user as Record<string, unknown>).id),
      email: getString((user as Record<string, unknown>).email),
      id: idCandidate,
      name: getString((user as Record<string, unknown>).name),
      role: normalizeRoleValue((user as Record<string, unknown>).role),
    }
  } catch {
    return null
  }
}

function canClaimAdminAccess(email: string) {
  return Boolean(email) && parseAllowedAdminEmails().includes(email.toLowerCase())
}

function parseAllowedAdminEmails() {
  const value = process.env.TENEX_ADMIN_EMAILS ?? ''
  return value
    .split(/[\\s,]+/g)
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean)
}

function hasAdminRole(role: string | null | undefined) {
  return normalizeRoleValue(role).split(',').includes('admin')
}

function normalizeRoleValue(role: unknown) {
  if (Array.isArray(role)) {
    return role
      .map((value) => getString(value))
      .filter(Boolean)
      .join(',')
  }
  return getString(role)
}

async function recordActivity(
  ctx: any,
  entry: {
    action: string
    actorEmail: string
    actorName: string
    summary: string
  },
) {
  await ctx.db.insert(ACTIVITY_TABLE, {
    ...entry,
    createdAt: Date.now(),
  })
}

function getString(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function getBoolean(value: unknown, fallback: boolean) {
  return typeof value === 'boolean' ? value : fallback
}

function getNumber(value: unknown) {
  return typeof value === 'number' ? value : 0
}

function getLaunchStage(value: unknown) {
  return value === 'internal' || value === 'beta' || value === 'public'
    ? value
    : defaultWorkspaceConfig.launchStage
}
`;
}

function adminBootstrapGateSource(): string {
  return `import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { useLocation, useRouter } from '@tanstack/react-router'
import { useEffect, type ReactNode } from 'react'
import { api } from '../../convex/_generated/api'

export function AdminBootstrapGate({ children }: { children: ReactNode }) {
  const router = useRouter()
  const location = useLocation()
  const bootstrapQuery = useQuery(convexQuery(api.admin.getBootstrapStatus, {}))
  const isSetupRoute = location.pathname === '/setup-admin'
  const hasAdmin = bootstrapQuery.data?.hasAdmin
  const isLoading = bootstrapQuery.isLoading || typeof hasAdmin !== 'boolean'

  useEffect(() => {
    if (isLoading) {
      return
    }

    if (!hasAdmin && !isSetupRoute) {
      void router.navigate({ replace: true, to: '/setup-admin' })
      return
    }

    if (hasAdmin && isSetupRoute) {
      void router.navigate({
        replace: true,
        to: bootstrapQuery.data?.isAuthenticated ? '/dashboard' : '/',
      })
    }
  }, [bootstrapQuery.data?.isAuthenticated, hasAdmin, isLoading, isSetupRoute, router])

  if (isLoading && !isSetupRoute) {
    return <BootstrapHoldingScreen />
  }

  if (!hasAdmin && !isSetupRoute) {
    return <BootstrapHoldingScreen />
  }

  return <>{children}</>
}

function BootstrapHoldingScreen() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#050505] px-4 py-10 text-white [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px),radial-gradient(circle_at_top,rgba(220,38,38,0.22),transparent_34%)] [background-size:24px_24px,24px_24px,100%_100%]">
      <div className="w-full max-w-xl border border-red-500/25 bg-black/90 p-6 text-center shadow-[0_0_0_1px_rgba(239,68,68,0.12),0_28px_70px_rgba(0,0,0,0.45)] sm:p-8">
        <p className="text-[11px] uppercase tracking-[0.35em] text-red-300">Admin bootstrap</p>
        <h1 className="mt-4 text-2xl text-white sm:text-3xl">Preparing first-run setup</h1>
        <p className="mt-4 text-sm leading-7 text-white/60 sm:text-base">
          Tenex is checking whether this workspace already has an operator account.
        </p>
      </div>
    </main>
  )
}
`;
}

function setupAdminRouteSource(): string {
  return `import { convexQuery } from '@convex-dev/react-query'
import { useMutation } from 'convex/react'
import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { startTransition, useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { api } from '../../convex/_generated/api'
import { authClient } from '~/lib/auth-client'
import { tenexConfig } from '~/lib/tenex.generated'

export const Route = createFileRoute('/setup-admin')({
  component: SetupAdmin,
})

function SetupAdmin() {
  const router = useRouter()
  const bootstrapQuery = useQuery(convexQuery(api.admin.getBootstrapStatus, {}))
  const bootstrapFirstAdmin = useMutation(api.admin.bootstrapFirstAdmin)

  const [mode, setMode] = useState<'create' | 'login'>('create')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)

  const bootstrapState = bootstrapQuery.data
  const currentUser = bootstrapState?.currentUser ?? null

  useEffect(() => {
    if (!bootstrapState?.hasAdmin) {
      return
    }

    void router.navigate({
      replace: true,
      to: bootstrapState.isAuthenticated ? '/dashboard' : '/',
    })
  }, [bootstrapState?.hasAdmin, bootstrapState?.isAuthenticated, router])

  const waitForAuthenticatedBootstrapUser = async () => {
    for (let attempt = 0; attempt < 12; attempt += 1) {
      const result = await bootstrapQuery.refetch()
      if (result.data?.currentUser) {
        return result.data.currentUser
      }
      await delay(250)
    }

    throw new Error(
      'Your account was created, but the authenticated session is not ready in Convex yet. Wait a moment and try again.',
    )
  }

  const completeBootstrap = async (successMessage: string) => {
    const result = await bootstrapFirstAdmin({})
    setStatusMessage(successMessage)
    setErrorMessage('')
    await bootstrapQuery.refetch()
    await router.navigate({ to: '/admin' })
    return result
  }

  const handleCreateAdmin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setErrorMessage('')
    setStatusMessage('')

    try {
      const result = await authClient.signUp.email({
        email,
        name,
        password,
      })

      if (result.error) {
        throw new Error(result.error.message || 'Failed to create the admin account.')
      }

      await waitForAuthenticatedBootstrapUser()
      await completeBootstrap('Created the first admin account and promoted it to admin.')
    } catch (error: unknown) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setErrorMessage('')
    setStatusMessage('')

    try {
      const result = await authClient.signIn.email({
        email: loginEmail,
        password: loginPassword,
      })

      if (result.error) {
        throw new Error(result.error.message || 'Failed to sign in.')
      }

      await waitForAuthenticatedBootstrapUser()
      await completeBootstrap('Signed in and promoted the first operator account to admin.')
    } catch (error: unknown) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUseCurrentAccount = async () => {
    setIsSubmitting(true)
    setErrorMessage('')
    setStatusMessage('')

    try {
      await completeBootstrap('Promoted the signed-in account to admin.')
    } catch (error: unknown) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSignOut = async () => {
    setIsSigningOut(true)
    setErrorMessage('')

    try {
      await authClient.signOut()
      await bootstrapQuery.refetch()
      startTransition(() => {
        setLoginEmail('')
        setLoginPassword('')
        setPassword('')
      })
    } catch (error: unknown) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setIsSigningOut(false)
    }
  }

  if (bootstrapQuery.isLoading && !bootstrapState) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050505] px-4 py-10 text-white [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px),radial-gradient(circle_at_top,rgba(220,38,38,0.22),transparent_34%)] [background-size:24px_24px,24px_24px,100%_100%]">
        <div className="w-full max-w-xl border border-red-500/25 bg-black/90 p-6 text-center shadow-[0_0_0_1px_rgba(239,68,68,0.12),0_28px_70px_rgba(0,0,0,0.45)] sm:p-8">
          <p className="text-[11px] uppercase tracking-[0.35em] text-red-300">Admin bootstrap</p>
          <h1 className="mt-4 text-2xl text-white sm:text-3xl">Loading setup state</h1>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#050505] px-4 py-6 text-white [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px),radial-gradient(circle_at_top,rgba(220,38,38,0.24),transparent_28%)] [background-size:24px_24px,24px_24px,100%_100%] sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto min-h-[calc(100vh-3rem)] w-full max-w-7xl">
        <section className="overflow-hidden border border-red-500/25 bg-black/90 shadow-[0_0_0_1px_rgba(239,68,68,0.12),0_28px_80px_rgba(0,0,0,0.45)]">
          <div className="grid gap-6 border-b border-red-500/20 px-5 py-6 sm:px-8 sm:py-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(250px,0.9fr)] lg:items-end">
            <div>
              <p className="text-[11px] uppercase tracking-[0.35em] text-red-300">First operator setup</p>
              <h1 className="mt-4 max-w-3xl text-3xl leading-tight text-white sm:text-4xl lg:text-5xl">
                Create the first admin account for {tenexConfig.brand.name}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/65 sm:text-base">
                This workspace is still unclaimed. The first account completed here becomes the admin user that can configure the rest of the product.
              </p>
            </div>

            <div className="border border-white/10 bg-white/[0.03]">
              <div className="border-b border-white/10 px-4 py-3 text-[11px] uppercase tracking-[0.3em] text-white/45">
                Bootstrap rules
              </div>
              <div className="grid gap-px bg-white/10 sm:grid-cols-3 lg:grid-cols-1">
                <div className="bg-black px-4 py-4">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-white/45">Step 1</p>
                  <p className="mt-2 text-sm text-white">Create or sign in</p>
                </div>
                <div className="bg-black px-4 py-4">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-white/45">Step 2</p>
                  <p className="mt-2 text-sm text-white">Promote first operator</p>
                </div>
                <div className="bg-black px-4 py-4">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-white/45">Step 3</p>
                  <p className="mt-2 text-sm text-white">Unlock admin console</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 px-5 py-6 sm:px-8 sm:py-8 2xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
            <section className="grid gap-6">
              {currentUser ? (
                <div className="border border-red-500/25 bg-red-500/10 p-5 sm:p-6">
                  <p className="text-[11px] uppercase tracking-[0.32em] text-red-200">Signed in account</p>
                  <h2 className="mt-3 text-2xl text-white sm:text-3xl">{currentUser.name || currentUser.email}</h2>
                  <p className="mt-3 text-sm leading-7 text-white/65">
                    This account is authenticated but the workspace does not have an admin yet. Promoting this user will finish bootstrap immediately.
                  </p>
                  <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={handleUseCurrentAccount}
                      disabled={isSubmitting}
                      className="border border-red-500/45 bg-red-500 px-5 py-3 text-sm uppercase tracking-[0.24em] text-black transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSubmitting ? 'Promoting' : 'Use this account as admin'}
                    </button>
                    <button
                      type="button"
                      onClick={handleSignOut}
                      disabled={isSigningOut}
                      className="border border-white/15 bg-white/[0.05] px-5 py-3 text-sm uppercase tracking-[0.24em] text-white transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSigningOut ? 'Signing out' : 'Use another account'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.8fr)]">
                  <article className="border border-white/10 bg-white/[0.03]">
                    <div className="border-b border-white/10 px-5 py-4 sm:px-6">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setMode('create')}
                          className={
                            mode === 'create'
                              ? 'border border-red-500/35 bg-red-500/12 px-3 py-2 text-[11px] uppercase tracking-[0.28em] text-red-100'
                              : 'border border-white/10 bg-white/[0.03] px-3 py-2 text-[11px] uppercase tracking-[0.28em] text-white/55'
                          }
                        >
                          Create admin
                        </button>
                        <button
                          type="button"
                          onClick={() => setMode('login')}
                          className={
                            mode === 'login'
                              ? 'border border-red-500/35 bg-red-500/12 px-3 py-2 text-[11px] uppercase tracking-[0.28em] text-red-100'
                              : 'border border-white/10 bg-white/[0.03] px-3 py-2 text-[11px] uppercase tracking-[0.28em] text-white/55'
                          }
                        >
                          Sign in existing
                        </button>
                      </div>
                    </div>

                    {mode === 'create' ? (
                      <form onSubmit={handleCreateAdmin} className="grid gap-4 px-5 py-5 sm:px-6">
                        <Field label="Full name" htmlFor="bootstrap-name">
                          <input
                            id="bootstrap-name"
                            type="text"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            className="w-full border border-white/10 bg-black px-3 py-3 text-sm text-white outline-none transition focus:border-red-500"
                            placeholder="Avery Founder"
                            required
                          />
                        </Field>
                        <Field label="Email" htmlFor="bootstrap-email">
                          <input
                            id="bootstrap-email"
                            type="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            className="w-full border border-white/10 bg-black px-3 py-3 text-sm text-white outline-none transition focus:border-red-500"
                            placeholder="founder@example.com"
                            required
                          />
                        </Field>
                        <Field label="Password" htmlFor="bootstrap-password">
                          <input
                            id="bootstrap-password"
                            type="password"
                            minLength={8}
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            className="w-full border border-white/10 bg-black px-3 py-3 text-sm text-white outline-none transition focus:border-red-500"
                            placeholder="At least 8 characters"
                            required
                          />
                        </Field>
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="border border-red-500/45 bg-red-500 px-4 py-3 text-sm uppercase tracking-[0.22em] text-black transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isSubmitting ? 'Creating admin' : 'Create first admin account'}
                        </button>
                      </form>
                    ) : (
                      <form onSubmit={handleLogin} className="grid gap-4 px-5 py-5 sm:px-6">
                        <Field label="Email" htmlFor="bootstrap-login-email">
                          <input
                            id="bootstrap-login-email"
                            type="email"
                            value={loginEmail}
                            onChange={(event) => setLoginEmail(event.target.value)}
                            className="w-full border border-white/10 bg-black px-3 py-3 text-sm text-white outline-none transition focus:border-red-500"
                            placeholder="founder@example.com"
                            required
                          />
                        </Field>
                        <Field label="Password" htmlFor="bootstrap-login-password">
                          <input
                            id="bootstrap-login-password"
                            type="password"
                            value={loginPassword}
                            onChange={(event) => setLoginPassword(event.target.value)}
                            className="w-full border border-white/10 bg-black px-3 py-3 text-sm text-white outline-none transition focus:border-red-500"
                            placeholder="Your existing password"
                            required
                          />
                        </Field>
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="border border-red-500/45 bg-red-500 px-4 py-3 text-sm uppercase tracking-[0.22em] text-black transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isSubmitting ? 'Signing in' : 'Sign in and claim admin'}
                        </button>
                      </form>
                    )}
                  </article>

                  <article className="border border-white/10 bg-white/[0.03] p-5 sm:p-6">
                    <p className="text-[11px] uppercase tracking-[0.35em] text-red-300">Why this exists</p>
                    <div className="mt-4 space-y-4 text-sm leading-7 text-white/65">
                      <p>The first operator defines who can manage users, environment setup, and Convex-backed launch state.</p>
                      <p>Once bootstrap is complete, the setup flow disappears and the normal app surfaces unlock automatically.</p>
                      <p>
                        If you reached this screen unexpectedly, the workspace was generated with the admin panel enabled but no admin account has been claimed yet.
                      </p>
                    </div>
                    <div className="mt-6 border border-white/10 bg-black/60 p-4 text-sm leading-7 text-white/60">
                      Need the public marketing surface later? It comes back after bootstrap. Until then, setup takes priority.
                    </div>
                  </article>
                </div>
              )}

              {errorMessage ? (
                <div className="border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">{errorMessage}</div>
              ) : null}
              {statusMessage ? (
                <div className="border border-white/15 bg-white/[0.05] px-4 py-3 text-sm text-white/85">{statusMessage}</div>
              ) : null}
            </section>

            <aside className="grid gap-6">
              <article className="border border-white/10 bg-white/[0.03]">
                <div className="border-b border-white/10 px-5 py-4 sm:px-6">
                  <p className="text-[11px] uppercase tracking-[0.35em] text-red-300">Current status</p>
                </div>
                <div className="grid gap-px bg-white/10">
                  <InfoCell label="Workspace" value={bootstrapState?.hasAdmin ? 'Claimed' : 'Awaiting first admin'} />
                  <InfoCell label="Signed in" value={currentUser?.email || 'No active session'} />
                  <InfoCell label="Template" value={tenexConfig.template} />
                </div>
              </article>

              <article className="border border-white/10 bg-white/[0.03] p-5 sm:p-6">
                <p className="text-[11px] uppercase tracking-[0.35em] text-red-300">Operator note</p>
                <p className="mt-4 text-sm leading-7 text-white/65">
                  After setup, use the admin panel to manage users, inspect sessions, and record launch readiness directly in Convex.
                </p>
                <div className="mt-5">
                  <Link
                    to="/"
                    className="inline-flex border border-white/15 bg-white/[0.05] px-4 py-3 text-sm uppercase tracking-[0.22em] text-white transition hover:bg-white/[0.08]"
                  >
                    View root route
                  </Link>
                </div>
              </article>
            </aside>
          </div>
        </section>
      </div>
    </main>
  )
}

function Field({
  children,
  htmlFor,
  label,
}: {
  children: ReactNode
  htmlFor: string
  label: string
}) {
  return (
    <div className="grid gap-2">
      <label htmlFor={htmlFor} className="text-[11px] uppercase tracking-[0.28em] text-white/55">
        {label}
      </label>
      {children}
    </div>
  )
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-black px-5 py-4 sm:px-6">
      <p className="text-[10px] uppercase tracking-[0.24em] text-white/45">{label}</p>
      <p className="mt-2 text-sm text-white">{value}</p>
    </div>
  )
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message
  }
  return 'Admin bootstrap failed.'
}

function delay(milliseconds: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds)
  })
}
`;
}

function adminRouteSource(): string {
  return `import { convexQuery } from '@convex-dev/react-query'
import { useMutation } from 'convex/react'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { startTransition, useDeferredValue, useEffect, useState } from 'react'
import type { ChangeEvent, FormEvent, ReactNode } from 'react'
import { api } from '../../convex/_generated/api'
import { AppShell } from '~/components/AppShell'
import { authClient } from '~/lib/auth-client'
import { tenexConfig } from '~/lib/tenex.generated'

export const Route = createFileRoute('/admin')({
  beforeLoad: ({ context }) => {
    if (!context.isAuthenticated) {
      throw redirect({ to: '/login' })
    }
  },
  component: Admin,
})

function Admin() {
  const [search, setSearch] = useState('')
  const [users, setUsers] = useState<AdminUser[]>([])
  const [sessions, setSessions] = useState<AdminSession[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [draftRole, setDraftRole] = useState('user')
  const [banReason, setBanReason] = useState('')
  const [createUserName, setCreateUserName] = useState('')
  const [createUserEmail, setCreateUserEmail] = useState('')
  const [createUserPassword, setCreateUserPassword] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [workspaceForm, setWorkspaceForm] = useState(defaultWorkspaceForm)
  const [totalUsers, setTotalUsers] = useState<number | null>(null)
  const [adminUserCount, setAdminUserCount] = useState<number | null>(null)
  const [bannedUserCount, setBannedUserCount] = useState<number | null>(null)
  const [isClaimingAdmin, setIsClaimingAdmin] = useState(false)
  const [isSavingWorkspace, setIsSavingWorkspace] = useState(false)
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [isLoadingSessions, setIsLoadingSessions] = useState(false)
  const [isCreatingUser, setIsCreatingUser] = useState(false)
  const [isApplyingRole, setIsApplyingRole] = useState(false)
  const [isUpdatingBan, setIsUpdatingBan] = useState(false)
  const [isRevokingSessions, setIsRevokingSessions] = useState(false)
  const [isImpersonating, setIsImpersonating] = useState(false)

  const deferredSearch = useDeferredValue(search)
  const consoleQuery = useQuery(convexQuery(api.admin.getConsoleState, {}))
  const claimAdminAccess = useMutation(api.admin.claimAdminAccess)
  const saveWorkspaceConfig = useMutation(api.admin.saveWorkspaceConfig)

  const consoleState = consoleQuery.data
  const isAdmin = Boolean(consoleState?.isAdmin)
  const selectedUser = users.find((user) => user.id === selectedUserId) ?? users[0] ?? null

  useEffect(() => {
    if (!consoleState?.workspace) {
      return
    }
    setWorkspaceForm(normalizeWorkspaceForm(consoleState.workspace))
  }, [consoleState?.workspace])

  useEffect(() => {
    if (!selectedUser) {
      setSelectedUserId(null)
      return
    }
    if (!selectedUserId || !users.some((user) => user.id === selectedUserId)) {
      startTransition(() => {
        setSelectedUserId(selectedUser.id)
      })
    }
  }, [selectedUser, selectedUserId, users])

  useEffect(() => {
    if (!selectedUser) {
      return
    }
    setDraftRole(selectedUser.role || 'user')
    setBanReason(selectedUser.banReason || '')
  }, [selectedUser?.banReason, selectedUser?.id, selectedUser?.role])

  useEffect(() => {
    if (consoleState?.isAdmin || !consoleState?.canClaimAdmin || isClaimingAdmin) {
      return
    }

    setIsClaimingAdmin(true)
    void claimAdminAccess({})
      .then(() => {
        setStatusMessage('Claimed bootstrap admin access from TENEX_ADMIN_EMAILS.')
        return consoleQuery.refetch()
      })
      .catch((error: unknown) => {
        setStatusMessage(getErrorMessage(error))
      })
      .finally(() => {
        setIsClaimingAdmin(false)
      })
  }, [claimAdminAccess, consoleQuery, consoleState?.canClaimAdmin, consoleState?.isAdmin, isClaimingAdmin])

  useEffect(() => {
    if (!isAdmin) {
      setUsers([])
      setSessions([])
      setTotalUsers(null)
      setAdminUserCount(null)
      setBannedUserCount(null)
      return
    }

    let cancelled = false
    const fetchUsers = async () => {
      setIsLoadingUsers(true)
      try {
        const [listResult, adminResult, bannedResult] = await Promise.all([
          authClient.admin.listUsers({
            query: {
              limit: 24,
              searchField: deferredSearch ? 'email' : undefined,
              searchValue: deferredSearch || undefined,
              sortBy: 'createdAt',
              sortDirection: 'desc',
            },
          }),
          authClient.admin.listUsers({
            query: {
              filterField: 'role',
              filterOperator: 'contains',
              filterValue: 'admin',
              limit: 1,
            },
          }),
          authClient.admin.listUsers({
            query: {
              filterField: 'banned',
              filterOperator: 'eq',
              filterValue: true,
              limit: 1,
            },
          }),
        ])

        if (cancelled) {
          return
        }
        if (listResult.error) {
          throw new Error(listResult.error.message || 'Failed to load admin users.')
        }

        setUsers(normalizeAdminUsers(listResult.data?.users ?? []))
        setTotalUsers(listResult.data?.total ?? 0)
        setAdminUserCount(adminResult.data?.total ?? 0)
        setBannedUserCount(bannedResult.data?.total ?? 0)
      } catch (error: unknown) {
        if (!cancelled) {
          setStatusMessage(getErrorMessage(error))
        }
      } finally {
        if (!cancelled) {
          setIsLoadingUsers(false)
        }
      }
    }

    void fetchUsers()
    return () => {
      cancelled = true
    }
  }, [deferredSearch, isAdmin])

  useEffect(() => {
    if (!isAdmin || !selectedUser?.id) {
      setSessions([])
      return
    }

    let cancelled = false
    const fetchSessions = async () => {
      setIsLoadingSessions(true)
      try {
        const result = await authClient.admin.listUserSessions({
          userId: selectedUser.id,
        })
        if (cancelled) {
          return
        }
        if (result.error) {
          throw new Error(result.error.message || 'Failed to load user sessions.')
        }
        setSessions(normalizeAdminSessions(result.data?.sessions ?? []))
      } catch (error: unknown) {
        if (!cancelled) {
          setStatusMessage(getErrorMessage(error))
        }
      } finally {
        if (!cancelled) {
          setIsLoadingSessions(false)
        }
      }
    }

    void fetchSessions()
    return () => {
      cancelled = true
    }
  }, [isAdmin, selectedUser?.id])

  const refreshUsers = async () => {
    await consoleQuery.refetch()
    if (!isAdmin) {
      return
    }
    const result = await authClient.admin.listUsers({
      query: {
        limit: 24,
        searchField: deferredSearch ? 'email' : undefined,
        searchValue: deferredSearch || undefined,
        sortBy: 'createdAt',
        sortDirection: 'desc',
      },
    })
    if (result.error) {
      throw new Error(result.error.message || 'Failed to refresh users.')
    }
    setUsers(normalizeAdminUsers(result.data?.users ?? []))
    setTotalUsers(result.data?.total ?? 0)
  }

  const handleWorkspaceToggle =
    (field: WorkspaceToggleKey) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      setWorkspaceForm((current) => ({
        ...current,
        [field]: event.target.checked,
      }))
    }

  const handleWorkspaceInput =
    (field: WorkspaceTextKey) =>
    (
      event:
        | ChangeEvent<HTMLInputElement>
        | ChangeEvent<HTMLSelectElement>
        | ChangeEvent<HTMLTextAreaElement>,
    ) => {
      const value = event.target.value
      setWorkspaceForm((current) => ({
        ...current,
        [field]: value,
      }))
    }

  const handleSaveWorkspace = async () => {
    setIsSavingWorkspace(true)
    setStatusMessage('')
    try {
      await saveWorkspaceConfig(workspaceForm)
      await consoleQuery.refetch()
      setStatusMessage('Saved workspace configuration to Convex.')
    } catch (error: unknown) {
      setStatusMessage(getErrorMessage(error))
    } finally {
      setIsSavingWorkspace(false)
    }
  }

  const handleCreateUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsCreatingUser(true)
    setStatusMessage('')

    try {
      const result = await authClient.admin.createUser({
        email: createUserEmail,
        name: createUserName,
        password: createUserPassword,
        role: normalizeRoleInput(draftRole),
      })

      if (result.error) {
        throw new Error(result.error.message || 'Failed to create user.')
      }

      startTransition(() => {
        setCreateUserName('')
        setCreateUserEmail('')
        setCreateUserPassword('')
      })
      await refreshUsers()
      setStatusMessage('Created a new user account.')
    } catch (error: unknown) {
      setStatusMessage(getErrorMessage(error))
    } finally {
      setIsCreatingUser(false)
    }
  }

  const handleRoleUpdate = async () => {
    if (!selectedUser) {
      return
    }
    setIsApplyingRole(true)
    setStatusMessage('')
    try {
      const result = await authClient.admin.setRole({
        role: normalizeRoleInput(draftRole),
        userId: selectedUser.id,
      })
      if (result.error) {
        throw new Error(result.error.message || 'Failed to update user role.')
      }
      await refreshUsers()
      setStatusMessage('Updated user role.')
    } catch (error: unknown) {
      setStatusMessage(getErrorMessage(error))
    } finally {
      setIsApplyingRole(false)
    }
  }

  const handleBanUpdate = async () => {
    if (!selectedUser) {
      return
    }
    setIsUpdatingBan(true)
    setStatusMessage('')
    try {
      const result = selectedUser.banned
        ? await authClient.admin.unbanUser({ userId: selectedUser.id })
        : await authClient.admin.banUser({
            banReason: banReason || undefined,
            userId: selectedUser.id,
          })
      if (result.error) {
        throw new Error(result.error.message || 'Failed to update ban state.')
      }
      await refreshUsers()
      setStatusMessage(selectedUser.banned ? 'Removed user ban.' : 'Applied user ban.')
    } catch (error: unknown) {
      setStatusMessage(getErrorMessage(error))
    } finally {
      setIsUpdatingBan(false)
    }
  }

  const handleRevokeAllSessions = async () => {
    if (!selectedUser) {
      return
    }
    setIsRevokingSessions(true)
    setStatusMessage('')
    try {
      const result = await authClient.admin.revokeUserSessions({ userId: selectedUser.id })
      if (result.error) {
        throw new Error(result.error.message || 'Failed to revoke user sessions.')
      }
      setSessions([])
      setStatusMessage('Revoked all sessions for the selected user.')
    } catch (error: unknown) {
      setStatusMessage(getErrorMessage(error))
    } finally {
      setIsRevokingSessions(false)
    }
  }

  const handleRevokeSession = async (sessionToken: string) => {
    setStatusMessage('')
    try {
      const result = await authClient.admin.revokeUserSession({ sessionToken })
      if (result.error) {
        throw new Error(result.error.message || 'Failed to revoke session.')
      }
      setSessions((current) => current.filter((session) => session.token !== sessionToken))
      setStatusMessage('Revoked session.')
    } catch (error: unknown) {
      setStatusMessage(getErrorMessage(error))
    }
  }

  const handleImpersonate = async () => {
    if (!selectedUser) {
      return
    }
    setIsImpersonating(true)
    setStatusMessage('')
    try {
      const result = await authClient.admin.impersonateUser({ userId: selectedUser.id })
      if (result.error) {
        throw new Error(result.error.message || 'Failed to impersonate user.')
      }
      window.location.href = '/dashboard'
    } catch (error: unknown) {
      setStatusMessage(getErrorMessage(error))
    } finally {
      setIsImpersonating(false)
    }
  }

  const accessLabel = consoleState?.isAdmin
    ? 'Admin session'
    : consoleState?.canClaimAdmin
      ? 'Bootstrap eligible'
      : 'Awaiting admin'

  return (
    <AppShell
      title="Admin operations"
      description="Manage users through Better Auth admin endpoints while keeping setup, notes, and monitoring state in Convex."
    >
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.9fr)]">
        <article className="overflow-hidden border border-red-500/25 bg-black/90 shadow-[0_0_0_1px_rgba(239,68,68,0.12),0_28px_70px_rgba(0,0,0,0.45)]">
          <div className="border-b border-red-500/20 px-4 py-3 sm:px-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.35em] text-red-300">Console status</p>
                <h2 className="mt-2 text-xl text-white sm:text-2xl">{tenexConfig.brand.name} admin panel</h2>
              </div>
              <span className="inline-flex w-fit border border-white/15 bg-white/5 px-3 py-2 text-[11px] uppercase tracking-[0.3em] text-white/70">
                {accessLabel}
              </span>
            </div>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/65">
              User and session actions run through Better Auth admin endpoints. Workspace setup, bootstrap rules, and the operator log stay in Convex.
            </p>
          </div>

          <div className="grid gap-px bg-white/10 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard detail="Total Better Auth accounts." label="Users" value={formatCount(totalUsers)} />
            <MetricCard detail="Accounts carrying the admin role." label="Admins" value={formatCount(adminUserCount)} />
            <MetricCard detail="Currently banned accounts." label="Banned" value={formatCount(bannedUserCount)} />
            <MetricCard detail="Sessions for the selected user." label="Sessions" value={formatCount(sessions.length)} />
          </div>
        </article>

        <article className="border border-white/10 bg-white/[0.03] p-4 sm:p-6">
          <p className="text-[11px] uppercase tracking-[0.35em] text-red-300">Convex bootstrap</p>
          <div className="mt-4 space-y-4 text-sm leading-6 text-white/70">
            <div className="border border-white/10 bg-black/50 p-4">
              <p className="text-white/90">
                Signed in as <span className="text-white">{consoleState?.currentUser?.email || 'Unknown user'}</span>
              </p>
              <p className="mt-2 text-white/55">Role: {consoleState?.currentUser?.role || 'user'}</p>
            </div>
            <div className="border border-white/10 bg-black/50 p-4">
              <p>Allowed bootstrap admins from env: {formatCount(consoleState?.allowedAdminCount)}</p>
              <p className="mt-2 text-white/55">
                TENEX_ADMIN_EMAILS lets the first operator self-promote without touching the generated code.
              </p>
            </div>
            {statusMessage ? (
              <div className="border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-100">{statusMessage}</div>
            ) : null}
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="border border-white/10 bg-white/[0.03] xl:sticky xl:top-28">
          <div className="border-b border-white/10 px-4 py-4 sm:px-6">
            <p className="text-[11px] uppercase tracking-[0.35em] text-red-300">Directory</p>
            <div className="mt-4">
              <label htmlFor="admin-user-search" className="sr-only">Search users</label>
              <input
                id="admin-user-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search email"
                className="w-full border border-white/10 bg-black px-3 py-3 text-sm text-white outline-none transition focus:border-red-500"
              />
            </div>
          </div>

          <div className="max-h-[32rem] overflow-y-auto">
            {isLoadingUsers ? (
              <div className="px-4 py-6 text-sm text-white/55 sm:px-6">Loading users...</div>
            ) : null}
            {users.map((user) => {
              const isActive = user.id === selectedUser?.id
              return (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => setSelectedUserId(user.id)}
                  className={
                    isActive
                      ? 'flex w-full flex-col gap-2 border-b border-red-500/20 bg-red-500/10 px-4 py-4 text-left sm:px-6'
                      : 'flex w-full flex-col gap-2 border-b border-white/10 px-4 py-4 text-left transition hover:bg-white/[0.04] sm:px-6'
                  }
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-white">{user.name}</span>
                    <RoleBadge role={user.role} />
                    {user.banned ? <StatusBadge label="Banned" tone="danger" /> : null}
                  </div>
                  <p className="text-xs uppercase tracking-[0.2em] text-white/45">{user.email}</p>
                </button>
              )
            })}
            {!isLoadingUsers && users.length === 0 ? (
              <div className="px-4 py-6 text-sm text-white/55 sm:px-6">No users matched the current search.</div>
            ) : null}
          </div>
        </aside>

        <div className="grid gap-6">
          <section className="grid gap-6 2xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
            <article className="border border-white/10 bg-white/[0.03]">
              <div className="border-b border-white/10 px-4 py-4 sm:px-6">
                <p className="text-[11px] uppercase tracking-[0.35em] text-red-300">Selected user</p>
                <h2 className="mt-2 text-xl text-white">{selectedUser?.name || 'Select a user'}</h2>
              </div>

              {selectedUser ? (
                <div className="grid gap-6 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_280px]">
                  <div className="space-y-5">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <InfoTile label="Email" value={selectedUser.email} />
                      <InfoTile label="Role" value={selectedUser.role || 'user'} />
                      <InfoTile label="Verified" value={selectedUser.emailVerified ? 'Yes' : 'No'} />
                      <InfoTile label="Created" value={formatDateTime(selectedUser.createdAt)} />
                    </div>

                    <div className="grid gap-4 lg:grid-cols-2">
                      <div className="border border-white/10 bg-black/50 p-4">
                        <label htmlFor="selected-user-role" className="text-[11px] uppercase tracking-[0.28em] text-white/55">
                          Set role
                        </label>
                        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                          <input
                            id="selected-user-role"
                            type="text"
                            value={draftRole}
                            onChange={(event) => setDraftRole(event.target.value)}
                            className="min-w-0 flex-1 border border-white/10 bg-black px-3 py-3 text-sm text-white outline-none transition focus:border-red-500"
                            placeholder="user or admin"
                          />
                          <button
                            type="button"
                            onClick={handleRoleUpdate}
                            disabled={isApplyingRole}
                            className="border border-red-500/40 bg-red-500/15 px-4 py-3 text-sm uppercase tracking-[0.22em] text-red-50 transition hover:bg-red-500/25 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isApplyingRole ? 'Saving' : 'Apply'}
                          </button>
                        </div>
                      </div>

                      <div className="border border-white/10 bg-black/50 p-4">
                        <label htmlFor="ban-reason" className="text-[11px] uppercase tracking-[0.28em] text-white/55">
                          Ban controls
                        </label>
                        <textarea
                          id="ban-reason"
                          value={banReason}
                          onChange={(event) => setBanReason(event.target.value)}
                          rows={3}
                          className="mt-3 w-full border border-white/10 bg-black px-3 py-3 text-sm text-white outline-none transition focus:border-red-500"
                          placeholder="Reason shown internally for this action"
                        />
                        <button
                          type="button"
                          onClick={handleBanUpdate}
                          disabled={isUpdatingBan}
                          className="mt-3 w-full border border-white/15 bg-white/[0.05] px-4 py-3 text-sm uppercase tracking-[0.22em] text-white transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isUpdatingBan ? 'Updating' : selectedUser.banned ? 'Remove ban' : 'Ban user'}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="border border-white/10 bg-black/50 p-4">
                    <p className="text-[11px] uppercase tracking-[0.28em] text-white/55">Session hygiene</p>
                    <p className="mt-3 text-sm leading-6 text-white/60">
                      Inspect live sessions, revoke every device, or impersonate the account for support work.
                    </p>
                    <div className="mt-4 grid gap-3">
                      <button
                        type="button"
                        onClick={handleRevokeAllSessions}
                        disabled={isRevokingSessions}
                        className="w-full border border-red-500/40 bg-red-500/15 px-4 py-3 text-sm uppercase tracking-[0.22em] text-red-50 transition hover:bg-red-500/25 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isRevokingSessions ? 'Revoking' : 'Revoke all sessions'}
                      </button>
                      <button
                        type="button"
                        onClick={handleImpersonate}
                        disabled={isImpersonating}
                        className="w-full border border-white/15 bg-white/[0.05] px-4 py-3 text-sm uppercase tracking-[0.22em] text-white transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isImpersonating ? 'Switching' : 'Impersonate'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="px-4 py-8 text-sm text-white/55 sm:px-6">Select a user to manage roles, bans, and sessions.</div>
              )}
            </article>

            <article className="border border-white/10 bg-white/[0.03]">
              <div className="border-b border-white/10 px-4 py-4 sm:px-6">
                <p className="text-[11px] uppercase tracking-[0.35em] text-red-300">Create account</p>
                <h2 className="mt-2 text-xl text-white">Provision a user from the panel</h2>
              </div>

              <form onSubmit={handleCreateUser} className="grid gap-4 px-4 py-5 sm:px-6">
                <Field label="Name" htmlFor="create-user-name">
                  <input
                    id="create-user-name"
                    type="text"
                    value={createUserName}
                    onChange={(event) => setCreateUserName(event.target.value)}
                    className="w-full border border-white/10 bg-black px-3 py-3 text-sm text-white outline-none transition focus:border-red-500"
                    placeholder="Avery Founder"
                    required
                  />
                </Field>
                <Field label="Email" htmlFor="create-user-email">
                  <input
                    id="create-user-email"
                    type="email"
                    value={createUserEmail}
                    onChange={(event) => setCreateUserEmail(event.target.value)}
                    className="w-full border border-white/10 bg-black px-3 py-3 text-sm text-white outline-none transition focus:border-red-500"
                    placeholder="avery@example.com"
                    required
                  />
                </Field>
                <Field label="Password" htmlFor="create-user-password">
                  <input
                    id="create-user-password"
                    type="password"
                    minLength={8}
                    value={createUserPassword}
                    onChange={(event) => setCreateUserPassword(event.target.value)}
                    className="w-full border border-white/10 bg-black px-3 py-3 text-sm text-white outline-none transition focus:border-red-500"
                    placeholder="At least 8 characters"
                    required
                  />
                </Field>
                <p className="text-xs leading-5 text-white/45">
                  Uses the Better Auth admin client that ships with the scaffolded auth stack.
                </p>
                <button
                  type="submit"
                  disabled={isCreatingUser}
                  className="border border-red-500/40 bg-red-500 px-4 py-3 text-sm uppercase tracking-[0.22em] text-black transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isCreatingUser ? 'Creating' : 'Create user'}
                </button>
              </form>
            </article>
          </section>

          <section className="grid gap-6 2xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
            <article className="border border-white/10 bg-white/[0.03]">
              <div className="border-b border-white/10 px-4 py-4 sm:px-6">
                <p className="text-[11px] uppercase tracking-[0.35em] text-red-300">Convex workspace setup</p>
                <h2 className="mt-2 text-xl text-white">Persist operational setup in Convex</h2>
              </div>

              <div className="grid gap-6 px-4 py-5 sm:px-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Product name" htmlFor="workspace-product-name">
                    <input
                      id="workspace-product-name"
                      type="text"
                      value={workspaceForm.productName}
                      onChange={handleWorkspaceInput('productName')}
                      className="w-full border border-white/10 bg-black px-3 py-3 text-sm text-white outline-none transition focus:border-red-500"
                      placeholder={tenexConfig.brand.name}
                    />
                  </Field>
                  <Field label="Support email" htmlFor="workspace-support-email">
                    <input
                      id="workspace-support-email"
                      type="email"
                      value={workspaceForm.supportEmail}
                      onChange={handleWorkspaceInput('supportEmail')}
                      className="w-full border border-white/10 bg-black px-3 py-3 text-sm text-white outline-none transition focus:border-red-500"
                      placeholder="support@example.com"
                    />
                  </Field>
                  <Field label="Primary domain" htmlFor="workspace-primary-domain">
                    <input
                      id="workspace-primary-domain"
                      type="text"
                      value={workspaceForm.primaryDomain}
                      onChange={handleWorkspaceInput('primaryDomain')}
                      className="w-full border border-white/10 bg-black px-3 py-3 text-sm text-white outline-none transition focus:border-red-500"
                      placeholder="app.example.com"
                    />
                  </Field>
                  <Field label="Launch stage" htmlFor="workspace-launch-stage">
                    <select
                      id="workspace-launch-stage"
                      value={workspaceForm.launchStage}
                      onChange={handleWorkspaceInput('launchStage')}
                      className="w-full border border-white/10 bg-black px-3 py-3 text-sm text-white outline-none transition focus:border-red-500"
                    >
                      <option value="draft">Draft</option>
                      <option value="internal">Internal</option>
                      <option value="beta">Beta</option>
                      <option value="public">Public</option>
                    </select>
                  </Field>
                </div>

                <Field label="Status banner" htmlFor="workspace-status-banner">
                  <input
                    id="workspace-status-banner"
                    type="text"
                    value={workspaceForm.statusBanner}
                    onChange={handleWorkspaceInput('statusBanner')}
                    className="w-full border border-white/10 bg-black px-3 py-3 text-sm text-white outline-none transition focus:border-red-500"
                    placeholder="Private beta rolling out to invited teams."
                  />
                </Field>

                <div className="grid gap-3 md:grid-cols-2">
                  <ToggleRow checked={workspaceForm.selfServeEnabled} description="Whether self-serve signup should be considered active." label="Self-serve enabled" onChange={handleWorkspaceToggle('selfServeEnabled')} />
                  <ToggleRow checked={workspaceForm.inviteOnly} description="Use this to signal that onboarding should remain gated." label="Invite only" onChange={handleWorkspaceToggle('inviteOnly')} />
                  <ToggleRow checked={workspaceForm.maintenanceMode} description="Flip this when you need the product in operator-only mode." label="Maintenance mode" onChange={handleWorkspaceToggle('maintenanceMode')} />
                  <ToggleRow checked={workspaceForm.analyticsReady} description="PostHog or your analytics layer is configured and verified." label="Analytics ready" onChange={handleWorkspaceToggle('analyticsReady')} />
                  <ToggleRow checked={workspaceForm.billingReady} description="Billing provider keys and webhook flow are live." label="Billing ready" onChange={handleWorkspaceToggle('billingReady')} />
                  <ToggleRow checked={workspaceForm.emailReady} description="Transactional email provider is set and templates are tested." label="Email ready" onChange={handleWorkspaceToggle('emailReady')} />
                  <ToggleRow checked={workspaceForm.storageReady} description="Asset uploads and file access policies are ready." label="Storage ready" onChange={handleWorkspaceToggle('storageReady')} />
                </div>

                <Field label="Ops notes" htmlFor="workspace-notes">
                  <textarea
                    id="workspace-notes"
                    rows={6}
                    value={workspaceForm.notes}
                    onChange={handleWorkspaceInput('notes')}
                    className="w-full border border-white/10 bg-black px-3 py-3 text-sm text-white outline-none transition focus:border-red-500"
                    placeholder="Launch blockers, support rotations, checklist state, or deployment notes."
                  />
                </Field>

                <button
                  type="button"
                  onClick={handleSaveWorkspace}
                  disabled={isSavingWorkspace}
                  className="w-full border border-red-500/40 bg-red-500 px-4 py-3 text-sm uppercase tracking-[0.22em] text-black transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSavingWorkspace ? 'Saving' : 'Save Convex workspace config'}
                </button>
              </div>
            </article>

            <div className="grid gap-6">
              <article className="border border-white/10 bg-white/[0.03]">
                <div className="border-b border-white/10 px-4 py-4 sm:px-6">
                  <p className="text-[11px] uppercase tracking-[0.35em] text-red-300">Active sessions</p>
                  <h2 className="mt-2 text-xl text-white">Inspect device state</h2>
                </div>
                <div className="max-h-[28rem] overflow-y-auto">
                  {isLoadingSessions ? (
                    <div className="px-4 py-6 text-sm text-white/55 sm:px-6">Loading sessions...</div>
                  ) : null}
                  {sessions.map((session) => (
                    <div key={session.token} className="border-b border-white/10 px-4 py-4 sm:px-6">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <p className="text-sm text-white">{session.userAgent || 'Unknown device'}</p>
                          <p className="mt-2 break-all text-xs uppercase tracking-[0.18em] text-white/45">
                            {session.ipAddress || 'No IP'} / {shortToken(session.token)}
                          </p>
                          <p className="mt-2 text-xs text-white/55">Created {formatDateTime(session.createdAt)}</p>
                          <p className="mt-1 text-xs text-white/45">Expires {formatDateTime(session.expiresAt)}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => void handleRevokeSession(session.token)}
                          className="border border-white/15 bg-white/[0.05] px-3 py-2 text-[11px] uppercase tracking-[0.22em] text-white transition hover:bg-white/[0.08]"
                        >
                          Revoke
                        </button>
                      </div>
                    </div>
                  ))}
                  {!isLoadingSessions && sessions.length === 0 ? (
                    <div className="px-4 py-6 text-sm text-white/55 sm:px-6">Select a user to inspect active sessions.</div>
                  ) : null}
                </div>
              </article>

              <article className="border border-white/10 bg-white/[0.03]">
                <div className="border-b border-white/10 px-4 py-4 sm:px-6">
                  <p className="text-[11px] uppercase tracking-[0.35em] text-red-300">Operator log</p>
                  <h2 className="mt-2 text-xl text-white">Recent Convex activity</h2>
                </div>
                <div className="max-h-[24rem] overflow-y-auto">
                  {consoleState?.recentActivity?.map((entry) => (
                    <div key={entry.id} className="border-b border-white/10 px-4 py-4 sm:px-6">
                      <div className="flex flex-col gap-1">
                        <p className="text-sm text-white">{entry.summary}</p>
                        <p className="text-xs uppercase tracking-[0.18em] text-white/45">
                          {entry.action} / {entry.actorEmail || entry.actorName || 'Unknown actor'}
                        </p>
                        <p className="text-xs text-white/40">{formatDateTime(entry.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                  {consoleState?.recentActivity?.length ? null : (
                    <div className="px-4 py-6 text-sm text-white/55 sm:px-6">Audit entries appear here after the first Convex-backed admin action.</div>
                  )}
                </div>
              </article>
            </div>
          </section>
        </div>
      </section>
    </AppShell>
  )
}

function MetricCard({
  detail,
  label,
  value,
}: {
  detail: string
  label: string
  value: string
}) {
  return (
    <div className="bg-black px-4 py-5 sm:px-6">
      <p className="text-[11px] uppercase tracking-[0.3em] text-white/45">{label}</p>
      <p className="mt-3 text-3xl text-white">{value}</p>
      <p className="mt-2 text-sm leading-6 text-white/55">{detail}</p>
    </div>
  )
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-white/10 bg-black/50 p-4">
      <p className="text-[11px] uppercase tracking-[0.28em] text-white/45">{label}</p>
      <p className="mt-3 break-words text-sm text-white">{value || 'None'}</p>
    </div>
  )
}

function Field({
  children,
  htmlFor,
  label,
}: {
  children: ReactNode
  htmlFor: string
  label: string
}) {
  return (
    <div className="grid gap-2">
      <label htmlFor={htmlFor} className="text-[11px] uppercase tracking-[0.28em] text-white/55">
        {label}
      </label>
      {children}
    </div>
  )
}

function ToggleRow({
  checked,
  description,
  label,
  onChange,
}: {
  checked: boolean
  description: string
  label: string
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
}) {
  return (
    <label className="flex items-start gap-3 border border-white/10 bg-black/50 p-4">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="mt-1 h-4 w-4 border-white/20 bg-black text-red-500 focus:ring-red-500"
      />
      <span className="min-w-0">
        <span className="block text-sm text-white">{label}</span>
        <span className="mt-1 block text-sm leading-6 text-white/50">{description}</span>
      </span>
    </label>
  )
}

function RoleBadge({ role }: { role: string }) {
  return (
    <span className="inline-flex border border-white/15 bg-white/[0.05] px-2 py-1 text-[10px] uppercase tracking-[0.25em] text-white/65">
      {role || 'user'}
    </span>
  )
}

function StatusBadge({
  label,
  tone,
}: {
  label: string
  tone: 'danger' | 'neutral'
}) {
  const className =
    tone === 'danger'
      ? 'border border-red-500/30 bg-red-500/10 text-red-100'
      : 'border border-white/15 bg-white/[0.05] text-white/70'

  return (
    <span className={className + ' inline-flex px-2 py-1 text-[10px] uppercase tracking-[0.25em]'}>
      {label}
    </span>
  )
}

function formatCount(value: number | null | undefined) {
  return typeof value === 'number' ? String(value) : '--'
}

function formatDateTime(value: number | undefined) {
  if (!value) {
    return 'Unknown'
  }
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(value)
}

function shortToken(value: string) {
  if (!value) {
    return 'No token'
  }
  return value.slice(0, 8) + '...'
}

function normalizeAdminUsers(values: unknown[]): AdminUser[] {
  return values.map((value) => {
    const record = value as Record<string, unknown>
    return {
      banReason: getString(record.banReason),
      banned: Boolean(record.banned),
      createdAt: getTimestamp(record.createdAt),
      email: getString(record.email),
      emailVerified: Boolean(record.emailVerified),
      id: getString(record.id),
      name: getString(record.name) || getString(record.email) || 'Unknown user',
      role: normalizeRoleValue(record.role),
    }
  })
}

function normalizeAdminSessions(values: unknown[]): AdminSession[] {
  return values.map((value) => {
    const record = value as Record<string, unknown>
    return {
      createdAt: getTimestamp(record.createdAt),
      expiresAt: getTimestamp(record.expiresAt),
      ipAddress: getString(record.ipAddress),
      token: getString(record.token),
      userAgent: getString(record.userAgent),
    }
  })
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message
  }
  return 'An unexpected admin action failed.'
}

function normalizeRoleInput(role: string) {
  const roles = role
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry): entry is 'admin' | 'user' => entry === 'admin' || entry === 'user')

  if (roles.length <= 1) {
    return roles[0] ?? 'user'
  }
  return roles
}

function normalizeRoleValue(role: unknown) {
  if (Array.isArray(role)) {
    return role
      .map((entry) => getString(entry))
      .filter(Boolean)
      .join(',')
  }
  return getString(role)
}

function getString(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function getTimestamp(value: unknown) {
  if (value instanceof Date) {
    return value.getTime()
  }
  return typeof value === 'number' ? value : 0
}

function normalizeWorkspaceForm(value: unknown): WorkspaceForm {
  const record = value as Record<string, unknown>
  return {
    analyticsReady: Boolean(record.analyticsReady),
    billingReady: Boolean(record.billingReady),
    emailReady: Boolean(record.emailReady),
    inviteOnly: Boolean(record.inviteOnly),
    launchStage: normalizeLaunchStage(record.launchStage),
    maintenanceMode: Boolean(record.maintenanceMode),
    notes: getString(record.notes),
    primaryDomain: getString(record.primaryDomain),
    productName: getString(record.productName),
    selfServeEnabled:
      typeof record.selfServeEnabled === 'boolean' ? record.selfServeEnabled : true,
    statusBanner: getString(record.statusBanner),
    storageReady: Boolean(record.storageReady),
    supportEmail: getString(record.supportEmail),
  }
}

function normalizeLaunchStage(value: unknown): WorkspaceForm['launchStage'] {
  return value === 'internal' || value === 'beta' || value === 'public'
    ? value
    : 'draft'
}

type WorkspaceForm = {
  analyticsReady: boolean
  billingReady: boolean
  emailReady: boolean
  inviteOnly: boolean
  launchStage: 'draft' | 'internal' | 'beta' | 'public'
  maintenanceMode: boolean
  notes: string
  primaryDomain: string
  productName: string
  selfServeEnabled: boolean
  statusBanner: string
  storageReady: boolean
  supportEmail: string
}

const defaultWorkspaceForm: WorkspaceForm = {
  analyticsReady: false,
  billingReady: false,
  emailReady: false,
  inviteOnly: false,
  launchStage: 'draft',
  maintenanceMode: false,
  notes: '',
  primaryDomain: '',
  productName: '',
  selfServeEnabled: true,
  statusBanner: '',
  storageReady: false,
  supportEmail: '',
}

type WorkspaceToggleKey =
  | 'analyticsReady'
  | 'billingReady'
  | 'emailReady'
  | 'inviteOnly'
  | 'maintenanceMode'
  | 'selfServeEnabled'
  | 'storageReady'

type WorkspaceTextKey =
  | 'launchStage'
  | 'notes'
  | 'primaryDomain'
  | 'productName'
  | 'statusBanner'
  | 'supportEmail'

type AdminUser = {
  banReason: string
  banned: boolean
  createdAt: number
  email: string
  emailVerified: boolean
  id: string
  name: string
  role: string
}

type AdminSession = {
  createdAt: number
  expiresAt: number
  ipAddress: string
  token: string
  userAgent: string
}
`;
}
