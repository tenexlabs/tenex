import { join } from 'node:path';
import { resolveAppSourceDir } from './lib/app-source';
import {
  assertNoGeneratedFileConflicts,
  type GeneratedFile,
  makeManagedSource,
  writeGeneratedFiles,
} from './lib/generated-files';
import type { TemplateId, TenexManifest } from './lib/tenex-config';

interface TemplateDescriptor {
  description: string;
  label: string;
  value: TemplateId;
}

const TEMPLATE_DESCRIPTORS: TemplateDescriptor[] = [
  {
    label: 'SaaS Core',
    value: 'saas-core',
    description:
      'B2B SaaS workspace with onboarding, pricing, settings, and ops surfaces.',
  },
  {
    label: 'AI SaaS',
    value: 'ai-saas',
    description:
      'Usage-driven AI product shell with runs, prompts, and upgrade pressure.',
  },
  {
    label: 'Waitlist',
    value: 'waitlist',
    description:
      'Prelaunch product with referral waitlist, audience growth, and launch readiness.',
  },
];

export function templateChoices(): TemplateDescriptor[] {
  return TEMPLATE_DESCRIPTORS;
}

export async function applyTemplate(
  projectDir: string,
  manifest: TenexManifest,
  options: { allowOverwrite?: boolean } = {}
) {
  const srcDir = await resolveAppSourceDir(projectDir);
  const routesDir = join(srcDir, 'routes');
  const files: GeneratedFile[] = [
    {
      filePath: join(srcDir, 'lib', 'tenex.generated.ts'),
      contents: makeManagedSource(tenexGeneratedSource(manifest)),
      managed: true,
    },
    {
      filePath: join(srcDir, 'components', 'AppShell.tsx'),
      contents: makeManagedSource(appShellSource()),
      managed: true,
    },
    {
      filePath: join(srcDir, 'components', 'Navbar.tsx'),
      contents: makeManagedSource(navbarSource()),
      managed: true,
    },
    {
      filePath: join(routesDir, 'index.tsx'),
      contents: makeManagedSource(landingRouteSource()),
      managed: true,
    },
    {
      filePath: join(routesDir, 'dashboard.tsx'),
      contents: makeManagedSource(dashboardRouteSource()),
      managed: true,
    },
    {
      filePath: join(routesDir, 'onboarding.tsx'),
      contents: makeManagedSource(onboardingRouteSource()),
      managed: true,
    },
    {
      filePath: join(routesDir, 'settings.tsx'),
      contents: makeManagedSource(settingsRouteSource()),
      managed: true,
    },
    {
      filePath: join(routesDir, 'pricing.tsx'),
      contents: makeManagedSource(pricingRouteSource()),
      managed: true,
    },
  ];

  if (!options.allowOverwrite) {
    await assertNoGeneratedFileConflicts(files);
  }
  await writeGeneratedFiles(files);
}

