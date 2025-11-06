import { createFileRoute, useRouter, redirect } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { convexQuery } from '@convex-dev/react-query'
import { api } from '../../convex/_generated/api'
import { authClient } from '~/lib/auth-client'
import { useState, useEffect } from 'react'

export const Route = createFileRoute('/dashboard')({
  component: Dashboard,
})

function Dashboard() {
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  // Get the current user from Convex
  const { data: user, isLoading } = useQuery(
    convexQuery(api.auth.getCurrentUser, {})
  )

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.navigate({ to: '/login' })
    }
  }, [user, isLoading, router])

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await authClient.signOut()
      router.navigate({ to: '/' })
    } catch (error) {
      console.error('Logout failed:', error)
      setIsLoggingOut(false)
    }
  }

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </main>
    )
  }

  // Don't render dashboard if no user (will redirect)
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

        <div className="flex flex-col gap-4">
          <h3 className="text-2xl font-semibold">Your Dashboard</h3>
          <p className="text-slate-600 dark:text-slate-400">
            This is a protected route that only authenticated users can access.
            You can now build your application features here!
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border-2 border-slate-200 dark:border-slate-700">
              <h4 className="text-lg font-semibold mb-2">Quick Stats</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Add your dashboard widgets and statistics here.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border-2 border-slate-200 dark:border-slate-700">
              <h4 className="text-lg font-semibold mb-2">Recent Activity</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Display recent user activity or notifications here.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
