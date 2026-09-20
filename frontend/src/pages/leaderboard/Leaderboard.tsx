import {
  Crown,
  RefreshCw,
  Search,
  Trophy,
} from 'lucide-react'

import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import DashboardLayout from '../../components/layout/DashboardLayout'

interface LeaderboardRound {
  id: number
  name: string
  round_number: number
}

interface LeaderboardEntry {
  rank: number
  team_id: number
  team_name: string
  college_name: string
  group_photo_url: string | null
  score: number
  status: string
}

interface LeaderboardResponse {
  round: LeaderboardRound | null
  updated_at: string | null
  entries: LeaderboardEntry[]
  message?: string | null
}

interface RoundOption {
  id: number
  name: string
  round_number: number
  is_active: boolean
}

function getErrorMessage(error: unknown) {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error
  ) {
    const response = error.response

    if (
      typeof response === 'object' &&
      response !== null &&
      'data' in response
    ) {
      const data = response.data

      if (
        typeof data === 'object' &&
        data !== null &&
        'detail' in data &&
        typeof data.detail === 'string'
      ) {
        return data.detail
      }
    }
  }

  return 'Unable to load leaderboard.'
}

function initials(teamName: string) {
  return teamName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

function formatUpdatedAt(value: string | null) {
  if (!value) {
    return 'Not updated yet'
  }

  return `Updated ${new Date(value).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })}`
}

export default function Leaderboard() {
  const { role } = useAuth()

  if (role === 'team') {
    return (
      <DashboardLayout>
        <LeaderboardContent />
      </DashboardLayout>
    )
  }

  return <LeaderboardContent />
}

function LeaderboardContent() {
  const [rounds, setRounds] = useState<RoundOption[]>([])
  const [roundId, setRoundId] = useState('')
  const [leaderboard, setLeaderboard] =
    useState<LeaderboardResponse | null>(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [live, setLive] = useState(false)

  const isOverall = roundId === 'overall'

  const fetchLeaderboard = (selectedRoundId?: string) => {
    if (selectedRoundId === 'overall') {
      return api.get<LeaderboardResponse>(
        '/leaderboard',
        {
          params: {
            overall: true,
          },
        },
      )
    }

    return api.get<LeaderboardResponse>(
      '/leaderboard',
      selectedRoundId
        ? { params: { round_id: selectedRoundId } }
        : undefined,
    )
  }

  const refreshLeaderboard = (selectedRoundId?: string) => {
    setError('')

    fetchLeaderboard(selectedRoundId)
      .then((response) => {
        setLeaderboard(response.data)
      })
      .catch((requestError) => {
        setError(getErrorMessage(requestError))
      })
      .finally(() => {
        setLoading(false)
      })
  }

  useEffect(() => {
    api.get<RoundOption[]>('/rounds')
      .then((response) => {
        setRounds(response.data)

        const activeRound = response.data.find(
          (round) => round.is_active,
        )

        if (activeRound) {
          setRoundId(activeRound.id.toString())
        }
      })
      .catch(() => {
        setRounds([])
      })

    fetchLeaderboard()
      .then((response) => {
        setLeaderboard(response.data)
        setLoading(false)
      })
      .catch((requestError) => {
        setError(getErrorMessage(requestError))
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    if (!roundId) {
      return
    }

    setLoading(true)
    setError('')

    fetchLeaderboard(roundId)
      .then((response) => {
        setLeaderboard(response.data)
      })
      .catch((requestError) => {
        setError(getErrorMessage(requestError))
      })
      .finally(() => {
        setLoading(false)
      })
  }, [roundId])

  useEffect(() => {
    if (!roundId || isOverall) {
      setLive(false)
      return
    }

    const websocketBaseUrl = api.defaults.baseURL
      ?.replace(/^http:/, 'ws:')
      .replace(/^https:/, 'wss:')

    if (!websocketBaseUrl) {
      return
    }

    let websocket: WebSocket | null = null
    let reconnectTimer: number | undefined
    let stopped = false

    const connect = () => {
      if (stopped) {
        return
      }

      websocket = new WebSocket(
        `${websocketBaseUrl}/ws/leaderboard/${roundId}`,
      )

      websocket.onopen = () => {
        setLive(true)
      }

      websocket.onclose = () => {
        setLive(false)

        if (!stopped) {
          reconnectTimer = window.setTimeout(
            connect,
            3000,
          )
        }
      }

      websocket.onerror = () => {
        setLive(false)
      }

      websocket.onmessage = () => {
        setError('')

        fetchLeaderboard(roundId)
          .then((response) => {
            setLeaderboard(response.data)
          })
          .catch((requestError) => {
            setError(getErrorMessage(requestError))
          })
      }
    }

    connect()

    return () => {
      stopped = true

      if (reconnectTimer !== undefined) {
        window.clearTimeout(reconnectTimer)
      }

      websocket?.close()
      setLive(false)
    }
  }, [roundId, isOverall])

  const filteredEntries = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    if (!normalizedSearch) {
      return leaderboard?.entries ?? []
    }

    return (leaderboard?.entries ?? []).filter(
      (entry) =>
        entry.team_name
          .toLowerCase()
          .includes(normalizedSearch) ||
        entry.college_name
          .toLowerCase()
          .includes(normalizedSearch),
    )
  }, [leaderboard, search])

  const podiumEntries = [
    leaderboard?.entries.find(
      (entry) => entry.rank === 2,
    ),
    leaderboard?.entries.find(
      (entry) => entry.rank === 1,
    ),
    leaderboard?.entries.find(
      (entry) => entry.rank === 3,
    ),
  ]

  const selectedRound = leaderboard?.round

  return (
    <div className="min-h-screen bg-[#0b0f19] text-white">
      <main className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-10 lg:py-10">

        {/* HEADER */}
        <header className="grid grid-cols-1 gap-6 border-b border-white/10 pb-7 lg:grid-cols-[1fr_auto_1fr] lg:items-center">

          {/* Left spacer */}
          <div className="hidden lg:block" />

          {/* Center content */}
          <div className="flex flex-col items-center text-center">
            <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-gray-500">
              LIVE LEADERBOARD
            </span>

            <h1 className="mt-5 text-3xl font-semibold tracking-tight sm:text-5xl">
              {isOverall
                ? 'Overall Leaderboard'
                : selectedRound
                  ? `Round ${selectedRound.round_number}`
                  : 'Leaderboard'}
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              {isOverall
                ? 'Combined scores across all completed evaluations'
                : selectedRound?.name ||
                  'Round-wise evaluation rankings'}
            </p>
          </div>

          {/* Right controls */}
          <div className="flex items-center justify-center gap-3 lg:justify-end">
            <select
              value={roundId}
              onChange={(event) =>
                setRoundId(event.target.value)
              }
              className="rounded-xl border border-white/10 bg-[#111827] px-4 py-2.5 text-sm text-gray-300 outline-none focus:border-white/25"
              aria-label="Select leaderboard"
            >
              <option value="overall">
                Overall
              </option>

              <option value="">
                Active round
              </option>

              {rounds.map((round) => (
                <option
                  key={round.id}
                  value={round.id}
                >
                  Round {round.round_number}: {round.name}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#111827] px-3 py-2.5 text-xs text-gray-400">
              <span
                className={`h-2 w-2 rounded-full ${
                  live
                    ? 'animate-pulse bg-emerald-400'
                    : 'bg-gray-600'
                }`}
              />

              {live ? 'LIVE' : 'Reconnecting...'}
            </div>
          </div>
        </header>

        {/* CONTENT */}
        {loading ? (
          <LoadingState />
        ) : error ? (
          <div className="mt-8 rounded-2xl border border-white/10 bg-[#111827] p-8 text-center">
            <p className="text-sm text-gray-300">
              Unable to load leaderboard
            </p>

            <p className="mt-2 text-xs text-gray-600">
              {error}
            </p>

            <button
              type="button"
              onClick={() =>
                refreshLeaderboard(
                  roundId || undefined,
                )
              }
              className="mt-5 inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/[0.05] hover:text-white"
            >
              <RefreshCw size={15} />
              Retry
            </button>
          </div>
        ) : !isOverall && !selectedRound ? (
          <div className="mt-8 rounded-2xl border border-white/10 bg-[#111827] p-10 text-center">
            <p className="text-lg font-medium text-white">
              Leaderboard unavailable
            </p>

            <p className="mt-2 text-sm text-gray-500">
              No round is currently active.
            </p>
          </div>
        ) : (
          <>
            {/* PODIUM */}
            {leaderboard?.entries.length ? (
              <Podium
                entries={podiumEntries}
                isOverall={isOverall}
              />
            ) : (
              <div className="mt-8 rounded-2xl border border-white/10 bg-[#111827] p-10 text-center">
                <Trophy
                  size={30}
                  className="mx-auto text-gray-600"
                />

                <p className="mt-4 text-lg font-medium text-white">
                  No rankings yet
                </p>

                <p className="mt-2 text-sm text-gray-500">
                  {isOverall
                    ? 'No submitted evaluations are available yet.'
                    : 'Evaluation is currently in progress.'}
                </p>
              </div>
            )}

            {/* RANKINGS */}
            <section className="mt-8">
              <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-gray-600">
                    {isOverall
                      ? 'Overall Rankings'
                      : 'Rankings'}
                  </p>

                  <p className="mt-1 text-sm text-gray-400">
                    {formatUpdatedAt(
                      leaderboard?.updated_at ?? null,
                    )}
                  </p>
                </div>

                <div className="relative w-full sm:max-w-xs">
                  <Search
                    size={16}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-600"
                  />

                  <input
                    type="search"
                    value={search}
                    onChange={(event) =>
                      setSearch(event.target.value)
                    }
                    placeholder="Search teams..."
                    className="w-full rounded-xl border border-white/10 bg-[#111827] py-2.5 pl-9 pr-4 text-sm text-white outline-none placeholder:text-gray-600 focus:border-white/25"
                  />
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#111827]">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px] text-left text-sm">
                    <thead className="border-b border-white/10 text-[11px] uppercase tracking-[0.14em] text-gray-600">
                      <tr>
                        <th className="w-20 px-6 py-4 font-medium">
                          Rank
                        </th>

                        <th className="px-6 py-4 font-medium">
                          Team
                        </th>

                        <th className="px-6 py-4 font-medium">
                          College
                        </th>

                        <th className="w-56 px-6 py-4 font-medium">
                          Score
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-white/[0.06]">
                      {filteredEntries.map(
                        (entry) => (
                          <RankingRow
                            key={entry.team_id}
                            entry={entry}
                            isOverall={isOverall}
                          />
                        ),
                      )}
                    </tbody>
                  </table>
                </div>

                {!filteredEntries.length && (
                  <p className="px-6 py-10 text-center text-sm text-gray-500">
                    No teams match your search.
                  </p>
                )}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  )
}

function Podium({
  entries,
  isOverall,
}: {
  entries: (LeaderboardEntry | undefined)[]
  isOverall: boolean
}) {
  return (
    <section className="mt-10 flex items-end justify-center gap-2 sm:gap-4 lg:gap-8">
      <PodiumEntry
        entry={entries[0]}
        place={2}
        isOverall={isOverall}
      />

      <PodiumEntry
        entry={entries[1]}
        place={1}
        primary
        isOverall={isOverall}
      />

      <PodiumEntry
        entry={entries[2]}
        place={3}
        isOverall={isOverall}
      />
    </section>
  )
}

function PodiumEntry({
  entry,
  place,
  primary = false,
  isOverall,
}: {
  entry: LeaderboardEntry | undefined
  place: number
  primary?: boolean
  isOverall: boolean
}) {
  if (!entry) {
    return (
      <div
        className={`flex w-[30%] max-w-[340px] items-end justify-center ${
          primary
            ? 'min-h-[360px]'
            : 'min-h-[300px]'
        }`}
      />
    )
  }

  return (
    <div
      className={`flex w-[30%] max-w-[340px] flex-col items-center ${
        primary
          ? 'min-h-[360px]'
          : 'min-h-[300px]'
      }`}
    >
      {/* TEAM PHOTO + CROWN */}
      <div className="relative">
        {primary && (
          <Crown
            size={38}
            strokeWidth={2.5}
            className="absolute -left-5 -top-5 z-10 -rotate-[20deg] fill-white text-white"
          />
        )}

        {entry.group_photo_url ? (
          <img
            src={entry.group_photo_url}
            alt=""
            className={`rounded-full border-2 border-white object-cover shadow-lg ${
              primary
                ? 'h-24 w-24 sm:h-28 sm:w-28'
                : 'h-20 w-20 sm:h-24 sm:w-24'
            }`}
          />
        ) : (
          <div
            className={`flex items-center justify-center rounded-full border-2 border-white bg-[#202938] font-semibold text-gray-300 shadow-lg ${
              primary
                ? 'h-24 w-24 text-2xl sm:h-28 sm:w-28'
                : 'h-20 w-20 text-xl sm:h-24 sm:w-24'
            }`}
          >
            {initials(entry.team_name)}
          </div>
        )}
      </div>

      {/* TEAM NAME */}
      <p
        className={`mt-4 max-w-full truncate text-center font-semibold text-white ${
          primary
            ? 'text-base sm:text-lg'
            : 'text-sm sm:text-base'
        }`}
      >
        {entry.team_name}
      </p>

      {/* COLLEGE */}
      <p className="mt-1 max-w-full truncate text-center text-xs text-gray-500">
        {entry.college_name}
      </p>

      {/* SCORE */}
      <div className="mt-3 flex items-center gap-2">
        <Trophy
          size={15}
          className="text-gray-500"
        />

        <span
          className={`font-semibold text-white ${
            primary
              ? 'text-xl sm:text-2xl'
              : 'text-lg sm:text-xl'
          }`}
        >
          {entry.score}
        </span>

        <span className="text-xs text-gray-600">
          {isOverall ? 'total' : '/ 100'}
        </span>
      </div>

      {/* PODIUM BLOCK */}
      <div
        className={`relative mt-3 flex w-full items-end justify-center overflow-hidden rounded-t-xl border border-white/10 bg-gradient-to-b from-[#1b8b58] to-[#075c3b] ${
          place === 1
            ? 'h-40 sm:h-48'
            : place === 2
              ? 'h-28 sm:h-36'
              : 'h-24 sm:h-32'
        }`}
      >
        <div className="absolute inset-x-0 top-0 h-1 bg-emerald-400/80" />

        <span
          className={`mb-1 font-black leading-none text-white/90 drop-shadow-[2px_2px_0_rgba(0,0,0,0.45)] ${
            place === 1
              ? 'text-7xl sm:text-8xl'
              : 'text-6xl sm:text-7xl'
          }`}
        >
          {place}
        </span>
      </div>
    </div>
  )
}

function RankingRow({
  entry,
  isOverall,
}: {
  entry: LeaderboardEntry
  isOverall: boolean
}) {
  return (
    <tr className="transition hover:bg-white/[0.025]">
      <td className="px-6 py-4 text-base font-semibold text-gray-300">
        {entry.rank}
      </td>

      <td className="px-6 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar entry={entry} />

          <span className="truncate font-medium text-gray-200">
            {entry.team_name}
          </span>
        </div>
      </td>

      <td className="max-w-xs truncate px-6 py-4 text-gray-500">
        {entry.college_name}
      </td>

      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="w-20 font-semibold text-gray-200">
            {entry.score}
            {isOverall ? ' total' : ' / 100'}
          </span>

          <div className="hidden h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06] sm:block">
            <div
              className="h-full rounded-full bg-white"
              style={{
                width: isOverall
                  ? '100%'
                  : `${Math.min(entry.score, 100)}%`,
              }}
            />
          </div>
        </div>
      </td>
    </tr>
  )
}

function Avatar({
  entry,
  large = false,
}: {
  entry: LeaderboardEntry
  large?: boolean
}) {
  return entry.group_photo_url ? (
    <img
      src={entry.group_photo_url}
      alt=""
      className={`${
        large
          ? 'h-24 w-24'
          : 'h-9 w-9'
      } rounded-full border border-white/10 object-cover`}
    />
  ) : (
    <div
      className={`${
        large
          ? 'h-24 w-24 text-2xl'
          : 'h-9 w-9 text-xs'
      } flex shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] font-semibold text-gray-300`}
    >
      {initials(entry.team_name)}
    </div>
  )
}

function LoadingState() {
  return (
    <div className="mt-8 animate-pulse">
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className="h-64 rounded-2xl border border-white/10 bg-[#111827]"
          />
        ))}
      </div>

      <div className="mt-8 h-96 rounded-2xl border border-white/10 bg-[#111827]" />
    </div>
  )
}