function tenexGeneratedSource(manifest: TenexManifest): string {
  const template = templateConfig(manifest.template);
  const billingLabel = resolveBillingLabel(manifest.addons.billing);
  const storageLabel = resolveStorageLabel(manifest.addons.storage);
  const enabledAddons = {
    admin: manifest.addons.admin !== 'none',
    analytics: manifest.addons.analytics !== 'none',
    billing: manifest.addons.billing !== 'none',
    email: manifest.addons.email !== 'none',
    storage: manifest.addons.storage !== 'none',
    teams: manifest.addons.teams !== 'none',
  };

  return `export const tenexConfig = {
  template: ${JSON.stringify(manifest.template)},
  packageManager: ${JSON.stringify(manifest.packageManager)},
  brand: {
    name: ${JSON.stringify(template.brandName)},
    accent: ${JSON.stringify(template.accent)},
    tagline: ${JSON.stringify(template.tagline)},
  },
  hero: {
    eyebrow: ${JSON.stringify(template.heroEyebrow)},
    title: ${JSON.stringify(template.heroTitle)},
    description: ${JSON.stringify(template.heroDescription)},
  },
  dashboard: {
    title: ${JSON.stringify(template.dashboardTitle)},
    summary: ${JSON.stringify(template.dashboardSummary)},
    milestones: ${JSON.stringify(template.milestones)},
    metrics: ${JSON.stringify(template.metrics)},
  },
  workflow: {
    primarySurface: ${JSON.stringify(template.primarySurface)},
    nextActions: ${JSON.stringify(template.nextActions)},
  },
  addons: {
    admin: {
      enabled: ${String(enabledAddons.admin)},
      provider: ${JSON.stringify(manifest.addons.admin)},
      label: 'Custom admin panel',
    },
    analytics: {
      enabled: ${String(enabledAddons.analytics)},
      provider: ${JSON.stringify(manifest.addons.analytics)},
      label: 'PostHog analytics',
    },
    billing: {
      enabled: ${String(enabledAddons.billing)},
      provider: ${JSON.stringify(manifest.addons.billing)},
      label: ${JSON.stringify(billingLabel)},
    },
    email: {
      enabled: ${String(enabledAddons.email)},
      provider: ${JSON.stringify(manifest.addons.email)},
      label: 'Resend component',
    },
    storage: {
      enabled: ${String(enabledAddons.storage)},
      provider: ${JSON.stringify(manifest.addons.storage)},
      label: ${JSON.stringify(storageLabel)},
    },
    teams: {
      enabled: ${String(enabledAddons.teams)},
      provider: ${JSON.stringify(manifest.addons.teams)},
      label: 'Better Auth organization',
    },
  },
} as const

export type TenexConfig = typeof tenexConfig
`;
}

function appShellSource(): string {
  return `import type { ReactNode } from 'react'
import { Navbar } from '~/components/Navbar'
import { tenexConfig } from '~/lib/tenex.generated'

interface AppShellProps {
  children: ReactNode
  title: string
  description: string
}

export function AppShell({ children, title, description }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[#050505] text-white [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px),radial-gradient(circle_at_top,rgba(220,38,38,0.24),transparent_28%)] [background-size:24px_24px,24px_24px,100%_100%]">
      <Navbar />
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <header className="overflow-hidden border border-red-500/25 bg-black/85 shadow-[0_0_0_1px_rgba(239,68,68,0.12),0_28px_80px_rgba(0,0,0,0.45)]">
          <div className="grid gap-6 border-b border-red-500/20 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(260px,0.65fr)] lg:items-end">
            <div>
              <p className="text-[11px] uppercase tracking-[0.35em] text-red-300">
                Founder operating system
              </p>
              <h1 className="mt-3 max-w-4xl text-3xl leading-tight text-white sm:text-4xl lg:text-5xl">
                {title}
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-white/65 sm:text-base">
                {description}
              </p>
            </div>

            <div className="border border-white/10 bg-white/[0.03]">
              <div className="border-b border-white/10 px-4 py-3 text-[11px] uppercase tracking-[0.3em] text-white/45">
                Surface profile
              </div>
              <div className="grid gap-px bg-white/10 sm:grid-cols-3 lg:grid-cols-1">
                <div className="bg-black px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-white/45">Brand</p>
                  <p className="mt-2 text-sm text-white">{tenexConfig.brand.name}</p>
                </div>
                <div className="bg-black px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-white/45">Template</p>
                  <p className="mt-2 text-sm text-white">{tenexConfig.template}</p>
                </div>
                <div className="bg-black px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-white/45">Stack</p>
                  <p className="mt-2 text-sm text-white">TanStack + Convex</p>
                </div>
              </div>
            </div>
          </div>
        </header>
        {children}
      </main>
    </div>
  )
}
`;
}

