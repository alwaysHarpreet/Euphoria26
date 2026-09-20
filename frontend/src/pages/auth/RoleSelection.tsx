import {
  ShieldCheck,
  Trophy,
  Users,
  UserRoundCheck,
} from 'lucide-react'
import {
  Link,
  Navigate,
} from 'react-router-dom'

import { useAuth } from '../../context/AuthContext'

const roles = [
  {
    label: 'Team',
    description: 'Participate in the hackathon',
    path: '/team/login',
    icon: Users,
  },
  {
    label: 'Evaluator',
    description: 'Evaluate participating teams',
    path: '/evaluator/login',
    icon: UserRoundCheck,
  },
  {
    label: 'Admin',
    description: 'Manage the hackathon',
    path: '/admin/login',
    icon: ShieldCheck,
  },
]

export default function RoleSelection() {
  const { isAuthenticated, role } = useAuth()

  if (isAuthenticated && role === 'team') {
    return <Navigate to="/dashboard" replace />
  }

  if (isAuthenticated && role === 'evaluator') {
    return <Navigate to="/evaluator/dashboard" replace />
  }

  if (isAuthenticated && role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />
  }

  return (
    <main className="min-h-screen bg-[#0b0f19] px-5 py-10 text-white sm:px-8 lg:px-12">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl flex-col justify-center">
        <header className="mx-auto w-full max-w-3xl text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-sm font-bold text-[#000000]">
            HO
          </div>

          <p className="mt-6 text-[11px] font-medium uppercase tracking-[0.2em] text-gray-500">
            Hackathon Platform
          </p>

          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
            HackOddsey
          </h1>

          <p className="mt-4 text-sm text-gray-500 sm:text-base">
            Choose your portal to continue.
          </p>
        </header>

        <section className="mt-12 grid gap-4 md:grid-cols-3">
          {roles.map((item) => {
            const Icon = item.icon

            return (
              <Link
                key={item.label}
                to={item.path}
                className="group rounded-2xl border border-white/10 bg-[#111827] p-6 outline-none transition hover:-translate-y-1 hover:border-white/25 hover:bg-[#151e2e] focus-visible:ring-2 focus-visible:ring-white/60"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.06] text-gray-300 transition group-hover:bg-white group-hover:text-[#000000]">
                  <Icon size={20} strokeWidth={1.8} />
                </div>

                <h2 className="mt-7 text-lg font-semibold text-white">
                  {item.label}
                </h2>

                <p className="mt-2 text-sm text-gray-500">
                  {item.description}
                </p>

                <span className="mt-8 inline-flex text-xs font-medium text-gray-400 transition group-hover:text-white">
                  Continue as {item.label} <span className="ml-2">→</span>
                </span>
              </Link>
            )
          })}
        </section>

        <div className="mt-10 text-center">
          <Link
            to="/leaderboard"
            className="inline-flex items-center gap-2 text-xs text-gray-500 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          >
            <Trophy size={14} />
            View Live Leaderboard
          </Link>
        </div>
      </div>
    </main>
  )
}
