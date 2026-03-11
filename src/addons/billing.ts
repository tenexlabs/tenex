import { join } from 'node:path';
import type { InstallPackage } from '../lib/package-manager';
import type { BillingProvider } from '../lib/tenex-config';
import {
  ensureConvexComponentInConfig,
  managedFile,
  projectScaffoldPaths,
  writeAddonFiles,
} from './shared';

export function billingPackages(provider: BillingProvider): InstallPackage[] {
  switch (provider) {
    case 'stripe':
      return [{ name: '@convex-dev/stripe' }, { name: 'stripe' }];
    case 'autumn':
      return [{ name: '@useautumn/convex' }];
    default:
      return [];
  }
}

export async function applyBillingAddon(
  projectDir: string,
  provider: BillingProvider
): Promise<void> {
  if (provider === 'none') {
    return;
  }

  await ensureConvexComponentInConfig({
    importName: provider === 'stripe' ? 'stripe' : 'autumn',
    importPath:
      provider === 'stripe'
        ? '@convex-dev/stripe/convex.config'
        : '@useautumn/convex/convex.config',
    projectDir,
    useStatement: `app.use(${provider === 'stripe' ? 'stripe' : 'autumn'})`,
  });

  const { srcDir, routesDir } = await projectScaffoldPaths(projectDir);
  const files = [
    managedFile(
      join(projectDir, 'convex', 'billing.ts'),
      billingServerSource(provider)
    ),
    managedFile(
      join(srcDir, 'lib', 'billing.ts'),
      billingClientSource(provider)
    ),
    managedFile(
      join(routesDir, 'api', 'billing', '$.ts'),
      billingWebhookRouteSource(provider)
    ),
  ];

  await writeAddonFiles(files);
}

function billingServerSource(
  provider: Exclude<BillingProvider, 'none'>
): string {
  return `import { mutation, query } from './_generated/server'

export const billingProvider = ${JSON.stringify(provider)} as const

export const getBillingOverview = query({
  args: {},
  handler: async () => {
    return {
      provider: billingProvider,
      portalUrl: '/pricing',
      plans: [
        { id: 'launch', name: 'Launch', price: '$0', highlighted: false },
        { id: 'growth', name: 'Growth', price: '$49', highlighted: true },
        { id: 'scale', name: 'Scale', price: 'Custom', highlighted: false },
      ],
    }
  },
})

export const recordBillingEvent = mutation({
  args: {},
  handler: async () => {
    return {
      ok: true,
      provider: billingProvider,
      note: 'Replace this stub with your component-specific checkout or webhook handler.',
    }
  },
})
`;
}

function billingClientSource(
  provider: Exclude<BillingProvider, 'none'>
): string {
  return `export const billingProvider = ${JSON.stringify(provider)} as const

export const billingPlans = [
  {
    id: 'launch',
    name: 'Launch',
    price: '$0',
    description: 'Internal validation and setup.',
  },
  {
    id: 'growth',
    name: 'Growth',
    price: '$49',
    description: 'The default monetization surface for your first paying customers.',
  },
  {
    id: 'scale',
    name: 'Scale',
    price: 'Custom',
    description: 'High-touch plan for upgraded seats, support, and bespoke usage.',
  },
] as const

export async function startCheckout(planId: string) {
  return {
    ok: true,
    provider: billingProvider,
    planId,
  }
}

export async function openCustomerPortal() {
  return {
    ok: true,
    provider: billingProvider,
  }
}
`;
}

function billingWebhookRouteSource(
  provider: Exclude<BillingProvider, 'none'>
): string {
  return `import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/billing/$')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        return new Response(JSON.stringify({
          ok: true,
          provider: ${JSON.stringify(provider)},
          method: request.method,
        }), {
          headers: { 'content-type': 'application/json' },
        })
      },
    },
  },
})
`;
}