function navbarSource(): string {
  return `import { Link, useLocation, useRouteContext, useRouter } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { authClient } from '~/lib/auth-client'
import { captureTenexEvent } from '~/lib/analytics'
import { tenexConfig } from '~/lib/tenex.generated'

const publicLinks = [
  { to: '/', label: 'Home' },
  { to: '/pricing', label: 'Pricing' },
]

export function Navbar() {
  const router = useRouter()
  const location = useLocation()
  const context = useRouteContext({ from: '__root__' })
  const isAuthenticated = context.isAuthenticated
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const privateLinks = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/onboarding', label: 'Onboarding' },
    { to: '/settings', label: 'Settings' },
    ...(tenexConfig.addons.storage.enabled ? [{ to: '/files', label: 'Files' }] : []),
    ...(tenexConfig.addons.admin.enabled ? [{ to: '/admin', label: 'Admin' }] : []),
  ]

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await authClient.signOut()
      router.navigate({ to: '/' })
    } finally {
      setIsLoggingOut(false)
    }
  }

  useEffect(() => {
    void captureTenexEvent('tenex.page_view', {
      pathname: location.pathname,
      template: tenexConfig.template,
    })
  }, [location.pathname])

  return (
    <nav className="sticky top-0 z-40 border-b border-red-500/20 bg-black/90 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center justify-between gap-3">
            <Link to="/" className="flex min-w-0 items-center gap-3">
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center border border-red-500/35 bg-red-500/12 text-sm font-semibold uppercase tracking-[0.2em] text-red-100">
            {tenexConfig.brand.name.slice(0, 2)}
              </span>
              <div className="min-w-0">
                <span className="block truncate text-sm uppercase tracking-[0.28em] text-white">
                  {tenexConfig.brand.name}
                </span>
                <span className="block truncate text-[10px] uppercase tracking-[0.28em] text-white/45">
                  {tenexConfig.brand.tagline}
                </span>
              </div>
            </Link>

            <span className="inline-flex border border-white/10 bg-white/[0.03] px-3 py-2 text-[10px] uppercase tracking-[0.28em] text-white/50 lg:hidden">
              {isAuthenticated ? 'Authenticated' : 'Public'}
            </span>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-end">
            <div className="flex gap-2 overflow-x-auto pb-1 lg:pb-0">
              {(isAuthenticated ? privateLinks : publicLinks).map((link) => {
                const isActive = location.pathname === link.to
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={
                      isActive
                        ? 'inline-flex shrink-0 border border-red-500/35 bg-red-500/12 px-3 py-2 text-[11px] uppercase tracking-[0.24em] text-red-100'
                        : 'inline-flex shrink-0 border border-white/10 bg-white/[0.02] px-3 py-2 text-[11px] uppercase tracking-[0.24em] text-white/55 transition hover:border-white/20 hover:text-white'
                    }
                  >
                    {link.label}
                  </Link>
                )
              })}
            </div>

            <div className="flex items-center gap-2">
              {isAuthenticated ? (
                <>
                  <span className="hidden border border-white/10 bg-white/[0.03] px-3 py-2 text-[10px] uppercase tracking-[0.24em] text-white/45 xl:inline-flex">
                    {tenexConfig.brand.tagline}
                  </span>
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="inline-flex shrink-0 border border-white/15 bg-white/[0.05] px-4 py-2 text-[11px] uppercase tracking-[0.24em] text-white transition hover:bg-white/[0.08] disabled:opacity-60"
                  >
                    {isLoggingOut ? 'Signing out' : 'Sign out'}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="inline-flex shrink-0 border border-white/15 bg-white/[0.02] px-4 py-2 text-[11px] uppercase tracking-[0.24em] text-white/80 transition hover:text-white"
                  >
                    Log in
                  </Link>
                  <Link
                    to="/signup"
                    className="inline-flex shrink-0 border border-red-500/45 bg-red-500 px-4 py-2 text-[11px] uppercase tracking-[0.24em] text-black transition hover:bg-red-400"
                  >
                    Launch setup
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
`;
}

