import { createFileRoute } from '@tanstack/react-router'
import { reactStartHandler } from '@convex-dev/better-auth/react-start'

function deriveConvexSiteUrl() {
  const direct = process.env.VITE_CONVEX_SITE_URL
  if (direct) return direct
  const rpc = process.env.VITE_CONVEX_URL
  if (!rpc) return undefined
  try {
    const url = new URL(rpc)
    const basePort = url.port ? Number(url.port) : url.protocol === 'https:' ? 443 : 80
    const nextPort = Number.isFinite(basePort) ? basePort + 1 : basePort
    url.port = String(nextPort)
    return url.toString().replace(/\/$/, '')
  } catch {
    return undefined
  }
}

export const Route = createFileRoute('/api/auth/$')({
  server: {
    handlers: {
      GET: ({ request }) =>
        reactStartHandler(request, { convexSiteUrl: deriveConvexSiteUrl() }),
      POST: ({ request }) =>
        reactStartHandler(request, { convexSiteUrl: deriveConvexSiteUrl() }),
    },
  },
})
