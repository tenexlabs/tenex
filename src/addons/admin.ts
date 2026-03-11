import { join } from 'node:path';
import type { AdminProvider } from '../lib/tenex-config';
import {
  ensureBetterAuthPlugins,
  managedFile,
  projectScaffoldPaths,
  writeAddonFiles,
} from './shared';

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

  const { routesDir } = await projectScaffoldPaths(projectDir);
  await writeAddonFiles([
    managedFile(join(routesDir, 'admin.tsx'), adminRouteSource()),
  ]);
}

function adminRouteSource(): string {
  return `import { createFileRoute, redirect } from '@tanstack/react-router'
import { AppShell } from '~/components/AppShell'
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
  const sections = [
    'User search and role updates',
    'Ban and session revocation',
    'Impersonation handoff',
    'Billing status and entitlement review',
    'Storage inspection and file triage',
    'Invite resend and support actions',
  ]

  return (
    <AppShell
      title="Admin operations"
      description="A custom same-app admin surface backed by Better Auth admin capabilities and your chosen addon stack."
    >
      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-200">
          Admin surface
        </p>
        <h2 className="mt-4 text-3xl font-semibold text-white">
          {tenexConfig.brand.name} operations console
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {sections.map((section) => (
            <article
              key={section}
              className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5 text-sm text-white/70"
            >
              {section}
            </article>
          ))}
        </div>
      </section>
    </AppShell>
  )
}
`;
}
