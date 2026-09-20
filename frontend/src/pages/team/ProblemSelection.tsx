import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Check,
  ChevronRight,
  Clock,
  Lock,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import DashboardLayout from '../../components/layout/DashboardLayout'
import ProblemStatementCard from '../../components/ui/ProblemStatementCard'
import WorkspaceCard from '../../components/ui/WorkspaceCard'
import api from '../../services/api'

interface Problem {
  id: number
  title: string
  description: string
  is_active: boolean
  created_at: string
  teams_selected: number
  capacity: number
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
  created_at: string
}

interface SelectionResponse {
  message: string
  problem: Problem
  teams_selected: number
  capacity: number
}

interface ReleaseStatusResponse {
  status: 'not_started' | 'countdown' | 'released'
  release_at: string | null
  server_time: string
}

export default function ProblemSelection() {
  const navigate = useNavigate()

  const [releaseStatus, setReleaseStatus] = useState<
    'not_started' | 'countdown' | 'released'
  >('not_started')

  const [releaseAt, setReleaseAt] = useState<string | null>(null)
  const [clockSkewMs, setClockSkewMs] = useState<number>(0)
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0)

  const [problems, setProblems] = useState<Problem[]>([])
  const [team, setTeam] = useState<Team | null>(null)

  const [loading, setLoading] = useState(true)
  const [selectingId, setSelectingId] = useState<number | null>(null)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const socketRef = useRef<WebSocket | null>(null)

  // Fetch Team profile
  const fetchTeam = useCallback(async () => {
    try {
      const response = await api.get<Team>('/teams/me')
      setTeam(response.data)
    } catch (err: any) {
      console.error('Failed to load team data:', err)
    }
  }, [])

  // Fetch problem statements
  const fetchProblems = useCallback(async () => {
    try {
      const response = await api.get<Problem[]>('/problems')
      setProblems(response.data)
    } catch (err: any) {
      console.error('Failed to load problem statements:', err)

      if (err?.response?.status === 403) {
        setReleaseStatus('not_started')
      } else {
        setError(
          err?.response?.data?.detail ||
            'Unable to load problem statements.',
        )
      }
    }
  }, [])

  // Check release status from server
  const fetchReleaseStatus = useCallback(async () => {
    try {
      const response = await api.get<ReleaseStatusResponse>(
        '/problems/status',
      )

      const data = response.data

      const serverTimestamp = new Date(data.server_time).getTime()
      const localTimestamp = Date.now()
      const skew = serverTimestamp - localTimestamp

      setClockSkewMs(skew)
      setReleaseStatus(data.status)
      setReleaseAt(data.release_at)

      if (data.status === 'countdown' && data.release_at) {
        const targetTime = new Date(data.release_at).getTime()
        const currentServerTime = Date.now() + skew

        const diff = Math.max(
          0,
          Math.floor((targetTime - currentServerTime) / 1000),
        )

        setRemainingSeconds(diff)
      } else if (data.status === 'released') {
        setRemainingSeconds(0)
        await fetchProblems()
      } else {
        setRemainingSeconds(0)
      }
    } catch (err: any) {
      console.error('Failed to fetch problem release status:', err)
    }
  }, [fetchProblems])

  // Initial load
  useEffect(() => {
    const initialize = async () => {
      setLoading(true)
      setError('')

      await Promise.all([
        fetchTeam(),
        fetchReleaseStatus(),
      ])

      setLoading(false)
    }

    initialize()
  }, [fetchTeam, fetchReleaseStatus])

  // WebSocket for real-time release state changes
  useEffect(() => {
    let socket: WebSocket | null = null
    let reconnectTimer: number | undefined
    let isStopped = false

    const connect = () => {
      if (isStopped) return

      const baseWs =
        api.defaults.baseURL
          ?.replace(/^http:/, 'ws:')
          .replace(/^https:/, 'wss:') ||
        'ws://127.0.0.1:8000'

      const wsUrl = `${baseWs}/ws/problems/release`

      socket = new WebSocket(wsUrl)
      socketRef.current = socket

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)

          if (data.type === 'release_update') {
            const serverTimestamp = new Date(
              data.server_time,
            ).getTime()

            const localTimestamp = Date.now()
            const skew = serverTimestamp - localTimestamp

            setClockSkewMs(skew)
            setReleaseStatus(data.status)
            setReleaseAt(data.release_at)

            if (
              data.status === 'countdown' &&
              data.release_at
            ) {
              const targetTime = new Date(
                data.release_at,
              ).getTime()

              const currentServerTime =
                Date.now() + skew

              const diff = Math.max(
                0,
                Math.floor(
                  (targetTime - currentServerTime) / 1000,
                ),
              )

              setRemainingSeconds(diff)
            } else if (data.status === 'released') {
              setRemainingSeconds(0)
              fetchProblems()
            } else if (data.status === 'not_started') {
              setRemainingSeconds(0)
              setProblems([])
            }
          }
        } catch (err) {
          console.error(
            'WebSocket message parsing error:',
            err,
          )
        }
      }

      socket.onclose = () => {
        if (!isStopped) {
          reconnectTimer = window.setTimeout(
            connect,
            3000,
          )
        }
      }

      socket.onerror = () => {
        socket?.close()
      }
    }

    connect()

    return () => {
      isStopped = true

      if (reconnectTimer) {
        clearTimeout(reconnectTimer)
      }

      if (socket) {
        socket.close()
      }
    }
  }, [fetchProblems])

  // Countdown timer
  useEffect(() => {
    if (
      releaseStatus !== 'countdown' ||
      !releaseAt
    ) {
      return
    }

    const timer = setInterval(() => {
      const targetTime = new Date(
        releaseAt,
      ).getTime()

      const currentServerTime =
        Date.now() + clockSkewMs

      const diff = Math.max(
        0,
        Math.floor(
          (targetTime - currentServerTime) / 1000,
        ),
      )

      setRemainingSeconds(diff)

      if (diff <= 0) {
        clearInterval(timer)

        /*
         * Do NOT locally set the status to "released".
         *
         * The backend is the source of truth.
         * Calling /problems/status causes the backend
         * to check release_at and transition:
         *
         * countdown -> released
         *
         * once the release time has actually arrived.
         */
        fetchReleaseStatus()
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [
    releaseStatus,
    releaseAt,
    clockSkewMs,
    fetchReleaseStatus,
  ])

  // Handle problem selection
  const handleSelectProblem = async (
    problemId: number,
  ) => {
    try {
      setSelectingId(problemId)
      setError('')
      setSuccess('')

      const response =
        await api.post<SelectionResponse>(
          `/problems/${problemId}/select`,
        )

      setSuccess(response.data.message)

      setProblems((currentProblems) =>
        currentProblems.map((problem) =>
          problem.id === response.data.problem.id
            ? {
                ...problem,
                teams_selected:
                  response.data.teams_selected,
                capacity:
                  response.data.capacity,
              }
            : problem,
        ),
      )

      setTeam((currentTeam) => {
        if (!currentTeam) {
          return currentTeam
        }

        return {
          ...currentTeam,
          selected_problem:
            response.data.problem,
        }
      })
    } catch (err: any) {
      console.error(
        'Failed to select problem:',
        err,
      )

      setError(
        err?.response?.data?.detail ||
          'Unable to select this problem statement.',
      )

      await fetchProblems()
    } finally {
      setSelectingId(null)
    }
  }

  const formatUnit = (value: number) =>
    String(value).padStart(2, '0')

  const hours = Math.floor(
    remainingSeconds / 3600,
  )

  const minutes = Math.floor(
    (remainingSeconds % 3600) / 60,
  )

  const seconds =
    remainingSeconds % 60

  if (loading) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-[1400px]">
          <div className="flex min-h-[500px] items-center justify-center">
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/10 border-t-white" />
              Loading problem statement status...
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-[1400px]">
        {/* PAGE HEADER */}
        <div className="mb-8">
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-[#61718b]">
            Team Workspace
          </p>

          <h1 className="text-2xl font-semibold tracking-tight text-white lg:text-3xl">
            Problem Statement
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#7183a0]">
            Review the available problem statements and select the one your team will work on.
          </p>
        </div>

        {/* ERROR MESSAGE */}
        {error && (
          <div className="mb-5 rounded-xl border border-red-400/20 bg-red-400/[0.06] px-4 py-3">
            <p className="text-sm text-red-300">
              {error}
            </p>
          </div>
        )}

        {/* SUCCESS MESSAGE */}
        {success && (
          <div className="mb-5 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] px-4 py-3">
            <div className="flex items-center gap-2">
              <Check
                size={16}
                className="text-emerald-300"
              />
              <p className="text-sm text-emerald-200">
                {success}
              </p>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STATE 1: NOT YET RELEASED */}
        {/* ========================================================= */}
        {releaseStatus === 'not_started' && (
          <WorkspaceCard className="my-8 mx-auto max-w-2xl p-10 text-center sm:p-14">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
              <Lock
                size={24}
                className="text-gray-300"
              />
            </div>

            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-[#64748b]">
              Problem Statement
            </p>

            <h2 className="mt-2 text-2xl font-semibold text-white">
              Not Yet Released
            </h2>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#7183a0]">
              Problem statements have not been revealed yet. Once the organizers start the release countdown, this page will update automatically in real-time.
            </p>

            <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#111827] px-4 py-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
              <span className="text-xs text-gray-300">
                Awaiting Countdown
              </span>
            </div>
          </WorkspaceCard>
        )}

        {/* ========================================================= */}
        {/* STATE 2: COUNTDOWN RUNNING */}
        {/* ========================================================= */}
        {releaseStatus === 'countdown' && (
          <WorkspaceCard className="my-8 mx-auto max-w-3xl p-8 text-center sm:p-12">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
              <Clock
                size={22}
                className="text-gray-300"
              />
            </div>

            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-[#64748b]">
              Problem Statement
            </p>

            <h2 className="mt-2 text-lg font-medium text-gray-300 sm:text-xl">
              Problem statement will be released in
            </h2>

            {/* COUNTDOWN CLOCK */}
            <div className="mt-8 flex items-center justify-center gap-3 sm:gap-6">
              {/* HOURS */}
              <div className="flex flex-col items-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-white/10 bg-[#111827] font-mono text-3xl font-bold text-white shadow-inner sm:h-28 sm:w-28 sm:text-5xl">
                  {formatUnit(hours)}
                </div>

                <span className="mt-2 text-[10px] font-medium uppercase tracking-[0.18em] text-[#64748b]">
                  Hours
                </span>
              </div>

              <span className="-mt-6 text-2xl font-bold text-white/30 sm:text-4xl">
                :
              </span>

              {/* MINUTES */}
              <div className="flex flex-col items-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-white/10 bg-[#111827] font-mono text-3xl font-bold text-white shadow-inner sm:h-28 sm:w-28 sm:text-5xl">
                  {formatUnit(minutes)}
                </div>

                <span className="mt-2 text-[10px] font-medium uppercase tracking-[0.18em] text-[#64748b]">
                  Minutes
                </span>
              </div>

              <span className="-mt-6 text-2xl font-bold text-white/30 sm:text-4xl">
                :
              </span>

              {/* SECONDS */}
              <div className="flex flex-col items-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-white/10 bg-[#111827] font-mono text-3xl font-bold text-white shadow-inner sm:h-28 sm:w-28 sm:text-5xl">
                  {formatUnit(seconds)}
                </div>

                <span className="mt-2 text-[10px] font-medium uppercase tracking-[0.18em] text-[#64748b]">
                  Seconds
                </span>
              </div>
            </div>

            <p className="mt-8 text-xs text-[#7183a0]">
              Problem statements will become visible and problem selection will unlock automatically at 00:00:00.
            </p>
          </WorkspaceCard>
        )}

        {/* ========================================================= */}
        {/* STATE 3: RELEASED */}
        {/* ========================================================= */}
        {releaseStatus === 'released' && (
          <>
            {/* CURRENT SELECTION */}
            {team?.selected_problem && (
              <WorkspaceCard className="mb-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#000000]">
                      <Check
                        size={18}
                        strokeWidth={2}
                      />
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#64748b]">
                        Your Selected Problem
                      </p>

                      <h2 className="mt-1 text-base font-semibold text-white">
                        {team.selected_problem.title}
                      </h2>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      navigate('/dashboard')
                    }
                    className="flex items-center justify-center gap-2 rounded-xl border border-[#293448] px-4 py-2.5 text-xs font-medium text-[#a5b4ca] transition-colors hover:bg-white/[0.04] hover:text-white"
                  >
                    Back to Dashboard
                    <ChevronRight size={14} />
                  </button>
                </div>
              </WorkspaceCard>
            )}

            {/* PROBLEMS GRID */}
            {problems.length === 0 ? (
              <WorkspaceCard className="p-10 text-center">
                <p className="text-sm text-[#7183a0]">
                  No active problem statements are available.
                </p>
              </WorkspaceCard>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {problems.map(
                  (problem, index) => {
                    const isSelected =
                      team?.selected_problem?.id ===
                      problem.id

                    const isLocked =
                      Boolean(team?.selected_problem) &&
                      !isSelected

                    const isSelecting =
                      selectingId === problem.id

                    return (
                      <ProblemStatementCard
                        key={problem.id}
                        number={index + 1}
                        title={problem.title}
                        description={
                          problem.description
                        }
                        isActive={
                          problem.is_active
                        }
                        selectedCount={
                          problem.teams_selected
                        }
                        capacity={
                          problem.capacity
                        }
                        isSelected={
                          isSelected
                        }
                        isLocked={
                          isLocked
                        }
                        isSelecting={
                          isSelecting
                        }
                        onSelect={() =>
                          handleSelectProblem(
                            problem.id,
                          )
                        }
                      />
                    )
                  },
                )}
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  )
}