function landingRouteSource(): string {
  return `import { createFileRoute, Link, useRouteContext } from '@tanstack/react-router'
import { Navbar } from '~/components/Navbar'
import { tenexConfig } from '~/lib/tenex.generated'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  const context = useRouteContext({ from: '__root__' })
  const isAuthenticated = context.isAuthenticated

  return (
    <div className="min-h-screen bg-[#050505] text-white [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px),radial-gradient(circle_at_top,rgba(220,38,38,0.28),transparent_30%)] [background-size:24px_24px,24px_24px,100%_100%]">
      <Navbar />
      <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
          <article className="overflow-hidden border border-red-500/25 bg-black/88 shadow-[0_0_0_1px_rgba(239,68,68,0.12),0_32px_90px_rgba(0,0,0,0.5)]">
            <div className="border-b border-red-500/20 px-4 py-4 sm:px-6">
              <p className="text-[11px] uppercase tracking-[0.35em] text-red-300">
              {tenexConfig.hero.eyebrow}
              </p>
            </div>

            <div className="grid gap-8 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(260px,0.85fr)] lg:items-end">
              <div>
                <h1 className="max-w-4xl text-4xl leading-[1.05] text-white sm:text-5xl lg:text-6xl">
                  {tenexConfig.hero.title}
                </h1>
                <p className="mt-5 max-w-2xl text-sm leading-7 text-white/68 sm:text-base">
                  {tenexConfig.hero.description}
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  {isAuthenticated ? (
                    <Link
                      to="/dashboard"
                      className="inline-flex border border-red-500/45 bg-red-500 px-5 py-3 text-[11px] uppercase tracking-[0.24em] text-black transition hover:bg-red-400"
                    >
                      Open control room
                    </Link>
                  ) : (
                    <>
                      <Link
                        to="/signup"
                        className="inline-flex border border-red-500/45 bg-red-500 px-5 py-3 text-[11px] uppercase tracking-[0.24em] text-black transition hover:bg-red-400"
                      >
                        Start building
                      </Link>
                      <Link
                        to="/pricing"
                        className="inline-flex border border-white/15 bg-white/[0.04] px-5 py-3 text-[11px] uppercase tracking-[0.24em] text-white transition hover:bg-white/[0.07]"
                      >
                        Review monetization
                      </Link>
                    </>
                  )}
                </div>
              </div>

              <div className="border border-white/10 bg-white/[0.03]">
                <div className="border-b border-white/10 px-4 py-3 text-[11px] uppercase tracking-[0.28em] text-white/45">
                  Launch protocol
                </div>
                <div className="grid gap-px bg-white/10">
                  {tenexConfig.workflow.nextActions.map((item, index) => (
                    <div key={item} className="bg-black px-4 py-4">
                      <p className="text-[10px] uppercase tracking-[0.24em] text-red-300">Step 0{index + 1}</p>
                      <p className="mt-3 text-sm leading-6 text-white/75">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </article>

          <aside className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
            <article className="border border-white/10 bg-white/[0.03]">
              <div className="border-b border-white/10 px-4 py-3 text-[11px] uppercase tracking-[0.3em] text-red-300">
                Signal strip
              </div>
              <div className="grid gap-px bg-white/10">
                {tenexConfig.dashboard.metrics.map((metric) => (
                  <div key={metric.label} className="bg-black px-4 py-4">
                    <p className="text-[10px] uppercase tracking-[0.24em] text-white/45">{metric.label}</p>
                    <p className="mt-3 text-3xl text-white">{metric.value}</p>
                    <p className="mt-2 text-sm leading-6 text-white/55">{metric.detail}</p>
                  </div>
                ))}
              </div>
            </article>

            <article className="border border-white/10 bg-white/[0.03] p-4 sm:p-6">
              <p className="text-[11px] uppercase tracking-[0.35em] text-red-300">Interface contract</p>
              <h2 className="mt-3 text-2xl text-white">{tenexConfig.brand.name}</h2>
              <p className="mt-3 text-sm leading-7 text-white/60">{tenexConfig.brand.tagline}</p>
              <div className="mt-6 grid gap-3">
                {[
                  'Black / red / white system tied to the original Tenex voice.',
                  'Monospace-first layout blocks that stay legible on small screens.',
                  'Founder surfaces for setup, pricing, onboarding, and admin without redesign drift.',
                ].map((item) => (
                  <Link
                    key={item}
                    to={isAuthenticated ? '/dashboard' : '/signup'}
                    className="block border border-white/10 bg-black/60 px-4 py-4 text-sm leading-6 text-white/70 transition hover:border-red-500/25"
                  >
                    {item}
                  </Link>
                ))}
              </div>
            </article>
          </aside>
        </section>
      </main>
    </div>
  )
}
`;
}

