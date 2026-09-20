import { useEffect, useState } from 'react'
import {
  CheckCircle2,
  Clock3,
  ExternalLink,
  GitBranch,
  Image as ImageIcon,
  MessageSquare,
  Trophy,
} from 'lucide-react'
import { Link } from 'react-router-dom'

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

interface TeamMember {
  id: number
  name: string
  college: string
  year: string
  department: string
}

interface TeamFeedback {
  id: number
  rating: number
  comments: string
}

interface Team {
  id: number
  team_name: string
  college_name: string
  leader_name: string
  leader_email: string
  selected_problem: Problem | null
  group_photo_path: string | null
  group_photo_url: string | null
  repository_url: string | null
  repository_submitted_at: string | null
  members?: TeamMember[]
  feedback?: TeamFeedback | null
  created_at: string
}

interface Round {
  id: number
  name: string
  round_number: number
  is_active: boolean
}

interface LeaderboardEntry {
  rank: number
  team_id: number
  score: number
}

interface LeaderboardResponse {
  round: {
    id: number
    name: string
    round_number: number
  } | null
  entries: LeaderboardEntry[]
}

export default function Dashboard() {
  const [team, setTeam] = useState<Team | null>(null)
  const [activeRound, setActiveRound] = useState<Round | null>(null)
  const [teamRank, setTeamRank] = useState<number | null>(null)
  const [teamScore, setTeamScore] = useState<number | null>(null)
  const [leaderboardLoaded, setLeaderboardLoaded] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchTeam = async () => {
    try {
      setLoading(true)
      setError('')

      const [teamResponse, roundsResponse, leaderboardResponse] =
        await Promise.all([
          api.get<Team>('/teams/me'),
          api.get<Round[]>('/rounds'),
          api.get<LeaderboardResponse>('/leaderboard'),
        ])

      setTeam(teamResponse.data)

      setActiveRound(
        roundsResponse.data.find((round) => round.is_active) || null,
      )

      const entry = leaderboardResponse.data.entries.find(
        (e) => e.team_id === teamResponse.data.id,
      )

      if (entry) {
        setTeamRank(entry.rank)
        setTeamScore(entry.score)
      } else {
        setTeamRank(null)
        setTeamScore(null)
      }

      setLeaderboardLoaded(true)
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

  // Calculate milestones completed (Problem, Photo, Repo, Feedback)
  const completedCount = [
    Boolean(team.selected_problem),
    Boolean(team.group_photo_path),
    Boolean(team.repository_url),
    Boolean(team.feedback),
  ].filter(Boolean).length

  const progressPercent = Math.round((completedCount / 4) * 100)

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-[1400px]">
        {/* Page heading */}
        <div className="mb-8">
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-gray-500">
            Team Workspace
          </p>

          <h1 className="text-2xl font-semibold tracking-tight text-white lg:text-3xl">
            Dashboard
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Manage your hackathon participation and track your milestones in real-time.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {/* Team Info */}
          <div className="rounded-2xl border border-white/10 bg-[#111827] p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Team
            </p>

            <p className="mt-3 truncate text-lg font-semibold text-white">
              {team.team_name}
            </p>

            <p className="mt-1 truncate text-xs text-gray-500">
              {team.college_name}
            </p>
          </div>

          {/* Problem */}
          <div className="rounded-2xl border border-white/10 bg-[#111827] p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                Problem
              </p>
              <Link
                to="/problems"
                className="text-[11px] text-gray-400 hover:text-white"
              >
                View
              </Link>
            </div>

            {team.selected_problem ? (
              <>
                <p className="mt-3 text-lg font-semibold text-white">
                  Selected
                </p>

                <p className="mt-1 truncate text-xs text-gray-500">
                  {team.selected_problem.title}
                </p>
              </>
            ) : (
              <>
                <p className="mt-3 text-lg font-semibold text-gray-400">
                  Not selected
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  Choose a problem statement
                </p>
              </>
            )}
          </div>

          {/* Repository */}
          <div className="rounded-2xl border border-white/10 bg-[#111827] p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                Repository
              </p>
              <Link
                to="/repository-feedback"
                className="text-[11px] text-gray-400 hover:text-white"
              >
                Manage
              </Link>
            </div>

            {team.repository_url ? (
              <>
                <div className="mt-3 flex items-center gap-1.5 text-lg font-semibold text-emerald-400">
                  <CheckCircle2 size={18} />
                  <span>Submitted</span>
                </div>

                <a
                  href={team.repository_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 flex items-center gap-1 truncate text-xs text-gray-400 hover:text-white"
                >
                  <span className="truncate">{team.repository_url}</span>
                  <ExternalLink size={12} className="shrink-0" />
                </a>
              </>
            ) : (
              <>
                <p className="mt-3 text-lg font-semibold text-gray-400">
                  Pending
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  Submit GitHub repo link
                </p>
              </>
            )}
          </div>

          {/* Feedback */}
          <div className="rounded-2xl border border-white/10 bg-[#111827] p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                Feedback
              </p>
              <Link
                to="/repository-feedback"
                className="text-[11px] text-gray-400 hover:text-white"
              >
                Manage
              </Link>
            </div>

            {team.feedback ? (
              <>
                <div className="mt-3 flex items-center gap-1.5 text-lg font-semibold text-emerald-400">
                  <CheckCircle2 size={18} />
                  <span>{team.feedback.rating}/5 Stars</span>
                </div>

                <p className="mt-1 truncate text-xs text-gray-500">
                  Feedback recorded
                </p>
              </>
            ) : (
              <>
                <p className="mt-3 text-lg font-semibold text-gray-400">
                  Pending
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  Submit event feedback
                </p>
              </>
            )}
          </div>

          {/* Rank & Score */}
          <div className="rounded-2xl border border-white/10 bg-[#111827] p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                Rank
              </p>
              <Link
                to="/leaderboard"
                className="text-[11px] text-gray-400 hover:text-white"
              >
                Board
              </Link>
            </div>

            <p className="mt-3 text-lg font-semibold text-white">
              {leaderboardLoaded && teamRank !== null
                ? `#${teamRank}`
                : 'Not ranked yet'}
            </p>

            <p className="mt-1 text-xs text-gray-500">
              {teamScore !== null ? `Score: ${teamScore} pts` : (activeRound ? activeRound.name : 'No active round')}
            </p>
          </div>
        </div>

        {/* Progress + Profile */}
        <div className="mt-5 grid gap-5 lg:grid-cols-[1.4fr_0.6fr]">
          <section className="rounded-2xl border border-white/10 bg-[#111827] p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                  Hackathon Milestones
                </p>

                <h2 className="mt-2 text-xl font-semibold text-white">
                  Your Team Progress
                </h2>
              </div>

              <div className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-gray-400">
                {activeRound
                  ? `Round ${activeRound.round_number}: ${activeRound.name}`
                  : 'No active round'}
              </div>
            </div>

            {/* Overall Progress Bar */}
            <div className="mt-8">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  Deliverables completed ({completedCount} of 4)
                </span>

                <span className="text-xs font-medium text-white">
                  {progressPercent}%
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full bg-white transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* 4 Milestones */}
            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Link
                to="/problems"
                className="rounded-xl border border-white/10 bg-white/[0.02] p-4 transition-colors hover:bg-white/[0.04]"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">Problem</p>
                  {team.selected_problem ? (
                    <CheckCircle2 size={15} className="text-emerald-400" />
                  ) : (
                    <Clock3 size={15} className="text-gray-500" />
                  )}
                </div>

                <p className="mt-2 text-sm font-medium text-white">
                  {team.selected_problem ? 'Selected' : 'Pending'}
                </p>
              </Link>

              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">Group Photo</p>
                  {team.group_photo_path ? (
                    <ImageIcon size={15} className="text-emerald-400" />
                  ) : (
                    <Clock3 size={15} className="text-gray-500" />
                  )}
                </div>

                <p className="mt-2 text-sm font-medium text-white">
                  {team.group_photo_path ? 'Uploaded' : 'Pending'}
                </p>
              </div>

              <Link
                to="/repository-feedback"
                className="rounded-xl border border-white/10 bg-white/[0.02] p-4 transition-colors hover:bg-white/[0.04]"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">Repository</p>
                  {team.repository_url ? (
                    <GitBranch size={15} className="text-emerald-400" />
                  ) : (
                    <Clock3 size={15} className="text-gray-500" />
                  )}
                </div>

                <p className="mt-2 text-sm font-medium text-white">
                  {team.repository_url ? 'Submitted' : 'Pending'}
                </p>
              </Link>

              <Link
                to="/repository-feedback"
                className="rounded-xl border border-white/10 bg-white/[0.02] p-4 transition-colors hover:bg-white/[0.04]"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">Feedback</p>
                  {team.feedback ? (
                    <MessageSquare size={15} className="text-emerald-400" />
                  ) : (
                    <Clock3 size={15} className="text-gray-500" />
                  )}
                </div>

                <p className="mt-2 text-sm font-medium text-white">
                  {team.feedback ? 'Submitted' : 'Pending'}
                </p>
              </Link>
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
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-base font-bold text-[#000000]">
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
                  {team.college_name}
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

        {/* Group Photo Upload (Only shown if photo is not yet uploaded) */}
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
                <Trophy size={18} className="text-gray-300" />
              </div>

              <div className="min-w-0">
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