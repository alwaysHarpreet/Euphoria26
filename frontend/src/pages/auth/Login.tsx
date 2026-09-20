import { useState } from 'react'
import type { FormEvent } from 'react'
import {
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
} from 'lucide-react'
import {
  Navigate,
  useNavigate,
  Link,
} from 'react-router-dom'

import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'

export default function Login() {
  const navigate = useNavigate()
  const { login, isAuthenticated, role } = useAuth()

  const [leaderEmail, setLeaderEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (isAuthenticated && role === 'team') {
    return <Navigate to="/dashboard" replace />
  }

  if (isAuthenticated && role === 'evaluator') {
    return <Navigate to="/evaluator/dashboard" replace />
  }

  if (isAuthenticated && role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />
  }

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    setError('')

    if (!leaderEmail || !password) {
      setError('Please enter your email and password.')
      return
    }

    try {
      setLoading(true)

      const response = await api.post('/auth/login', {
        leader_email: leaderEmail,
        password,
      })

      login(response.data.access_token, 'team')

      navigate('/dashboard', {
        replace: true,
      })
    } catch (err: any) {
      const message =
        err?.response?.data?.detail ||
        'Unable to sign in. Please check your credentials.'

      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] text-white">
      <div className="flex min-h-screen">

        {/* Left branding panel */}
        <div className="relative hidden w-[48%] overflow-hidden border-r border-white/10 lg:flex">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.07),transparent_35%)]" />

          <div className="relative flex w-full flex-col justify-between p-10 xl:p-14">

            {/* Brand */}
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-sm font-bold text-[#000000]">
                HO
              </div>

              <div>
                <h1 className="text-[15px] font-semibold tracking-tight">
                  HackOddsey
                </h1>

                <p className="mt-0.5 text-[10px] uppercase tracking-[0.14em] text-gray-500">
                  Hackathon Platform
                </p>
              </div>
            </div>

            {/* Branding message */}
            <div className="max-w-lg">
              <p className="mb-4 text-xs font-medium uppercase tracking-[0.16em] text-gray-500">
                Team Workspace
              </p>

              <h2 className="text-4xl font-semibold leading-tight tracking-tight xl:text-5xl">
                Build.
                <br />
                Compete.
                <br />
                Lead.
              </h2>

              <p className="mt-6 max-w-md text-sm leading-7 text-gray-500">
                Access your team workspace, manage your problem statement,
                track evaluations, and follow your position on the leaderboard.
              </p>
            </div>

            {/* Footer */}
            <p className="text-xs text-gray-600">
              HackOddsey • Team Portal
            </p>
          </div>
        </div>

        {/* Login panel */}
        <div className="flex flex-1 items-center justify-center px-6 py-10 sm:px-10">
          <div className="w-full max-w-[420px]">

            {/* Mobile logo */}
            <div className="mb-10 flex items-center gap-3 lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-xs font-bold text-[#000000]">
                HO
              </div>

              <div>
                <h1 className="text-[15px] font-semibold">
                  HackOddsey
                </h1>

                <p className="text-[10px] uppercase tracking-[0.12em] text-gray-500">
                  Hackathon Platform
                </p>
              </div>
            </div>

            {/* Heading */}
            <div className="mb-8">
              <p className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-gray-500">
                Team Login
              </p>

              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Welcome back
              </h2>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Sign in using your team leader credentials.
              </p>
            </div>

            {/* Login form */}
            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >

              {/* Email */}
              <div>
                <label
                  htmlFor="leader-email"
                  className="mb-2 block text-xs font-medium text-gray-400"
                >
                  Team Leader Email
                </label>

                <div className="relative">
                  <Mail
                    size={17}
                    strokeWidth={1.8}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600"
                  />

                  <input
                    id="leader-email"
                    type="email"
                    value={leaderEmail}
                    onChange={(event) =>
                      setLeaderEmail(event.target.value)
                    }
                    placeholder="leader@example.com"
                    autoComplete="email"
                    disabled={loading}
                    className="h-12 w-full rounded-xl border border-white/10 bg-[#0b0f19] pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-white/25 focus:ring-1 focus:ring-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-xs font-medium text-gray-400"
                >
                  Password
                </label>

                <div className="relative">
                  <LockKeyhole
                    size={17}
                    strokeWidth={1.8}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600"
                  />

                  <input
                    id="password"
                    type={
                      showPassword
                        ? 'text'
                        : 'password'
                    }
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    disabled={loading}
                    className="h-12 w-full rounded-xl border border-white/10 bg-[#0b0f19] pl-11 pr-12 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-white/25 focus:ring-1 focus:ring-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (value) => !value,
                      )
                    }
                    disabled={loading}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-600 transition-colors hover:text-gray-300 disabled:cursor-not-allowed"
                    aria-label={
                      showPassword
                        ? 'Hide password'
                        : 'Show password'
                    }
                  >
                    {showPassword ? (
                      <EyeOff
                        size={17}
                        strokeWidth={1.8}
                      />
                    ) : (
                      <Eye
                        size={17}
                        strokeWidth={1.8}
                      />
                    )}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                  <p className="text-xs leading-5 text-gray-300">
                    {error}
                  </p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="flex h-12 w-full items-center justify-center rounded-xl bg-white px-4 text-sm font-semibold text-[#000000] transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? 'Signing in...'
                  : 'Sign in'}
              </button>
            </form>

            {/* Footer note */}
            <div className="mt-8 border-t border-white/10 pt-6">
              <Link
                to="/login"
                className="mb-4 block text-center text-xs text-gray-500 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              >
                ← Back to portal selection
              </Link>

              <p className="text-center text-xs leading-5 text-gray-600">
                Team members do not require separate login credentials.
                Use the registered team leader account.
              </p>
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}