function dashboardRouteSource(): string {
  return `import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { api } from '../../convex/_generated/api'
import { AppShell } from '~/components/AppShell'
import { tenexConfig } from '~/lib/tenex.generated'

export const Route = createFileRoute('/dashboard')({
  beforeLoad: ({ context }) => {
    if (!context.isAuthenticated) {
      throw redirect({ to: '/login' })
    }
  },
  component: Dashboard,
})

function Dashboard() {
  const { data: user, isLoading } = useQuery(convexQuery(api.auth.getCurrentUser, {}))

  if (isLoading) {
    return (
      <AppShell title="Loading founder workspace" description="Pulling identity, product, and launch surfaces together.">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-white/70">
          Loading your product state...
        </div>
      </AppShell>
    )
  }

  if (!user) {
    return null
  }

  const addonCards = [
    tenexConfig.addons.billing,
    tenexConfig.addons.email,
    tenexConfig.addons.analytics,
    tenexConfig.addons.storage,
    tenexConfig.addons.teams,
    tenexConfig.addons.admin,
  ]

  return (
    <AppShell
      title={tenexConfig.dashboard.title}
      description={tenexConfig.dashboard.summary}
    >
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <article className="border border-red-500/25 bg-black/85">
          <div className="border-b border-red-500/20 px-4 py-4 sm:px-6">
            <p className="text-[11px] uppercase tracking-[0.35em] text-red-300">
            Workspace owner
            </p>
          </div>
          <div className="grid gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(220px,0.7fr)]">
            <div>
              <h2 className="text-3xl text-white sm:text-4xl">{user.name}</h2>
              <p className="mt-3 text-sm leading-7 text-white/60 sm:text-base">{user.email}</p>
              <div className="mt-6 flex flex-wrap gap-2">
                {tenexConfig.dashboard.milestones.map((milestone) => (
                  <span
                    key={milestone}
                    className="inline-flex border border-red-500/25 bg-red-500/10 px-3 py-2 text-[11px] uppercase tracking-[0.22em] text-red-100"
                  >
                    {milestone}
                  </span>
                ))}
              </div>
            </div>

            <div className="border border-white/10 bg-white/[0.03]">
              <div className="border-b border-white/10 px-4 py-3 text-[11px] uppercase tracking-[0.28em] text-white/45">
                Primary surface
              </div>
              <div className="px-4 py-4">
                <h3 className="text-lg text-white">{tenexConfig.workflow.primarySurface}</h3>
                <p className="mt-3 text-sm leading-6 text-white/55">
                  Keep the founder workflow narrow, explicit, and instrumented before widening the product surface.
                </p>
              </div>
            </div>
          </div>
        </article>

        <article className="border border-white/10 bg-white/[0.03]">
          <div className="border-b border-white/10 px-4 py-4 sm:px-6">
            <p className="text-[11px] uppercase tracking-[0.35em] text-red-300">Next actions</p>
          </div>
          <div className="grid gap-px bg-white/10">
            {tenexConfig.workflow.nextActions.map((item) => (
              <div key={item} className="bg-black px-4 py-4 sm:px-6">
                <p className="text-sm leading-7 text-white/72">{item}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {tenexConfig.dashboard.metrics.map((metric) => (
          <article
            key={metric.label}
            className="border border-white/10 bg-white/[0.03] p-5 sm:p-6"
          >
            <p className="text-[11px] uppercase tracking-[0.28em] text-white/45">{metric.label}</p>
            <p className="mt-4 text-4xl text-white">{metric.value}</p>
            <p className="mt-3 text-sm leading-7 text-white/60">{metric.detail}</p>
          </article>
        ))}
      </section>

      <section>
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl text-white">Enabled launch systems</h2>
          <p className="text-[11px] uppercase tracking-[0.24em] text-white/45">
            Driven directly from tenex.json
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {addonCards.map((addon) => (
            <article key={addon.label} className="border border-white/10 bg-white/[0.03] p-5 sm:p-6">
              <p className="text-[11px] uppercase tracking-[0.28em] text-red-300">
                {addon.label}
              </p>
              <p className="mt-4 text-lg text-white">
                {addon.enabled ? addon.provider : 'Disabled'}
              </p>
              <p className="mt-3 text-sm leading-7 text-white/60">
                {addon.enabled
                  ? 'Scaffolded into the app shell and ready for provider credentials.'
                  : 'Can be enabled later with tenex add.'}
              </p>
            </article>
          ))}
        </div>
      </section>
    </AppShell>
  )
}
`;
}

