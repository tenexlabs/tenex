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

interface AppShellProps {
  children: ReactNode
  title: string
  description: string
}

export function AppShell({ children, title, description }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,87,34,0.18),_transparent_35%),linear-gradient(180deg,_#09090b_0%,_#10131a_55%,_#141a23_100%)] text-white">
      <Navbar />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-10 sm:px-6 lg:px-8">
        <header className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-[0_32px_80px_rgba(0,0,0,0.32)] backdrop-blur">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-orange-300">
            Founder-ready control room
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            {title}
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-white/70 sm:text-lg">
            {description}
          </p>
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
    <nav className="sticky top-0 z-40 border-b border-white/10 bg-black/40 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-orange-300/30 bg-orange-400/10 text-sm font-semibold uppercase tracking-[0.2em] text-orange-200">
            {tenexConfig.brand.name.slice(0, 2)}
          </span>
          <span className="text-sm font-semibold uppercase tracking-[0.25em] text-white/80">
            {tenexConfig.brand.name}
          </span>
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          {(isAuthenticated ? privateLinks : publicLinks).map((link) => {
            const isActive = location.pathname === link.to
            return (
              <Link
                key={link.to}
                to={link.to}
                className={isActive ? 'text-white' : 'text-white/55 transition-colors hover:text-white'}
              >
                {link.label}
              </Link>
            )
          })}
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <span className="hidden text-sm text-white/50 sm:inline">
                {tenexConfig.brand.tagline}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10 disabled:opacity-60"
              >
                {isLoggingOut ? 'Signing out...' : 'Sign out'}
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-white/80 transition hover:text-white"
              >
                Log in
              </Link>
              <Link
                to="/signup"
                className="rounded-full bg-orange-500 px-4 py-2 text-sm font-medium text-black transition hover:bg-orange-400"
              >
                Launch setup
              </Link>
            </>
          )}
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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.28),_transparent_28%),linear-gradient(180deg,_#050505_0%,_#111827_52%,_#172033_100%)] text-white">
      <Navbar />
      <main className="mx-auto flex max-w-6xl flex-col gap-16 px-4 py-16 sm:px-6 lg:px-8">
        <section className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.35em] text-orange-300">
              {tenexConfig.hero.eyebrow}
            </p>
            <h1 className="max-w-4xl text-5xl font-semibold leading-tight tracking-tight sm:text-6xl">
              {tenexConfig.hero.title}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/72">
              {tenexConfig.hero.description}
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  className="rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-black transition hover:bg-orange-400"
                >
                  Open control room
                </Link>
              ) : (
                <>
                  <Link
                    to="/signup"
                    className="rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-black transition hover:bg-orange-400"
                  >
                    Start building
                  </Link>
                  <Link
                    to="/pricing"
                    className="rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    Review monetization
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.32)] backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-200">
              First launch checklist
            </p>
            <div className="mt-6 space-y-4">
              {tenexConfig.workflow.nextActions.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/72"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {tenexConfig.dashboard.metrics.map((metric) => (
            <div
              key={metric.label}
              className="rounded-[1.75rem] border border-white/10 bg-black/20 p-6"
            >
              <p className="text-sm uppercase tracking-[0.28em] text-white/45">
                {metric.label}
              </p>
              <p className="mt-4 text-3xl font-semibold text-white">{metric.value}</p>
              <p className="mt-2 text-sm leading-6 text-white/60">{metric.detail}</p>
            </div>
          ))}
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
      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-200">
            Workspace owner
          </p>
          <h2 className="mt-4 text-3xl font-semibold text-white">{user.name}</h2>
          <p className="mt-3 text-base text-white/60">{user.email}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            {tenexConfig.dashboard.milestones.map((milestone) => (
              <span
                key={milestone}
                className="rounded-full border border-orange-300/20 bg-orange-400/10 px-4 py-2 text-sm text-orange-100"
              >
                {milestone}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-black/30 p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">
            Primary surface
          </p>
          <h2 className="mt-4 text-2xl font-semibold text-white">
            {tenexConfig.workflow.primarySurface}
          </h2>
          <div className="mt-6 space-y-3">
            {tenexConfig.workflow.nextActions.map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/72">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {tenexConfig.dashboard.metrics.map((metric) => (
          <article
            key={metric.label}
            className="rounded-[1.75rem] border border-white/10 bg-black/20 p-6"
          >
            <p className="text-sm uppercase tracking-[0.24em] text-white/45">{metric.label}</p>
            <p className="mt-4 text-3xl font-semibold text-white">{metric.value}</p>
            <p className="mt-2 text-sm leading-6 text-white/65">{metric.detail}</p>
          </article>
        ))}
      </section>

      <section>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-white">Enabled launch systems</h2>
          <p className="text-sm text-white/50">Driven directly from tenex.json</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {addonCards.map((addon) => (
            <article key={addon.label} className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6">
              <p className="text-sm uppercase tracking-[0.24em] text-orange-200">
                {addon.label}
              </p>
              <p className="mt-4 text-lg font-semibold text-white">
                {addon.enabled ? addon.provider : 'Disabled'}
              </p>
              <p className="mt-2 text-sm leading-6 text-white/60">
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
      <section className="grid gap-4 lg:grid-cols-2">
        {tenexConfig.workflow.nextActions.map((item, index) => (
          <article key={item} className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-200">
              Step {index + 1}
            </p>
            <p className="mt-4 text-xl font-semibold text-white">{item}</p>
            <p className="mt-3 text-sm leading-6 text-white/60">
              This route is intentionally product-facing. Replace the checklist copy with real onboarding tasks for your business.
            </p>
          </article>
        ))}
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
      <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <article className="rounded-[2rem] border border-white/10 bg-black/30 p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/45">
            Template
          </p>
          <h2 className="mt-4 text-3xl font-semibold text-white">{tenexConfig.template}</h2>
          <p className="mt-3 text-sm leading-6 text-white/60">
            Package manager: {tenexConfig.packageManager}
          </p>
        </article>
        <article className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
          <h2 className="text-2xl font-semibold text-white">Addon map</h2>
          <div className="mt-6 divide-y divide-white/10">
            {addonRows.map(([key, addon]) => (
              <div key={key} className="flex items-center justify-between py-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/55">
                    {key}
                  </p>
                  <p className="mt-1 text-sm text-white/55">{addon.label}</p>
                </div>
                <span className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm text-white/75">
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
          <article key={tier.name} className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
            <p className="text-sm uppercase tracking-[0.24em] text-orange-200">{tier.name}</p>
            <p className="mt-4 text-4xl font-semibold text-white">{tier.price}</p>
            <p className="mt-3 text-sm leading-6 text-white/60">{tier.detail}</p>
          </article>
        ))}
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-black/30 p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/45">
          Billing provider
        </p>
        <h2 className="mt-4 text-3xl font-semibold text-white">
          {billing.enabled ? billing.label : 'Not enabled yet'}
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">
          {billing.enabled
            ? 'Hook this page into the generated billing facade for checkout, entitlement checks, and customer portal access.'
            : 'Enable billing with tenex add billing to turn this into a live monetization surface.'}
        </p>
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
