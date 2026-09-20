import {
  useEffect,
  useState,
} from 'react'

import {
  Edit3,
  Eye,
  FileText,
  Loader2,
  Plus,
  RotateCcw,
  Search,
  Send,
  Timer,
  Trash2,
  Upload,
  X,
} from 'lucide-react'

import AdminLayout from '../../components/layout/AdminLayout'
import api from '../../services/api'

interface Problem {
  id: number
  title: string
  description: string
  requirements: string
  expectations: string
  is_active: boolean
  created_at: string
  teams_selected: number
  capacity: number
  available_slots: number
}

interface ProblemForm {
  title: string
  description: string
  requirements: string
  expectations: string
  is_active: boolean
}

interface ReleaseStatus {
  problem_release_status:
    | 'not_started'
    | 'countdown'
    | 'released'
  problem_release_at: string | null
  repository_active: boolean
  feedback_active: boolean
  server_time: string
}

const emptyForm: ProblemForm = {
  title: '',
  description: '',
  requirements: '',
  expectations: '',
  is_active: true,
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

  return 'Unable to complete the request.'
}

function formatCountdown(totalSeconds: number) {
  const safeSeconds = Math.max(
    0,
    Math.ceil(totalSeconds),
  )

  const hours = Math.floor(
    safeSeconds / 3600,
  )

  const minutes = Math.floor(
    (safeSeconds % 3600) / 60,
  )

  const seconds = safeSeconds % 60

  return [
    hours,
    minutes,
    seconds,
  ]
    .map((value) =>
      value.toString().padStart(2, '0'),
    )
    .join(':')
}