function onboardingRouteSource(): string {
  return `import { createFileRoute, redirect } from '@tanstack/react-router'
import { AppShell } from '~/components/AppShell'
import { tenexConfig } from '~/lib/tenex.generated'

export const Route = createFileRoute('/onboarding')({
  beforeLoad: ({ context }) => {
    if (!context.isAuthenticated) {
      throw redirect({ to: '/login' })
    }
  },
  component: Onboarding,
})

function Onboarding() {
  return (
    <AppShell
      title="Launch onboarding"
      description="Turn the generated scaffold into a founder-ready product in a single pass."
    >
      <section className="grid gap-6 xl:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)]">
        <article className="border border-white/10 bg-white/[0.03] p-5 sm:p-6">
          <p className="text-[11px] uppercase tracking-[0.35em] text-red-300">Operating note</p>
          <h2 className="mt-3 text-2xl text-white">Keep onboarding brutally specific</h2>
          <p className="mt-4 text-sm leading-7 text-white/60">
            Replace these generated tasks with your real activation sequence, expected user artifacts, and the exact moments that prove product value.
          </p>
          <div className="mt-6 grid gap-3">
            {tenexConfig.dashboard.milestones.map((milestone) => (
              <div key={milestone} className="border border-white/10 bg-black/60 px-4 py-3 text-sm text-white/72">
                {milestone}
              </div>
            ))}
          </div>
        </article>

        <div className="grid gap-4">
        {tenexConfig.workflow.nextActions.map((item, index) => (
            <article key={item} className="border border-white/10 bg-white/[0.03] p-5 sm:p-6">
              <p className="text-[11px] uppercase tracking-[0.32em] text-red-300">
                Step 0{index + 1}
              </p>
              <p className="mt-4 text-xl text-white">{item}</p>
              <p className="mt-3 text-sm leading-7 text-white/60">
              This route is intentionally product-facing. Replace the checklist copy with real onboarding tasks for your business.
              </p>
            </article>
        ))}
        </div>
      </section>
    </AppShell>
  )
}
`;
}

function settingsRouteSource(): string {
  return `import { createFileRoute, redirect } from '@tanstack/react-router'
import { AppShell } from '~/components/AppShell'
import { tenexConfig } from '~/lib/tenex.generated'

export const Route = createFileRoute('/settings')({
  beforeLoad: ({ context }) => {
    if (!context.isAuthenticated) {
      throw redirect({ to: '/login' })
    }
  },
  component: Settings,
})

function Settings() {
  const addonRows = Object.entries(tenexConfig.addons)

  return (
    <AppShell
      title="Workspace settings"
      description="Keep provider choices, operational surfaces, and launch metadata visible in-product."
    >
      <section className="grid gap-6 xl:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)]">
        <article className="border border-white/10 bg-white/[0.03] p-5 sm:p-6">
          <p className="text-[11px] uppercase tracking-[0.35em] text-red-300">
            Template
          </p>
          <h2 className="mt-4 text-3xl text-white">{tenexConfig.template}</h2>
          <p className="mt-3 text-sm leading-7 text-white/60">
            Package manager: {tenexConfig.packageManager}
          </p>
          <div className="mt-6 grid gap-3">
            <div className="border border-white/10 bg-black/60 px-4 py-4">
              <p className="text-[10px] uppercase tracking-[0.24em] text-white/45">Brand line</p>
              <p className="mt-3 text-sm text-white/75">{tenexConfig.brand.tagline}</p>
            </div>
            <div className="border border-white/10 bg-black/60 px-4 py-4">
              <p className="text-[10px] uppercase tracking-[0.24em] text-white/45">Primary surface</p>
              <p className="mt-3 text-sm text-white/75">{tenexConfig.workflow.primarySurface}</p>
            </div>
          </div>
        </article>
        <article className="border border-white/10 bg-white/[0.03] p-5 sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-2xl text-white">Addon map</h2>
            <p className="text-[11px] uppercase tracking-[0.24em] text-white/45">Scaffold contract</p>
          </div>
          <div className="mt-6 grid gap-3">
            {addonRows.map(([key, addon]) => (
              <div key={key} className="grid gap-3 border border-white/10 bg-black/60 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-white/45">
                    {key}
                  </p>
                  <p className="mt-2 text-sm text-white/65">{addon.label}</p>
                </div>
                <span className="inline-flex w-fit border border-white/15 bg-white/[0.05] px-3 py-2 text-[11px] uppercase tracking-[0.24em] text-white/75">
                  {addon.enabled ? addon.provider : 'none'}
                </span>
              </div>
            ))}
          </div>
        </article>
      </section>
    </AppShell>
  )
}
`;
}

