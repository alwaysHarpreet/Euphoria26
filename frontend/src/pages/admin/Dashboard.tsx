import {
  useEffect,
  useState,
} from 'react'

import {
  ClipboardCheck,
  GitBranch,
  Layers3,
  Loader2,
  MessageSquare,
  UserRoundCheck,
  Users,
} from 'lucide-react'

import AdminLayout from '../../components/layout/AdminLayout'
import api from '../../services/api'

interface ActiveRound {
  id: number
  name: string
  round_number: number
}

interface AdminOverview {
  total_teams: number
  total_evaluators: number
  total_rounds: number
  active_round: ActiveRound | null
  evaluations_submitted: number
  active_round_evaluated_teams: number
  active_round_pending_teams: number
}

interface FeatureStatus {
  repository_active: boolean
  feedback_active: boolean
  server_time: string
}

type FeatureName = 'repository' | 'feedback'

export default function AdminDashboard() {
  const [overview, setOverview] =
    useState<AdminOverview | null>(null)

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState('')

  const [features, setFeatures] =
    useState<FeatureStatus | null>(null)

  const [featureLoading, setFeatureLoading] =
    useState(true)

  const [featureError, setFeatureError] =
    useState('')

  const [togglingFeature, setTogglingFeature] =
    useState<FeatureName | null>(null)

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true)
        setError('')

        const response =
          await api.get<AdminOverview>(
            '/admin/overview',
          )

        setOverview(response.data)
      } catch (err: any) {
        const message =
          err?.response?.data?.detail ||
          'Unable to load admin dashboard.'

        setError(message)
      } finally {
        setLoading(false)
      }
    }

    const fetchFeatureStatus = async () => {
      try {
        setFeatureLoading(true)
        setFeatureError('')

        const response =
          await api.get<FeatureStatus>(
            '/admin/problems/release-status',
          )

        setFeatures(response.data)
      } catch (err: any) {
        const message =
          err?.response?.data?.detail ||
          'Unable to load feature controls.'

        setFeatureError(message)
      } finally {
        setFeatureLoading(false)
      }
    }

    fetchDashboard()
    fetchFeatureStatus()
  }, [])

  const toggleFeature = async (
    feature: FeatureName,
  ) => {
    if (!features || togglingFeature) {
      return
    }

    const currentValue =
      feature === 'repository'
        ? features.repository_active
        : features.feedback_active

    const nextValue = !currentValue

    try {
      setTogglingFeature(feature)
      setFeatureError('')

      const endpoint =
        feature === 'repository'
          ? '/admin/repository/toggle'
          : '/admin/feedback/toggle'

      const response =
        await api.post<FeatureStatus>(
          endpoint,
          {
            is_active: nextValue,
          },
        )

      setFeatures(response.data)
    } catch (err: any) {
      const message =
        err?.response?.data?.detail ||
        `Unable to update ${
          feature === 'repository'
            ? 'repository'
            : 'feedback'
        } status.`

      setFeatureError(message)
    } finally {
      setTogglingFeature(null)
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2
            size={22}
            className="animate-spin text-gray-500"
          />
        </div>
      </AdminLayout>
    )
  }

  if (error || !overview) {
    return (
      <AdminLayout>
        <div className="mx-auto max-w-[1400px]">
          <div className="rounded-2xl border border-white/10 bg-[#111827] p-6">
            <p className="text-sm text-gray-300">
              {error ||
                'Unable to load dashboard.'}
            </p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  const evaluationProgress =
    overview.total_teams > 0
      ? Math.round(
          (overview.active_round_evaluated_teams /
            overview.total_teams) *
            100,
        )
      : 0

  return (
    <AdminLayout>
      <div className="mx-auto max-w-[1400px]">

        {/* Header */}
        <div className="mb-8">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.16em] text-gray-600">
            Admin Workspace
          </p>

          <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Dashboard
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Monitor teams, rounds, evaluators,
            and evaluation progress.
          </p>
        </div>

        {/* Statistics */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

          {/* Teams */}
          <div className="rounded-2xl border border-white/10 bg-[#111827] p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-500">
                  Total Teams
                </p>

                <p className="mt-3 text-3xl font-semibold tracking-tight text-white">
                  {overview.total_teams}
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.05]">
                <Users
                  size={18}
                  strokeWidth={1.8}
                  className="text-gray-400"
                />
              </div>
            </div>

            <p className="mt-4 text-[11px] text-gray-600">
              Registered teams
            </p>
          </div>

          {/* Evaluators */}
          <div className="rounded-2xl border border-white/10 bg-[#111827] p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-500">
                  Evaluators
                </p>

                <p className="mt-3 text-3xl font-semibold tracking-tight text-white">
                  {overview.total_evaluators}
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.05]">
                <UserRoundCheck
                  size={18}
                  strokeWidth={1.8}
                  className="text-gray-400"
                />
              </div>
            </div>

            <p className="mt-4 text-[11px] text-gray-600">
              Evaluation accounts
            </p>
          </div>

          {/* Active round */}
          <div className="rounded-2xl border border-white/10 bg-[#111827] p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-500">
                  Active Round
                </p>

                <p className="mt-3 text-2xl font-semibold tracking-tight text-white">
                  {overview.active_round
                    ? `Round ${overview.active_round.round_number}`
                    : 'None'}
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.05]">
                <Layers3
                  size={18}
                  strokeWidth={1.8}
                  className="text-gray-400"
                />
              </div>
            </div>

            <p className="mt-4 truncate text-[11px] text-gray-600">
              {overview.active_round
                ? overview.active_round.name
                : 'No active round'}
            </p>
          </div>

          {/* Evaluations */}
          <div className="rounded-2xl border border-white/10 bg-[#111827] p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-500">
                  Evaluations Submitted
                </p>

                <p className="mt-3 text-3xl font-semibold tracking-tight text-white">
                  {overview.evaluations_submitted}
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.05]">
                <ClipboardCheck
                  size={18}
                  strokeWidth={1.8}
                  className="text-gray-400"
                />
              </div>
            </div>

            <p className="mt-4 text-[11px] text-gray-600">
              Across all rounds
            </p>
          </div>
        </div>

        {/* Dashboard content */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">

          {/* Evaluation Progress */}
          <div className="rounded-2xl border border-white/10 bg-[#111827] p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-500">
                  Current Round
                </p>

                <h3 className="mt-1 text-base font-semibold text-white">
                  Evaluation Progress
                </h3>
              </div>

              <span className="text-2xl font-semibold text-white">
                {evaluationProgress}%
              </span>
            </div>

            <div className="mt-6">
              <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full bg-white transition-all duration-500"
                  style={{
                    width: `${evaluationProgress}%`,
                  }}
                />
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-4">

              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <p className="text-[11px] text-gray-600">
                  Evaluated
                </p>

                <p className="mt-2 text-xl font-semibold text-white">
                  {
                    overview.active_round_evaluated_teams
                  }
                </p>

                <p className="mt-1 text-[10px] text-gray-600">
                  teams
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <p className="text-[11px] text-gray-600">
                  Pending
                </p>

                <p className="mt-2 text-xl font-semibold text-white">
                  {
                    overview.active_round_pending_teams
                  }
                </p>

                <p className="mt-1 text-[10px] text-gray-600">
                  teams
                </p>
              </div>

            </div>
          </div>

          {/* Active Round */}
          <div className="rounded-2xl border border-white/10 bg-[#111827] p-6">

            <p className="text-xs text-gray-500">
              Round Status
            </p>

            <h3 className="mt-1 text-base font-semibold text-white">
              Active Round
            </h3>

            {overview.active_round ? (
              <div className="mt-6">

                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.05]">
                    <Layers3
                      size={19}
                      strokeWidth={1.8}
                      className="text-gray-400"
                    />
                  </div>

                  <div>
                    <p className="text-sm font-medium text-white">
                      {
                        overview.active_round.name
                      }
                    </p>

                    <p className="mt-0.5 text-[11px] text-gray-600">
                      Round{' '}
                      {
                        overview.active_round
                          .round_number
                      }
                    </p>
                  </div>
                </div>

                <div className="mt-6 border-t border-white/10 pt-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      Team evaluation status
                    </span>

                    <span className="text-xs font-medium text-gray-300">
                      {
                        overview.active_round_evaluated_teams
                      }{' '}
                      / {overview.total_teams}
                    </span>
                  </div>

                  <p className="mt-2 text-[11px] leading-5 text-gray-600">
                    Teams disappear from evaluator
                    portals once an evaluation is
                    submitted for this round.
                  </p>
                </div>

              </div>
            ) : (
              <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.02] p-5">
                <p className="text-sm text-gray-400">
                  No round is currently active.
                </p>

                <p className="mt-1 text-[11px] text-gray-600">
                  Activate a round from the Rounds
                  section.
                </p>
              </div>
            )}

          </div>
        </div>

        {/* ========================================================= */}
        {/* EVENT FEATURE CONTROLS */}
        {/* ========================================================= */}
        <div className="mt-6 rounded-2xl border border-white/10 bg-[#111827] p-6">

          <div className="mb-6">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-gray-500">
              Event Controls
            </p>

            <h3 className="mt-1 text-base font-semibold text-white">
              Team Features
            </h3>

            <p className="mt-1 text-[11px] leading-5 text-gray-600">
              Activate or deactivate team submissions independently.
            </p>
          </div>

          {featureError && (
            <div className="mb-5 rounded-xl border border-red-400/20 bg-red-400/[0.05] px-4 py-3 text-sm text-red-300">
              {featureError}
            </div>
          )}

          {featureLoading ? (
            <div className="flex min-h-[140px] items-center justify-center">
              <Loader2
                size={20}
                className="animate-spin text-gray-500"
              />
            </div>
          ) : features ? (
            <div className="grid gap-4 md:grid-cols-2">

              {/* Repository */}
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
                <div className="flex items-start justify-between gap-4">

                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.05]">
                      <GitBranch
                        size={18}
                        strokeWidth={1.8}
                        className="text-gray-400"
                      />
                    </div>

                    <div>
                      <p className="text-sm font-medium text-white">
                        Repository Submission
                      </p>

                      <p className="mt-1 text-[11px] leading-5 text-gray-600">
                        Allow teams to submit or update their project repository.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      toggleFeature('repository')
                    }
                    disabled={
                      togglingFeature === 'repository'
                    }
                    aria-pressed={
                      features.repository_active
                    }
                    aria-label={
                      features.repository_active
                        ? 'Deactivate repository submission'
                        : 'Activate repository submission'
                    }
                    className={`relative h-7 w-12 shrink-0 rounded-full border transition ${
                      features.repository_active
                        ? 'border-emerald-400/30 bg-emerald-400/20'
                        : 'border-white/10 bg-white/[0.06]'
                    } ${
                      togglingFeature === 'repository'
                        ? 'cursor-wait opacity-60'
                        : 'cursor-pointer'
                    }`}
                  >
                    <span
                      className={`absolute top-1 h-5 w-5 rounded-full transition-all ${
                        features.repository_active
                          ? 'left-6 bg-emerald-400'
                          : 'left-1 bg-gray-500'
                      }`}
                    />
                  </button>

                </div>

                <div className="mt-5 flex items-center justify-between border-t border-white/[0.06] pt-4">

                  <span
                    className={`text-xs font-medium ${
                      features.repository_active
                        ? 'text-emerald-300'
                        : 'text-gray-500'
                    }`}
                  >
                    {features.repository_active
                      ? 'Active'
                      : 'Inactive'}
                  </span>

                  <span className="text-[10px] text-gray-600">
                    Team portal
                  </span>

                </div>
              </div>

              {/* Feedback */}
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
                <div className="flex items-start justify-between gap-4">

                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.05]">
                      <MessageSquare
                        size={18}
                        strokeWidth={1.8}
                        className="text-gray-400"
                      />
                    </div>

                    <div>
                      <p className="text-sm font-medium text-white">
                        Hackathon Feedback
                      </p>

                      <p className="mt-1 text-[11px] leading-5 text-gray-600">
                        Allow teams to submit or update their event feedback.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      toggleFeature('feedback')
                    }
                    disabled={
                      togglingFeature === 'feedback'
                    }
                    aria-pressed={
                      features.feedback_active
                    }
                    aria-label={
                      features.feedback_active
                        ? 'Deactivate feedback submission'
                        : 'Activate feedback submission'
                    }
                    className={`relative h-7 w-12 shrink-0 rounded-full border transition ${
                      features.feedback_active
                        ? 'border-emerald-400/30 bg-emerald-400/20'
                        : 'border-white/10 bg-white/[0.06]'
                    } ${
                      togglingFeature === 'feedback'
                        ? 'cursor-wait opacity-60'
                        : 'cursor-pointer'
                    }`}
                  >
                    <span
                      className={`absolute top-1 h-5 w-5 rounded-full transition-all ${
                        features.feedback_active
                          ? 'left-6 bg-emerald-400'
                          : 'left-1 bg-gray-500'
                      }`}
                    />
                  </button>

                </div>

                <div className="mt-5 flex items-center justify-between border-t border-white/[0.06] pt-4">

                  <span
                    className={`text-xs font-medium ${
                      features.feedback_active
                        ? 'text-emerald-300'
                        : 'text-gray-500'
                    }`}
                  >
                    {features.feedback_active
                      ? 'Active'
                      : 'Inactive'}
                  </span>

                  <span className="text-[10px] text-gray-600">
                    Team portal
                  </span>

                </div>
              </div>

            </div>
          ) : null}
        </div>

      </div>
    </AdminLayout>
  )
}