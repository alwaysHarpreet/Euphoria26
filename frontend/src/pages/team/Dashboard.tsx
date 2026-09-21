import { useEffect, useState } from 'react'
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  GitBranch,
  Image as ImageIcon,
  MessageSquare,
  Settings2,
  Trophy,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import DashboardLayout from '../../components/layout/DashboardLayout'
import GroupPhotoUpload from '../../components/team/GroupPhotoUpload'
import api from '../../services/api'

interface Problem {
  id: number
  title: string
  description: string
  is_active: boolean
  created_at: string
}

interface Feedback {
  id: number
  team_id: number
  feedback: string
  created_at: string
  updated_at: string
}

interface Team {
  id: number
  team_code: string
  team_name: string
  college_name: string
  leader_name: string
  leader_email: string
  selected_problem: Problem | null
  group_photo_path: string | null
  group_photo_url: string | null
  repository_url: string | null
  repository_submitted_at: string | null
  feedback: Feedback | null
  created_at: string
}

interface ProgressItemProps {
  title: string
  completed: boolean
  completedText: string
  pendingText: string
  icon: typeof CheckCircle2
}

function ProgressItem({
  title,
  completed,
  completedText,
  pendingText,
  icon: Icon,
}: ProgressItemProps) {
  return (
    <div
      className={[
        'flex min-h-[105px] items-center gap-4 rounded-xl border p-5 transition-all',
        completed
          ? 'border-emerald-400/25 bg-emerald-400/[0.07]'
          : 'border-white/10 bg-white/[0.02]',
      ].join(' ')}
    >
      <div
        className={[
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border',
          completed
            ? 'border-emerald-400/25 bg-emerald-400/[0.10]'
            : 'border-white/10 bg-white/[0.03]',
        ].join(' ')}
      >
        {completed ? (
          <CheckCircle2
            size={19}
            className="text-emerald-400"
          />
        ) : (
          <Icon
            size={18}
            className="text-gray-500"
          />
        )}
      </div>

      <div className="min-w-0">
        <p
          className={[
            'text-sm font-medium',
            completed
              ? 'text-emerald-300'
              : 'text-gray-400',
          ].join(' ')}
        >
          {title}
        </p>

        <p
          className={[
            'mt-1 text-sm font-medium',
            completed
              ? 'text-emerald-400'
              : 'text-gray-500',
          ].join(' ')}
        >
          {completed ? completedText : pendingText}
        </p>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()

  const [team, setTeam] = useState<Team | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchTeam = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await api.get<Team>('/teams/me')

      setTeam(response.data)
    } catch (err: any) {
      console.error('Failed to fetch team:', err)

      setError(
        err?.response?.data?.detail ||
          'Unable to load your team information.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTeam()
  }, [])

  const handlePhotoUploadSuccess = async () => {
    await fetchTeam()
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-[1400px]">
          <div className="flex min-h-[500px] items-center justify-center">
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/10 border-t-white" />
              Loading team workspace...
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !team) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-[1400px]">
          <div className="rounded-2xl border border-white/10 bg-[#111827] p-6">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Team Workspace
            </p>

            <h1 className="mt-2 text-xl font-semibold text-white">
              Unable to load dashboard
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              {error || 'Team information was not found.'}
            </p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const problemCompleted = Boolean(team.selected_problem)
  const groupPhotoCompleted = Boolean(team.group_photo_path)
  const repositoryCompleted = Boolean(team.repository_url)
  const feedbackCompleted = Boolean(team.feedback)

  const completedCount = [
    problemCompleted,
    groupPhotoCompleted,
    repositoryCompleted,
    feedbackCompleted,
  ].filter(Boolean).length

  const progressPercentage = completedCount * 25

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-8">
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-gray-500">
            Team Workspace
          </p>

          <h1 className="text-2xl font-semibold tracking-tight text-white lg:text-3xl">
            Dashboard
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Manage your hackathon participation and track your progress.
          </p>
        </div>

        {/* Top action cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Team */}
          <div className="rounded-2xl border border-white/10 bg-[#111827] p-5">
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                Team
              </p>

              <button
                type="button"
                onClick={() => navigate('/team')}
                className="text-xs font-medium text-[#8fa8ca] transition-colors hover:text-white"
              >
                View
              </button>
            </div>

            <div className="flex min-h-[105px] items-center justify-center">
              <p className="truncate text-center text-lg font-semibold text-white">
                {team.team_name}
              </p>
            </div>
          </div>

          {/* Problem */}
          <div className="rounded-2xl border border-white/10 bg-[#111827] p-5">
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                Problem
              </p>

              <button
                type="button"
                onClick={() => navigate('/problem-statement')}
                className="text-xs font-medium text-[#8fa8ca] transition-colors hover:text-white"
              >
                View
              </button>
            </div>

            <div className="flex min-h-[105px] items-center justify-center">
              <p className="text-center text-lg font-semibold text-white">
                {team.selected_problem ? 'Selected' : 'Not selected'}
              </p>
            </div>
          </div>

          {/* Repository + Feedback */}
          <div className="rounded-2xl border border-white/10 bg-[#111827] p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Workspace
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => navigate('/repository-feedback')}
                className="group rounded-xl border border-white/10 bg-white/[0.02] p-3 text-left transition-colors hover:border-white/20 hover:bg-white/[0.04]"
              >
                <div className="flex items-center justify-between gap-2">
                  <Settings2
                    size={15}
                    className="text-gray-400 transition-colors group-hover:text-white"
                  />

                  <ArrowRight
                    size={13}
                    className="text-gray-600 transition-colors group-hover:text-gray-300"
                  />
                </div>

                <p className="mt-3 text-sm font-medium text-white">
                  Repository
                </p>

                <p className="mt-1 text-[11px] text-gray-500">
                  Manage
                </p>
              </button>

              <button
                type="button"
                onClick={() => navigate('/repository-feedback')}
                className="group rounded-xl border border-white/10 bg-white/[0.02] p-3 text-left transition-colors hover:border-white/20 hover:bg-white/[0.04]"
              >
                <div className="flex items-center justify-between gap-2">
                  <MessageSquare
                    size={15}
                    className="text-gray-400 transition-colors group-hover:text-white"
                  />

                  <ArrowRight
                    size={13}
                    className="text-gray-600 transition-colors group-hover:text-gray-300"
                  />
                </div>

                <p className="mt-3 text-sm font-medium text-white">
                  Feedback
                </p>

                <p className="mt-1 text-[11px] text-gray-500">
                  Manage
                </p>
              </button>
            </div>
          </div>

          {/* Rank */}
          <div className="rounded-2xl border border-white/10 bg-[#111827] p-5">
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                Rank
              </p>

              <button
                type="button"
                onClick={() => navigate('/leaderboard')}
                className="text-xs font-medium text-[#8fa8ca] transition-colors hover:text-white"
              >
                Board
              </button>
            </div>

            <div className="flex min-h-[105px] flex-col items-center justify-center">
              <p className="text-center text-lg font-semibold text-white">
                —
              </p>

              <p className="mt-1 text-center text-xs text-gray-500">
                Leaderboard not started
              </p>
            </div>
          </div>
        </div>

        {/* Progress + Profile */}
        <div className="mt-5 grid gap-5 lg:grid-cols-[1.4fr_0.6fr]">
          <section className="rounded-2xl border border-white/10 bg-[#111827] p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                  Hackathon Progress
                </p>

                <h2 className="mt-2 text-xl font-semibold text-white">
                  Your team workspace
                </h2>
              </div>

              <button
                type="button"
                onClick={() => navigate('/leaderboard')}
                className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-gray-400 transition-colors hover:border-white/20 hover:text-white"
              >
                Round 1
                <ArrowRight size={13} />
              </button>
            </div>

            {/* Overall progress */}
            <div className="mt-8">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  Overall progress
                </span>

                <span className="text-xs font-semibold text-white">
                  {progressPercentage}%
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full bg-white transition-all duration-500"
                  style={{
                    width: `${progressPercentage}%`,
                  }}
                />
              </div>

              <div className="mt-2 flex items-center justify-between">
                <span className="text-[11px] text-gray-600">
                  {completedCount} of 4 milestones completed
                </span>

                {completedCount === 4 && (
                  <span className="text-[11px] font-medium text-emerald-400">
                    All milestones completed
                  </span>
                )}
              </div>
            </div>

            {/* 2 × 2 milestone grid */}
            <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <ProgressItem
                title="Problem Selection"
                completed={problemCompleted}
                completedText="Selected"
                pendingText="Pending"
                icon={CheckCircle2}
              />

              <ProgressItem
                title="Group Photo"
                completed={groupPhotoCompleted}
                completedText="Uploaded"
                pendingText="Pending"
                icon={ImageIcon}
              />

              <ProgressItem
                title="GitHub Repository"
                completed={repositoryCompleted}
                completedText="Submitted"
                pendingText="Pending"
                icon={GitBranch}
              />

              <ProgressItem
                title="Feedback"
                completed={feedbackCompleted}
                completedText="Submitted"
                pendingText="Pending"
                icon={MessageSquare}
              />
            </div>
          </section>

          {/* Team Profile */}
          <section className="rounded-2xl border border-white/10 bg-[#111827] p-6">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Team Profile
            </p>

            <div className="mt-6 flex items-center gap-4">
              {team.group_photo_url ? (
                <img
                  src={team.group_photo_url}
                  alt={`${team.team_name} group`}
                  className="h-14 w-14 rounded-2xl object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-base font-bold text-[#111827]">
                  {team.team_name
                    .split(' ')
                    .map((word) => word[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
              )}

              <div className="min-w-0">
                <h2 className="truncate text-lg font-semibold text-white">
                  {team.team_name}
                </h2>

                <p className="mt-1 truncate text-xs text-gray-500">
                  {team.team_code}
                </p>
              </div>
            </div>

            <div className="mt-7 space-y-5">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-gray-600">
                  Team Leader
                </p>

                <p className="mt-1 text-sm text-gray-300">
                  {team.leader_name}
                </p>
              </div>

              <div>
                <p className="text-[11px] uppercase tracking-wider text-gray-600">
                  Registered Email
                </p>

                <p className="mt-1 truncate text-sm text-gray-300">
                  {team.leader_email}
                </p>
              </div>

              <div>
                <p className="text-[11px] uppercase tracking-wider text-gray-600">
                  Status
                </p>

                <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />

                  <span className="text-xs text-gray-300">
                    Active
                  </span>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Group Photo */}
        {!team.group_photo_path && (
          <div className="mt-5">
            <GroupPhotoUpload
              currentPhotoUrl={team.group_photo_url}
              onUploadSuccess={handlePhotoUploadSuccess}
            />
          </div>
        )}

        {/* Selected problem */}
        {team.selected_problem && (
          <section className="mt-5 rounded-2xl border border-white/10 bg-[#111827] p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.05]">
                <Trophy
                  size={18}
                  className="text-gray-300"
                />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                  Selected Problem Statement
                </p>

                <h2 className="mt-2 text-lg font-semibold text-white">
                  {team.selected_problem.title}
                </h2>

                <p className="mt-2 max-w-4xl text-sm leading-6 text-gray-500">
                  {team.selected_problem.description}
                </p>
              </div>
              
            </div>
          </section>
        )}
      </div>
    </DashboardLayout>
  )
}