function pricingRouteSource(): string {
  return `import { createFileRoute } from '@tanstack/react-router'
import { AppShell } from '~/components/AppShell'
import { tenexConfig } from '~/lib/tenex.generated'

export const Route = createFileRoute('/pricing')({
  component: Pricing,
})

function Pricing() {
  const billing = tenexConfig.addons.billing

  return (
    <AppShell
      title="Revenue surfaces"
      description="This page is scaffolded for monetization and should be wired to your chosen billing provider."
    >
      <section className="grid gap-4 lg:grid-cols-3">
        {[
          {
            name: 'Launch',
            price: '$0',
            detail: 'Used for product validation, admin review, and internal QA.',
          },
          {
            name: 'Growth',
            price: '$49',
            detail: 'The default paid tier with limits designed to convert your first cohort.',
          },
          {
            name: 'Scale',
            price: 'Custom',
            detail: 'High-touch plan with usage, support, and admin controls.',
          },
        ].map((tier) => (
          <article key={tier.name} className="border border-white/10 bg-white/[0.03] p-5 sm:p-6">
            <p className="text-[11px] uppercase tracking-[0.28em] text-red-300">{tier.name}</p>
            <p className="mt-4 text-4xl text-white">{tier.price}</p>
            <p className="mt-3 text-sm leading-7 text-white/60">{tier.detail}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(300px,0.9fr)]">
        <article className="border border-white/10 bg-white/[0.03] p-5 sm:p-6">
          <p className="text-[11px] uppercase tracking-[0.35em] text-red-300">
          Billing provider
          </p>
          <h2 className="mt-4 text-3xl text-white">
            {billing.enabled ? billing.label : 'Not enabled yet'}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/60">
            {billing.enabled
              ? 'Hook this page into the generated billing facade for checkout, entitlement checks, and customer portal access.'
              : 'Enable billing with tenex add billing to turn this into a live monetization surface.'}
          </p>
        </article>

        <article className="border border-white/10 bg-white/[0.03] p-5 sm:p-6">
          <p className="text-[11px] uppercase tracking-[0.35em] text-red-300">Monetization notes</p>
          <div className="mt-4 grid gap-3">
            {[
              'Keep upgrade moments attached to real usage pressure.',
              'Show plan deltas in plain language before the checkout call.',
              'Use the admin surface to review billing state before support work.',
            ].map((item) => (
              <div key={item} className="border border-white/10 bg-black/60 px-4 py-4 text-sm leading-6 text-white/70">
                {item}
              </div>
            ))}
          </div>
        </article>
      </section>
    </AppShell>
  )
}
`;
}

