import { useEffect, useState } from 'react'
import {
  CheckCircle2,
  Loader2,
  UserRound,
} from 'lucide-react'
import {
  Navigate,
  useNavigate,
  useParams,
} from 'react-router-dom'

import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import EvaluatorLayout from '../../components/layout/EvaluatorLayout'

interface Team {
  id: number
  team_name: string
  college_name: string
  leader_name: string
  group_photo_url: string | null
}

interface Round {
  id: number
  name: string
  round_number: number
  description: string | null
  is_active: boolean
  created_at: string
}

export default function Evaluation() {
  const { role } = useAuth()
  const navigate = useNavigate()
  const { roundId, teamId } = useParams()

  const [team, setTeam] = useState<Team | null>(null)
  const [round, setRound] = useState<Round | null>(null)

  const [score, setScore] = useState('')
  const [remarks, setRemarks] = useState('')

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (role !== 'evaluator') {
    return <Navigate to="/dashboard" replace />
  }

  const loadData = async () => {
    try {
      setLoading(true)
      setError('')

      if (!roundId || !teamId) {
        setError('Invalid evaluation URL.')
        return
      }

      const [roundsResponse, teamsResponse] =
        await Promise.all([
          api.get('/rounds'),
          api.get(`/evaluator/rounds/${roundId}/teams`),
        ])

      const selectedRound = roundsResponse.data.find(
        (item: Round) => item.id === Number(roundId),
      )

      const selectedTeam = teamsResponse.data.find(
        (item: Team) => item.id === Number(teamId),
      )

      if (!selectedRound) {
        setError('Round not found.')
        return
      }

      if (!selectedTeam) {
        setError(
          'This team is no longer available for evaluation.',
        )
        return
      }

      setRound(selectedRound)
      setTeam(selectedTeam)
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
          'Unable to load evaluation details.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [roundId, teamId])

  const handleSubmit = async () => {
    setError('')

    const numericScore = Number(score)

    if (score.trim() === '') {
      setError('Please enter a score.')
      return
    }

    if (
      !Number.isInteger(numericScore) ||
      numericScore < 0 ||
      numericScore > 100
    ) {
      setError('Score must be a whole number between 0 and 100.')
      return
    }

    if (!roundId || !teamId) {
      setError('Invalid evaluation details.')
      return
    }

    try {
      setSubmitting(true)

      await api.post(
        `/evaluator/rounds/${roundId}/teams/${teamId}/evaluation`,
        {
          score: numericScore,
          remarks:
            remarks.trim() === ''
              ? null
              : remarks.trim(),
        },
      )

      navigate('/evaluator/dashboard', {
        replace: true,
      })
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
          'Unable to submit evaluation.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <EvaluatorLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <Loader2
            size={18}
            className="animate-spin"
          />
          Loading evaluation...
        </div>
        </div>
      </EvaluatorLayout>
    )
  }

  return (
    <EvaluatorLayout>
      <div className="mx-auto max-w-5xl">

        {/* Heading */}
        <div className="mb-8">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.16em] text-gray-600">
            {round
              ? `Round ${round.round_number}`
              : 'Evaluation'}
          </p>

          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Team Evaluation
          </h2>

          {round?.description && (
            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
              {round.description}
            </p>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <p className="text-xs leading-5 text-gray-300">
              {error}
            </p>
          </div>
        )}

        {team && (
          <div className="grid gap-6 lg:grid-cols-[1fr_1.15fr]">

            {/* Team details */}
            <section className="rounded-xl border border-white/10 bg-[#111827] p-6">

              <div className="mb-6 flex items-center gap-2">
                <UserRound
                  size={16}
                  className="text-gray-500"
                />

                <h3 className="text-sm font-semibold">
                  Team Details
                </h3>
              </div>

              {/* Photo */}
              <div className="mb-6 overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] aspect-square max-h-[420px]">
                {team.group_photo_url ? (
                  <img
                    src={team.group_photo_url}
                    alt={team.team_name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full min-h-[280px] items-center justify-center">
                    <span className="text-3xl font-semibold text-gray-700">
                      {team.team_name
                        .slice(0, 2)
                        .toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-[0.12em] text-gray-600">
                  Team
                </p>

                <h3 className="mt-1 text-lg font-semibold">
                  {team.team_name}
                </h3>
              </div>

              <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-1">

                <div>
                  <p className="text-[10px] uppercase tracking-[0.12em] text-gray-600">
                    College
                  </p>

                  <p className="mt-1 text-sm text-gray-400">
                    {team.college_name}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] uppercase tracking-[0.12em] text-gray-600">
                    Team Leader
                  </p>

                  <p className="mt-1 text-sm text-gray-400">
                    {team.leader_name}
                  </p>
                </div>

              </div>

            </section>

            {/* Evaluation form */}
            <section className="rounded-xl border border-white/10 bg-[#111827] p-6">

              <div className="mb-7">
                <h3 className="text-sm font-semibold">
                  Submit Evaluation
                </h3>

                <p className="mt-1 text-xs leading-5 text-gray-600">
                  Enter the team's score and any relevant remarks.
                </p>
              </div>

              <div className="space-y-6">

                {/* Score */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label
                      htmlFor="score"
                      className="text-xs font-medium text-gray-400"
                    >
                      Score
                    </label>

                    <span className="text-[10px] text-gray-600">
                      0–100
                    </span>
                  </div>

                  <input
                    id="score"
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={score}
                    onChange={(event) =>
                      setScore(event.target.value)
                    }
                    placeholder="Enter score"
                    disabled={submitting}
                    className="h-12 w-full rounded-xl border border-white/10 bg-[#111827] px-4 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-white/25 focus:ring-1 focus:ring-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>

                {/* Remarks */}
                <div>
                  <label
                    htmlFor="remarks"
                    className="mb-2 block text-xs font-medium text-gray-400"
                  >
                    Remarks
                  </label>

                  <textarea
                    id="remarks"
                    value={remarks}
                    onChange={(event) =>
                      setRemarks(event.target.value)
                    }
                    placeholder="Add evaluation remarks..."
                    rows={7}
                    disabled={submitting}
                    className="w-full resize-none rounded-xl border border-white/10 bg-[#111827] px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-gray-600 focus:border-white/25 focus:ring-1 focus:ring-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>

                {/* Submit */}
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-[#000000] transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2
                        size={16}
                        className="animate-spin"
                      />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      Submit Evaluation
                    </>
                  )}
                </button>

                <p className="text-center text-[10px] leading-5 text-gray-600">
                  Once submitted, this team will no longer be available
                  for evaluation in this round.
                </p>

              </div>

            </section>

          </div>
        )}

        {!team && !error && (
          <div className="rounded-xl border border-white/10 bg-[#111827] p-12 text-center">
            <p className="text-sm text-gray-500">
              Team information could not be loaded.
            </p>
          </div>
        )}

      </div>
    </EvaluatorLayout>
  )
}