import { createFileRoute, useRouter } from '@tanstack/react-router'
import { authClient } from '~/lib/auth-client'
import { useState } from 'react'

export const Route = createFileRoute('/login')({
  component: Login,
})

function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
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
        // Wait a moment for the session to be established, then redirect
        setTimeout(() => {
          router.navigate({ to: '/dashboard' })
        }, 500)
      }
    } catch (err) {
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