function templateConfig(templateId: TemplateId) {
  switch (templateId) {
    case 'ai-saas':
      return {
        accent: 'ember',
        brandName: 'Signal Forge',
        tagline: 'Ship the AI product people pay to keep using.',
        heroEyebrow: 'AI product starter',
        heroTitle: 'Move from prompt playground to paid AI workflow fast.',
        heroDescription:
          'Signal Forge is tuned for solo founders shipping AI workflows: guided onboarding, usage pressure, pricing surfaces, and an operations shell ready for Convex-native addons.',
        dashboardTitle: 'AI product control room',
        dashboardSummary:
          'Monitor activation, usage growth, monetization pressure, and product operations from one founder-facing workspace.',
        primarySurface: 'Prompt runs, evaluation loops, and upgrade moments',
        nextActions: [
          'Connect your model provider and capture first-run analytics.',
          'Map pricing to usage units and entitlement checks.',
          'Turn onboarding copy into a real activation flow.',
        ],
        milestones: [
          'Ship first workflow',
          'Capture conversion event',
          'Add paid tier',
        ],
        metrics: [
          {
            label: 'Activation',
            value: '62%',
            detail: 'Users completing first successful workflow.',
          },
          {
            label: 'Runs',
            value: '1.8k',
            detail: 'Tracked prompt or job executions in the last 7 days.',
          },
          {
            label: 'Conversion',
            value: '5.4%',
            detail: 'Trial-to-paid lift once usage limits apply.',
          },
        ],
      };
    case 'waitlist':
      return {
        accent: 'sun',
        brandName: 'Northstar Launch',
        tagline: 'Grow audience, validate demand, and launch with signal.',
        heroEyebrow: 'Prelaunch starter',
        heroTitle:
          'Turn your landing page into a launch system, not a placeholder.',
        heroDescription:
          'Northstar Launch gives solo founders a referral waitlist, launch checklist, analytics hooks, and admin tooling so prelaunch momentum compounds into day-one demand.',
        dashboardTitle: 'Launch operations hub',
        dashboardSummary:
          'Track demand, operator actions, launch milestones, and conversion surfaces without bolting together ad-hoc tools.',
        primarySurface:
          'Referral waitlist growth, launch segments, and broadcast readiness',
        nextActions: [
          'Customize the value proposition and referral rewards.',
          'Wire transactional email for invites and launch updates.',
          'Use analytics to isolate the highest-intent channels.',
        ],
        milestones: [
          'Validate waitlist funnel',
          'Launch referral reward',
          'Segment launch cohort',
        ],
        metrics: [
          {
            label: 'Waitlist',
            value: '4.2k',
            detail: 'Subscribers available for launch messaging and cohorting.',
          },
          {
            label: 'Referral rate',
            value: '28%',
            detail: 'Share-driven growth from the built-in referral mechanism.',
          },
          {
            label: 'Launch-ready',
            value: '11 days',
            detail:
              'Estimated runway to launch based on current checklist velocity.',
          },
        ],
      };
    default:
      return {
        accent: 'copper',
        brandName: 'Orbit Ops',
        tagline: 'Get to a real SaaS control room before the momentum dies.',
        heroEyebrow: 'Founder-ready SaaS starter',
        heroTitle:
          'Start with a product shell that already thinks about revenue and operations.',
        heroDescription:
          'Orbit Ops is the default B2B SaaS base: onboarding, pricing, settings, admin hooks, and addon surfaces that map directly to how solo founders ship and monetize.',
        dashboardTitle: 'Founder workspace',
        dashboardSummary:
          'See customer identity, launch milestones, monetization systems, and operating surfaces in one app instead of gluing boilerplate together by hand.',
        primarySurface:
          'Activation, billing, operations, and launch sequencing',
        nextActions: [
          'Replace placeholder copy with your market narrative and offer.',
          'Enable billing, analytics, and email before inviting real users.',
          'Use admin and settings surfaces to centralize early operations.',
        ],
        milestones: [
          'Define offer',
          'Instrument first user path',
          'Ship first paid account',
        ],
        metrics: [
          {
            label: 'MRR target',
            value: '$2.5k',
            detail: 'Starter benchmark for reaching meaningful founder signal.',
          },
          {
            label: 'Activation',
            value: '41%',
            detail:
              'Users completing onboarding and creating their first entity.',
          },
          {
            label: 'Pipeline',
            value: '14',
            detail: 'Accounts moving from signup to first meaningful outcome.',
          },
        ],
      };
  }
}

function resolveBillingLabel(
  provider: TenexManifest['addons']['billing']
): string {
  if (provider === 'autumn') {
    return 'Autumn component';
  }
  if (provider === 'stripe') {
    return 'Stripe component';
  }
  return 'Billing not enabled';
}

function resolveStorageLabel(
  provider: TenexManifest['addons']['storage']
): string {
  if (provider === 'r2') {
    return 'Cloudflare R2 component';
  }
  if (provider === 'convex') {
    return 'Convex file storage';
  }
  return 'Storage not enabled';
}
