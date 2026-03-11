import { join } from 'node:path';
import type { InstallPackage } from '../lib/package-manager';
import type { StorageProvider } from '../lib/tenex-config';
import {
  ensureConvexComponentInConfig,
  managedFile,
  projectScaffoldPaths,
  writeAddonFiles,
} from './shared';

export function storagePackages(provider: StorageProvider): InstallPackage[] {
  if (provider === 'r2') {
    return [{ name: '@convex-dev/r2' }];
  }
  return [];
}

export async function applyStorageAddon(
  projectDir: string,
  provider: StorageProvider
): Promise<void> {
  if (provider === 'none') {
    return;
  }

  if (provider === 'r2') {
    await ensureConvexComponentInConfig({
      importName: 'r2',
      importPath: '@convex-dev/r2/convex.config',
      projectDir,
      useStatement: 'app.use(r2)',
    });
  }

  const { srcDir, routesDir } = await projectScaffoldPaths(projectDir);
  await writeAddonFiles([
    managedFile(
      join(projectDir, 'convex', 'storage.ts'),
      storageServerSource(provider)
    ),
    managedFile(
      join(srcDir, 'lib', 'storage.ts'),
      storageClientSource(provider)
    ),
    managedFile(join(routesDir, 'files.tsx'), filesRouteSource(provider)),
  ]);
}

function storageServerSource(
  provider: Exclude<StorageProvider, 'none'>
): string {
  return `import { mutation, query } from './_generated/server'

export const storageProvider = ${JSON.stringify(provider)} as const

export const listFiles = query({
  args: {},
  handler: async () => {
    return [
      {
        id: 'launch-plan',
        name: 'launch-plan.pdf',
        provider: storageProvider,
      },
    ]
  },
})

export const requestUpload = mutation({
  args: {},
  handler: async () => {
    return {
      provider: storageProvider,
      uploadUrl: '/files',
    }
  },
})
`;
}

function storageClientSource(
  provider: Exclude<StorageProvider, 'none'>
): string {
  return `export const storageProvider = ${JSON.stringify(provider)} as const
`;
}

function filesRouteSource(provider: Exclude<StorageProvider, 'none'>): string {
  return `import { createFileRoute, redirect } from '@tanstack/react-router'
import { AppShell } from '~/components/AppShell'

export const Route = createFileRoute('/files')({
  beforeLoad: ({ context }) => {
    if (!context.isAuthenticated) {
      throw redirect({ to: '/login' })
    }
  },
  component: Files,
})

function Files() {
  return (
    <AppShell
      title="File operations"
      description="Upload, inspect, and manage founder assets through the shared storage surface."
    >
      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-200">
          Storage provider
        </p>
        <h2 className="mt-4 text-3xl font-semibold text-white">
          ${provider === 'r2' ? 'Cloudflare R2 component' : 'Convex file storage'}
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">
          This route is scaffolded so your upload surface, file metadata model, and access controls live in one place.
        </p>
      </section>
    </AppShell>
  )
}
`;
}