export default function AdminProblems() {
  const [problems, setProblems] =
    useState<Problem[]>([])

  const [search, setSearch] =
    useState('')

  const [selectedProblem, setSelectedProblem] =
    useState<Problem | null>(null)

  const [editingProblem, setEditingProblem] =
    useState<Problem | null>(null)

  const [formOpen, setFormOpen] =
    useState(false)

  const [form, setForm] =
    useState<ProblemForm>(emptyForm)

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [error, setError] =
    useState('')

  const [formError, setFormError] =
    useState('')

  // ---------------------------------------------------------
  // CSV
  // ---------------------------------------------------------

  const [csvFile, setCsvFile] =
    useState<File | null>(null)

  const [csvUploading, setCsvUploading] =
    useState(false)

  const [csvMessage, setCsvMessage] =
    useState('')

  const [csvError, setCsvError] =
    useState('')

  // ---------------------------------------------------------
  // RESET
  // ---------------------------------------------------------

  const [resetStep, setResetStep] =
    useState<0 | 1 | 2>(0)

  const [resetting, setResetting] =
    useState(false)

  const [resetError, setResetError] =
    useState('')

  // ---------------------------------------------------------
  // PROBLEM RELEASE
  // ---------------------------------------------------------

  const [releaseStatus, setReleaseStatus] =
    useState<ReleaseStatus | null>(null)

  const [releaseLoading, setReleaseLoading] =
    useState(false)

  const [releaseError, setReleaseError] =
    useState('')

  const [durationSeconds, setDurationSeconds] =
    useState('900')

  const [countdownSeconds, setCountdownSeconds] =
    useState(0)

  const [serverOffset, setServerOffset] =
    useState(0)

  // ---------------------------------------------------------
  // FETCH PROBLEMS
  // ---------------------------------------------------------

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        setLoading(true)
        setError('')

        const response =
          await api.get<Problem[]>(
            '/admin/problems',
            {
              params: search.trim()
                ? {
                    search: search.trim(),
                  }
                : undefined,
            },
          )

        setProblems(response.data)
      } catch (requestError) {
        setError(
          getErrorMessage(requestError),
        )
      } finally {
        setLoading(false)
      }
    }

    fetchProblems()
  }, [search])

  // ---------------------------------------------------------
  // FETCH RELEASE STATUS
  // ---------------------------------------------------------

  const fetchReleaseStatus = async () => {
    try {
      const response =
        await api.get<ReleaseStatus>(
          '/admin/problems/release-status',
        )

      const data = response.data

      setReleaseStatus(data)

      const serverTime =
        new Date(
          data.server_time,
        ).getTime()

      const localTime = Date.now()

      setServerOffset(
        serverTime - localTime,
      )

      if (
        data.problem_release_status ===
          'countdown' &&
        data.problem_release_at
      ) {
        const releaseTime =
          new Date(
            data.problem_release_at,
          ).getTime()

        const currentServerTime =
          Date.now() +
          (serverTime - localTime)

        setCountdownSeconds(
          Math.max(
            0,
            (releaseTime -
              currentServerTime) /
              1000,
          ),
        )
      } else {
        setCountdownSeconds(0)
      }
    } catch (requestError) {
      setReleaseError(
        getErrorMessage(requestError),
      )
    }
  }

  useEffect(() => {
    fetchReleaseStatus()
  }, [])

  // ---------------------------------------------------------
  // SERVER-SYNCHRONIZED COUNTDOWN
  // ---------------------------------------------------------

  useEffect(() => {
    if (
      releaseStatus?.problem_release_status !==
        'countdown' ||
      !releaseStatus.problem_release_at
    ) {
      return
    }

    const releaseTime =
      new Date(
        releaseStatus.problem_release_at,
      ).getTime()

    const updateCountdown = () => {
      const currentServerTime =
        Date.now() + serverOffset

      const remaining =
        Math.max(
          0,
          (releaseTime -
            currentServerTime) /
            1000,
        )

      setCountdownSeconds(remaining)
    }

    updateCountdown()

    const interval =
      window.setInterval(
        updateCountdown,
        250,
      )

    return () => {
      window.clearInterval(interval)
    }
  }, [
    releaseStatus,
    serverOffset,
  ])

  // Poll the backend while countdown is active.
  // The backend remains the source of truth.
  useEffect(() => {
    if (
      releaseStatus?.problem_release_status !==
      'countdown'
    ) {
      return
    }

    const interval =
      window.setInterval(
        fetchReleaseStatus,
        5000,
      )

    return () => {
      window.clearInterval(interval)
    }
  }, [
    releaseStatus?.problem_release_status,
  ])

  // ---------------------------------------------------------
  // CREATE / EDIT
  // ---------------------------------------------------------

  const openCreate = () => {
    setEditingProblem(null)
    setForm(emptyForm)
    setFormError('')
    setFormOpen(true)
  }

  const openEdit = (
    problem: Problem,
  ) => {
    setEditingProblem(problem)

    setForm({
      title: problem.title,
      description:
        problem.description,
      requirements:
        problem.requirements ?? '',
      expectations:
        problem.expectations ?? '',
      is_active:
        problem.is_active,
    })

    setFormError('')
    setFormOpen(true)
  }

  const closeForm = () => {
    setEditingProblem(null)
    setFormError('')
    setFormOpen(false)
  }

  const saveProblem = async (
    event: React.FormEvent,
  ) => {
    event.preventDefault()

    if (
      !form.title.trim() ||
      !form.description.trim()
    ) {
      setFormError(
        'Title and description are required.',
      )
      return
    }

    try {
      setSaving(true)
      setFormError('')

      const payload = {
        ...form,
        title: form.title.trim(),
        description:
          form.description.trim(),
        requirements:
          form.requirements.trim(),
        expectations:
          form.expectations.trim(),
      }

      if (editingProblem) {
        const response =
          await api.put<Problem>(
            `/admin/problems/${editingProblem.id}`,
            payload,
          )

        setProblems((current) =>
          current.map(
            (problem) =>
              problem.id ===
              response.data.id
                ? response.data
                : problem,
          ),
        )
      } else {
        const response =
          await api.post<Problem>(
            '/admin/problems',
            payload,
          )

        setProblems((current) => [
          ...current,
          response.data,
        ])
      }

      closeForm()
    } catch (requestError) {
      setFormError(
        getErrorMessage(requestError),
      )
    } finally {
      setSaving(false)
    }
  }

  // ---------------------------------------------------------
  // CSV UPLOAD
  // ---------------------------------------------------------

  const uploadCsv = async () => {
    if (!csvFile) {
      setCsvError(
        'Please select a CSV file.',
      )
      return
    }

    if (
      !csvFile.name
        .toLowerCase()
        .endsWith('.csv')
    ) {
      setCsvError(
        'Only CSV files are allowed.',
      )
      return
    }

    try {
      setCsvUploading(true)
      setCsvError('')
      setCsvMessage('')

      const formData =
        new FormData()

      formData.append(
        'file',
        csvFile,
      )

      const response =
        await api.post(
          '/admin/problems/upload-csv',
          formData,
          {
            headers: {
              'Content-Type':
                'multipart/form-data',
            },
          },
        )

      setCsvMessage(
        response.data?.message ||
          `${response.data?.created_count ?? 0} problem statements uploaded successfully.`,
      )

      setCsvFile(null)

      const refreshed =
        await api.get<Problem[]>(
          '/admin/problems',
          {
            params: search.trim()
              ? {
                  search:
                    search.trim(),
                }
              : undefined,
          },
        )

      setProblems(
        refreshed.data,
      )
    } catch (requestError) {
      setCsvError(
        getErrorMessage(
          requestError,
        ),
      )
    } finally {
      setCsvUploading(false)
    }
  }

  // ---------------------------------------------------------
  // RESET ALL PROBLEMS
  // ---------------------------------------------------------

  const resetProblemStatements =
    async () => {
      try {
        setResetting(true)
        setResetError('')

        await api.post(
          '/admin/problems/reset',
        )

        setProblems([])
        setSelectedProblem(null)
        setEditingProblem(null)
        setFormOpen(false)

        setCsvFile(null)
        setCsvMessage('')
        setCsvError('')

        setResetStep(0)

        await fetchReleaseStatus()
      } catch (requestError) {
        setResetError(
          getErrorMessage(
            requestError,
          ),
        )
      } finally {
        setResetting(false)
      }
    }

  // ---------------------------------------------------------
  // RELEASE CONTROLS
  // ---------------------------------------------------------

  const startCountdown =
    async () => {
      const seconds =
        Number(durationSeconds)

      if (
        !Number.isFinite(seconds) ||
        seconds <= 0
      ) {
        setReleaseError(
          'Countdown duration must be greater than zero.',
        )
        return
      }

      try {
        setReleaseLoading(true)
        setReleaseError('')

        const response =
          await api.post<ReleaseStatus>(
            '/admin/problems/release-countdown',
            {
              duration_seconds:
                Math.floor(seconds),
            },
          )

        setReleaseStatus(
          response.data,
        )

        const serverTime =
          new Date(
            response.data.server_time,
          ).getTime()

        setServerOffset(
          serverTime - Date.now(),
        )
      } catch (requestError) {
        setReleaseError(
          getErrorMessage(
            requestError,
          ),
        )
      } finally {
        setReleaseLoading(false)
      }
    }

  const releaseNow = async () => {
    try {
      setReleaseLoading(true)
      setReleaseError('')

      const response =
        await api.post<ReleaseStatus>(
          '/admin/problems/release-now',
        )

      setReleaseStatus(
        response.data,
      )

      setCountdownSeconds(0)
    } catch (requestError) {
      setReleaseError(
        getErrorMessage(
          requestError,
        ),
      )
    } finally {
      setReleaseLoading(false)
    }
  }

  const resetRelease = async () => {
    try {
      setReleaseLoading(true)
      setReleaseError('')

      const response =
        await api.post<ReleaseStatus>(
          '/admin/problems/reset-release',
        )

      setReleaseStatus(
        response.data,
      )

      setCountdownSeconds(0)
    } catch (requestError) {
      setReleaseError(
        getErrorMessage(
          requestError,
        ),
      )
    } finally {
      setReleaseLoading(false)
    }
  }

  const isCountdown =
    releaseStatus?.problem_release_status ===
    'countdown'

  const isReleased =
    releaseStatus?.problem_release_status ===
    'released'

  const isNotStarted =
    releaseStatus?.problem_release_status ===
    'not_started'

  return (
    <AdminLayout>
      <div className="mx-auto max-w-[1400px]">

        {/* Header */}
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.16em] text-gray-600">
              Admin Workspace
            </p>

            <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Problem Statements
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Manage the real problem statements available to teams.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap lg:w-auto">

            {/* Search */}
            <div className="relative w-full sm:w-72">
              <Search
                size={17}
                strokeWidth={1.8}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-600"
              />

              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value,
                  )
                }
                placeholder="Search problems..."
                className="w-full rounded-xl border border-white/10 bg-[#111827] py-2.5 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-white/25"
                aria-label="Search problem statements"
              />
            </div>

            {/* Choose CSV */}
            <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#111827] px-4 py-2.5 text-sm font-medium text-gray-300 transition hover:border-white/20 hover:bg-white/[0.05] hover:text-white">
              <Upload size={16} />

              <span className="max-w-[150px] truncate">
                {csvFile
                  ? csvFile.name
                  : 'Choose CSV'}
              </span>

              <input
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(event) => {
                  setCsvFile(
                    event.target
                      .files?.[0] ??
                      null,
                  )
                  setCsvMessage('')
                  setCsvError('')
                }}
              />
            </label>

            {/* Upload CSV */}
            <button
              type="button"
              onClick={uploadCsv}
              disabled={
                !csvFile ||
                csvUploading
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#111827] px-4 py-2.5 text-sm font-medium text-gray-300 transition hover:border-white/20 hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              {csvUploading ? (
                <Loader2
                  size={16}
                  className="animate-spin"
                />
              ) : (
                <Upload size={16} />
              )}

              Upload CSV
            </button>

            {/* Reset Problems */}
            <button
              type="button"
              onClick={() => {
                setResetError('')
                setResetStep(1)
              }}
              disabled={resetting}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-400/20 bg-red-400/[0.05] px-4 py-2.5 text-sm font-medium text-red-300 transition hover:border-red-400/30 hover:bg-red-400/[0.1] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Trash2 size={16} />

              Reset Problems
            </button>

            {/* Add Problem */}
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-[#000000] transition hover:bg-gray-200"
            >
              <Plus size={16} />

              Add problem
            </button>
          </div>
        </div>

        {/* -------------------------------------------------
            PROBLEM RELEASE CONTROL
        ------------------------------------------------- */}

        <div className="mb-6 overflow-hidden rounded-2xl border border-white/10 bg-[#111827]">
          <div className="border-b border-white/[0.06] px-6 py-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

              <div>
                <div className="flex items-center gap-2">
                  <Timer
                    size={17}
                    className="text-gray-400"
                  />

                  <h3 className="text-sm font-semibold text-white">
                    Problem Release Control
                  </h3>
                </div>

                <p className="mt-1 text-xs text-gray-500">
                  Control when problem statements become available to teams.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-3 py-1.5 text-[11px] font-medium ${
                    isReleased
                      ? 'bg-emerald-400/10 text-emerald-300'
                      : isCountdown
                        ? 'bg-amber-400/10 text-amber-300'
                        : 'bg-white/[0.06] text-gray-500'
                  }`}
                >
                  {isReleased
                    ? 'Released'
                    : isCountdown
                      ? 'Countdown active'
                      : 'Not started'}
                </span>
              </div>
            </div>
          </div>

          <div className="grid gap-5 p-6 lg:grid-cols-[1fr_auto]">

            {/* Status */}
            <div>
              {isCountdown ? (
                <div>
                  <p className="text-xs uppercase tracking-[0.12em] text-gray-600">
                    Problem statement releases in
                  </p>

                  <p className="mt-2 font-mono text-4xl font-semibold tracking-tight text-white">
                    {formatCountdown(
                      countdownSeconds,
                    )}
                  </p>

                  <p className="mt-2 text-xs text-gray-500">
                    The countdown is synchronized with the server.
                  </p>
                </div>
              ) : isReleased ? (
                <div>
                  <p className="text-xs uppercase tracking-[0.12em] text-gray-600">
                    Current status
                  </p>

                  <p className="mt-2 text-2xl font-semibold text-emerald-300">
                    Problem statements released
                  </p>

                  <p className="mt-2 text-xs text-gray-500">
                    Teams can access the available problem statements.
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-xs uppercase tracking-[0.12em] text-gray-600">
                    Current status
                  </p>

                  <p className="mt-2 text-2xl font-semibold text-gray-300">
                    Problem statements not released
                  </p>

                  <p className="mt-2 text-xs text-gray-500">
                    Start a countdown when you are ready to release them.
                  </p>
                </div>
              )}

              {releaseError && (
                <p className="mt-4 text-sm text-red-300">
                  {releaseError}
                </p>
              )}
            </div>

            {/* Controls */}
            <div className="flex min-w-[280px] flex-col gap-3">

              {!isReleased && (
                <div>
                  <label className="text-xs text-gray-500">
                    Countdown duration
                  </label>

                  <div className="mt-2 flex gap-2">
                    <input
                      type="number"
                      min="1"
                      value={
                        durationSeconds
                      }
                      onChange={(
                        event,
                      ) =>
                        setDurationSeconds(
                          event.target
                            .value,
                        )
                      }
                      disabled={
                        releaseLoading ||
                        isCountdown
                      }
                      className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white outline-none focus:border-white/25 disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label="Countdown duration in seconds"
                    />

                    <span className="flex items-center rounded-xl border border-white/10 px-3 text-xs text-gray-500">
                      sec
                    </span>
                  </div>
                </div>
              )}

              {!isCountdown &&
                !isReleased && (
                  <button
                    type="button"
                    onClick={
                      startCountdown
                    }
                    disabled={
                      releaseLoading
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {releaseLoading ? (
                      <Loader2
                        size={16}
                        className="animate-spin"
                      />
                    ) : (
                      <Timer size={16} />
                    )}

                    Start countdown
                  </button>
                )}

              {isCountdown && (
                <button
                  type="button"
                  onClick={
                    releaseNow
                  }
                  disabled={
                    releaseLoading
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-400/10 px-4 py-2.5 text-sm font-medium text-emerald-300 transition hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {releaseLoading ? (
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                  ) : (
                    <Send size={16} />
                  )}

                  Release now
                </button>
              )}

              {!isNotStarted && (
                <button
                  type="button"
                  onClick={
                    resetRelease
                  }
                  disabled={
                    releaseLoading
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-gray-400 transition hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RotateCcw
                    size={15}
                  />

                  Reset release
                </button>
              )}
            </div>
          </div>
        </div>

        {/* CSV success */}
        {csvMessage && (
          <div className="mb-4 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.05] px-4 py-3 text-sm text-emerald-300">
            {csvMessage}
          </div>
        )}

        {/* CSV error */}
        {csvError && (
          <div className="mb-4 rounded-xl border border-red-400/20 bg-red-400/[0.05] px-4 py-3 text-sm text-red-300">
            {csvError}
          </div>
        )}

        {/* Problems table */}
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#111827]">
          {loading ? (
            <div className="flex min-h-[320px] items-center justify-center">
              <Loader2
                size={22}
                className="animate-spin text-gray-500"
              />
            </div>
          ) : error ? (
            <div className="flex min-h-[320px] items-center justify-center px-6 text-center">
              <p className="text-sm text-gray-400">
                {error}
              </p>
            </div>
          ) : problems.length === 0 ? (
            <div className="flex min-h-[320px] flex-col items-center justify-center px-6 text-center">
              <FileText
                size={28}
                className="text-gray-600"
              />

              <p className="mt-4 text-sm text-gray-400">
                {search.trim()
                  ? 'No problem statements match your search.'
                  : 'No problem statements have been created yet.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] text-left text-sm">
                <thead className="border-b border-white/10 text-[11px] uppercase tracking-[0.12em] text-gray-600">
                  <tr>
                    <th className="px-6 py-4 font-medium">
                      Problem
                    </th>

                    <th className="px-6 py-4 font-medium">
                      Selection limit
                    </th>

                    <th className="px-6 py-4 font-medium">
                      Available
                    </th>

                    <th className="px-6 py-4 font-medium">
                      Status
                    </th>

                    <th className="px-6 py-4 text-right font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/[0.06]">
                  {problems.map(
                    (problem) => (
                      <tr
                        key={problem.id}
                        className="transition hover:bg-white/[0.025]"
                      >
                        <td className="max-w-md px-6 py-4">
                          <p className="font-medium text-gray-200">
                            {problem.title}
                          </p>

                          <p className="mt-1 truncate text-xs text-gray-500">
                            {
                              problem.description
                            }
                          </p>
                        </td>

                        <td className="px-6 py-4 text-gray-400">
                          {
                            problem.teams_selected
                          }{' '}
                          /{' '}
                          {
                            problem.capacity
                          }
                        </td>

                        <td className="px-6 py-4 text-gray-400">
                          {
                            problem.available_slots
                          }
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`rounded-full px-2.5 py-1 text-[11px] ${
                              problem.is_active
                                ? 'bg-emerald-400/10 text-emerald-300'
                                : 'bg-white/[0.06] text-gray-500'
                            }`}
                          >
                            {problem.is_active
                              ? 'Active'
                              : 'Inactive'}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">

                            <button
                              type="button"
                              onClick={() =>
                                setSelectedProblem(
                                  problem,
                                )
                              }
                              className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-gray-300 transition hover:border-white/25 hover:bg-white/[0.05] hover:text-white"
                            >
                              <Eye size={14} />
                              View
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                openEdit(
                                  problem,
                                )
                              }
                              className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-gray-300 transition hover:border-white/25 hover:bg-white/[0.05] hover:text-white"
                            >
                              <Edit3 size={14} />
                              Edit
                            </button>

                          </div>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* First Reset Confirmation */}
      {resetStep === 1 && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 px-4"
          role="presentation"
        >
          <div
            className="w-full max-w-md rounded-2xl border border-white/10 bg-[#111827] p-6 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-confirmation-title"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-400/[0.08]">
              <Trash2
                size={19}
                className="text-red-300"
              />
            </div>

            <h3
              id="reset-confirmation-title"
              className="mt-5 text-lg font-semibold text-white"
            >
              Reset Problem Statements?
            </h3>

            <p className="mt-3 text-sm leading-6 text-gray-400">
              This will remove all problem statements
              and clear every team's current problem
              selection.
            </p>

            <p className="mt-3 text-xs leading-5 text-gray-600">
              This action cannot be undone. You will
              need to upload the problem CSV again.
            </p>

            {resetError && (
              <p className="mt-4 text-sm text-red-300">
                {resetError}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() =>
                  setResetStep(0)
                }
                className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-gray-400 transition hover:bg-white/[0.05] hover:text-white"
              >
                No
              </button>

              <button
                type="button"
                onClick={() =>
                  setResetStep(2)
                }
                className="rounded-xl bg-red-400/10 px-4 py-2.5 text-sm font-medium text-red-300 transition hover:bg-red-400/20"
              >
                Yes, continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Final Reset Confirmation */}
      {resetStep === 2 && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 px-4"
          role="presentation"
        >
          <div
            className="w-full max-w-md rounded-2xl border border-red-400/20 bg-[#111827] p-6 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="final-reset-title"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-400/[0.1]">
              <Trash2
                size={19}
                className="text-red-300"
              />
            </div>

            <h3
              id="final-reset-title"
              className="mt-5 text-lg font-semibold text-white"
            >
              Are you absolutely sure?
            </h3>

            <p className="mt-3 text-sm leading-6 text-gray-400">
              All problem statements will be permanently
              deleted and all team problem selections
              will be cleared.
            </p>

            <p className="mt-3 text-sm font-medium text-red-300">
              This cannot be undone.
            </p>

            {resetError && (
              <p className="mt-4 text-sm text-red-300">
                {resetError}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() =>
                  setResetStep(0)
                }
                disabled={resetting}
                className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-gray-400 transition hover:bg-white/[0.05] hover:text-white disabled:opacity-50"
              >
                No
              </button>

              <button
                type="button"
                onClick={
                  resetProblemStatements
                }
                disabled={resetting}
                className="inline-flex items-center gap-2 rounded-xl bg-red-500/15 px-4 py-2.5 text-sm font-medium text-red-300 transition hover:bg-red-500/25 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {resetting && (
                  <Loader2
                    size={15}
                    className="animate-spin"
                  />
                )}

                Yes, reset everything
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Problem Details */}
      {selectedProblem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setSelectedProblem(null)
            }
          }}
        >
          <div
            className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#111827] p-6 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="problem-details-title"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.16em] text-gray-600">
                  Problem details
                </p>

                <h3
                  id="problem-details-title"
                  className="mt-2 text-xl font-semibold text-white"
                >
                  {
                    selectedProblem.title
                  }
                </h3>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedProblem(null)
                }
                className="rounded-lg p-2 text-gray-500 transition hover:bg-white/[0.05] hover:text-white"
                aria-label="Close problem details"
              >
                <X size={18} />
              </button>
            </div>

            <p className="mt-6 whitespace-pre-wrap text-sm leading-6 text-gray-400">
              {
                selectedProblem.description
              }
            </p>

            {selectedProblem.requirements && (
              <div className="mt-6">
                <p className="text-xs font-medium text-gray-500">
                  Requirements
                </p>

                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-400">
                  {
                    selectedProblem.requirements
                  }
                </p>
              </div>
            )}

            {selectedProblem.expectations && (
              <div className="mt-6">
                <p className="text-xs font-medium text-gray-500">
                  Expectations
                </p>

                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-400">
                  {
                    selectedProblem.expectations
                  }
                </p>
              </div>
            )}

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <Detail
                label="Teams selected"
                value={`${selectedProblem.teams_selected} / ${selectedProblem.capacity}`}
              />

              <Detail
                label="Available slots"
                value={selectedProblem.available_slots.toString()}
              />

              <Detail
                label="Status"
                value={
                  selectedProblem.is_active
                    ? 'Active'
                    : 'Inactive'
                }
              />
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Problem */}
      {formOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 px-4 py-8"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeForm()
            }
          }}
        >
          <form
            onSubmit={saveProblem}
            className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#111827] p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.16em] text-gray-600">
                  Problem management
                </p>

                <h3 className="mt-2 text-xl font-semibold text-white">
                  {editingProblem
                    ? 'Edit problem'
                    : 'Add problem'}
                </h3>
              </div>

              <button
                type="button"
                onClick={closeForm}
                className="rounded-lg p-2 text-gray-500 transition hover:bg-white/[0.05] hover:text-white"
                aria-label="Close problem form"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-6 space-y-4">

              <label className="block">
                <span className="text-xs text-gray-500">
                  Title
                </span>

                <input
                  value={form.title}
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,
                        title:
                          event.target
                            .value,
                      }),
                    )
                  }
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none placeholder:text-gray-600 focus:border-white/25"
                  placeholder="Problem title"
                  maxLength={200}
                />
              </label>

              <label className="block">
                <span className="text-xs text-gray-500">
                  Description
                </span>

                <textarea
                  value={
                    form.description
                  }
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,
                        description:
                          event.target
                            .value,
                      }),
                    )
                  }
                  className="mt-2 min-h-36 w-full resize-y rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none placeholder:text-gray-600 focus:border-white/25"
                  placeholder="Describe the problem statement"
                />
              </label>

              <label className="block">
                <span className="text-xs text-gray-500">
                  Requirements
                </span>

                <textarea
                  value={
                    form.requirements
                  }
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,
                        requirements:
                          event.target
                            .value,
                      }),
                    )
                  }
                  className="mt-2 min-h-28 w-full resize-y rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none placeholder:text-gray-600 focus:border-white/25"
                  placeholder="What the solution should include"
                />
              </label>

              <label className="block">
                <span className="text-xs text-gray-500">
                  Expectations
                </span>

                <textarea
                  value={
                    form.expectations
                  }
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,
                        expectations:
                          event.target
                            .value,
                      }),
                    )
                  }
                  className="mt-2 min-h-28 w-full resize-y rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none placeholder:text-gray-600 focus:border-white/25"
                  placeholder="Expected outcome or evaluation focus"
                />
              </label>

              <label className="flex items-center gap-3 text-sm text-gray-400">
                <input
                  type="checkbox"
                  checked={
                    form.is_active
                  }
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,
                        is_active:
                          event.target
                            .checked,
                      }),
                    )
                  }
                  className="h-4 w-4 accent-white"
                />

                Active for team selection
              </label>
            </div>

            {formError && (
              <p className="mt-4 text-sm text-red-300">
                {formError}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeForm}
                className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-gray-400 transition hover:bg-white/[0.05] hover:text-white"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving && (
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />
                )}

                {editingProblem
                  ? 'Save changes'
                  : 'Create problem'}
              </button>
            </div>
          </form>
        </div>
      )}
    </AdminLayout>
  )
}

interface DetailProps {
  label: string
  value: string
}

function Detail({
  label,
  value,
}: DetailProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <p className="text-[11px] text-gray-600">
        {label}
      </p>

      <p className="mt-2 text-sm text-gray-300">
        {value}
      </p>
    </div>
  )
}