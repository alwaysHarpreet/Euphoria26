import { useEffect, useState } from 'react'
import {
  ClipboardCheck,
  RefreshCw,
  Users,
} from 'lucide-react'
import {
  Navigate,
  useNavigate,
} from 'react-router-dom'

import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import EvaluatorLayout from '../../components/layout/EvaluatorLayout'

interface Round {
  id: number
  name: string
  round_number: number
  description: string | null
  is_active: boolean
  created_at: string
}

interface Team {
  id: number
  team_name: string
  college_name: string
  leader_name: string
  group_photo_url: string | null
}

export default function EvaluatorDashboard() {
  const { role } = useAuth()
  const navigate = useNavigate()

  const [rounds, setRounds] = useState<Round[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedRound, setSelectedRound] = useState<number | null>(null)

  const [loadingRounds, setLoadingRounds] = useState(true)
  const [loadingTeams, setLoadingTeams] = useState(false)
  const [error, setError] = useState('')

  if (role !== 'evaluator') {
    return <Navigate to="/dashboard" replace />
  }

  const loadRounds = async () => {
    try {
      setLoadingRounds(true)
      setError('')

      const response = await api.get('/rounds')

      const roundData: Round[] = response.data

      setRounds(roundData)

      const activeRound = roundData.find(
        (round) => round.is_active,
      )

      if (activeRound) {
        setSelectedRound(activeRound.id)
      } else {
        setSelectedRound(null)
        setTeams([])
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
          'Unable to load rounds.',
      )
    } finally {
      setLoadingRounds(false)
    }
  }

  const loadTeams = async (roundId: number) => {
    try {
      setLoadingTeams(true)
      setError('')

      const response = await api.get(
        `/evaluator/rounds/${roundId}/teams`,
      )

      setTeams(response.data)
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
          'Unable to load teams.',
      )

      setTeams([])
    } finally {
      setLoadingTeams(false)
    }
  }

  useEffect(() => {
    loadRounds()
  }, [])

  useEffect(() => {
    if (selectedRound !== null) {
      loadTeams(selectedRound)
    }
  }, [selectedRound])

  const handleRefresh = () => {
    if (selectedRound !== null) {
      loadTeams(selectedRound)
    }
  }

  const activeRound = rounds.find(
    (round) => round.id === selectedRound,
  )

  return (
    <EvaluatorLayout>
      <div className="mx-auto max-w-7xl">

        {/* Page heading */}
        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">

          <div>
            <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.16em] text-gray-600">
              Evaluation Workspace
            </p>

            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Evaluator Dashboard
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Review participating teams and submit round-wise evaluations.
            </p>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={
              loadingTeams || selectedRound === null
            }
            className="flex h-10 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-4 text-xs font-medium text-gray-400 transition hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            <RefreshCw
              size={14}
              className={
                loadingTeams
                  ? 'animate-spin'
                  : ''
              }
            />
            Refresh
          </button>

        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <p className="text-xs leading-5 text-gray-300">
              {error}
            </p>
          </div>
        )}

        {/* Rounds */}
        <section className="mb-8">

          <div className="mb-4 flex items-center gap-2">
            <ClipboardCheck
              size={16}
              className="text-gray-500"
            />

            <h3 className="text-sm font-semibold">
              Rounds
            </h3>
          </div>

          {loadingRounds ? (
            <div className="rounded-xl border border-white/10 bg-[#111827] p-5">
              <div className="h-4 w-32 animate-pulse rounded bg-white/10" />
            </div>
          ) : rounds.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-[#111827] p-8 text-center">
              <p className="text-sm text-gray-500">
                No rounds have been created yet.
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              {rounds.map((round) => {
                const selected =
                  selectedRound === round.id

                return (
                  <button
                    key={round.id}
                    type="button"
                    onClick={() =>
                      setSelectedRound(round.id)
                    }
                    className={`rounded-xl border px-5 py-3 text-left transition ${
                      selected
                        ? 'border-white/25 bg-white text-[#000000]'
                        : 'border-white/10 bg-[#111827] text-gray-400 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">

                      <span className="text-[10px] font-semibold uppercase tracking-wider opacity-60">
                        R{round.round_number}
                      </span>

                      <span className="text-sm font-medium">
                        {round.name}
                      </span>

                      {round.is_active && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[9px] font-medium ${
                            selected
                              ? 'bg-[#111827]/10'
                              : 'bg-white/10 text-gray-300'
                          }`}
                        >
                          Active
                        </span>
                      )}

                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {!loadingRounds &&
            rounds.length > 0 &&
            selectedRound === null && (
              <div className="mt-4 rounded-xl border border-white/10 bg-[#111827] p-6 text-center">
                <p className="text-sm text-gray-300">
                  No active round is currently available.
                </p>
                <p className="mt-2 text-xs text-gray-600">
                  Please wait for an administrator to activate a round.
                </p>
              </div>
            )}

        </section>

        {/* Teams */}
        <section>

          <div className="mb-4 flex items-end justify-between">

            <div>
              <div className="flex items-center gap-2">
                <Users
                  size={16}
                  className="text-gray-500"
                />

                <h3 className="text-sm font-semibold">
                  Available Teams
                </h3>
              </div>

              {activeRound && (
                <p className="mt-1 text-xs text-gray-600">
                  {activeRound.name}
                  {activeRound.is_active
                    ? ' • Active round'
                    : ' • Inactive round'}
                </p>
              )}
            </div>

            <span className="text-xs text-gray-600">
              {teams.length} team
              {teams.length !== 1 ? 's' : ''}
            </span>

          </div>

          {loadingTeams ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-36 animate-pulse rounded-xl border border-white/10 bg-[#111827]"
                />
              ))}
            </div>
          ) : teams.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-[#111827] px-6 py-14 text-center">

              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.04]">
                <Users
                  size={20}
                  className="text-gray-600"
                />
              </div>

              <h4 className="text-sm font-medium text-gray-300">
                No teams available
              </h4>

              <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-gray-600">
                All teams may have already been evaluated for this round.
              </p>

            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">

              {teams.map((team) => (
                <div
                  key={team.id}
                  onClick={() =>
                    navigate(
                      `/evaluator/rounds/${selectedRound}/teams/${team.id}/evaluate`,
                    )
                  }
                  className="group cursor-pointer rounded-xl border border-white/10 bg-[#111827] p-5 transition hover:border-white/20"
                >

                  <div className="flex items-start gap-4">

                    {/* Team photo */}
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]">

                      {team.group_photo_url ? (
                        <img
                          src={team.group_photo_url}
                          alt={team.team_name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-gray-600">
                          {team.team_name
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                      )}

                    </div>

                    {/* Team information */}
                    <div className="min-w-0 flex-1">

                      <h4 className="truncate text-sm font-semibold text-gray-200">
                        {team.team_name}
                      </h4>

                      <p className="mt-1 truncate text-xs text-gray-500">
                        {team.college_name}
                      </p>

                    </div>

                  </div>

                  <div className="mt-5 border-t border-white/10 pt-4">

                    <p className="text-[10px] uppercase tracking-[0.12em] text-gray-600">
                      Team Leader
                    </p>

                    <p className="mt-1 text-xs text-gray-400">
                      {team.leader_name}
                    </p>

                  </div>

                  <div className="mt-4 flex items-center justify-end">
                    <span className="text-[10px] font-medium text-gray-600 transition group-hover:text-gray-300">
                      Evaluate →
                    </span>
                  </div>

                </div>
              ))}

            </div>
          )}

        </section>

      </div>
    </EvaluatorLayout>
  )
}