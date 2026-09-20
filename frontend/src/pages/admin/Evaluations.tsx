import {
  useEffect,
  useState,
} from 'react'

import {
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Edit3,
  Eye,
  Loader2,
  Save,
  X,
} from 'lucide-react'

import AdminLayout from '../../components/layout/AdminLayout'
import api from '../../services/api'

interface Evaluation {
  id: number
  team_id: number
  team_name: string
  college_name: string
  evaluator_id: number
  evaluator_name: string
  round_id: number
  round_name: string
  round_number: number
  score: number | null
  remarks: string | null
  status: 'pending' | 'submitted'
  created_at: string
  updated_at: string
}

interface Round {
  id: number
  name: string
  round_number: number
}

interface EvaluationUpdate {
  score: number
  remarks: string | null
}

function getErrorMessage(
  error: unknown,
  fallback = 'Unable to load evaluations.',
) {
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
        'detail' in data
      ) {
        const detail = data.detail

        if (typeof detail === 'string') {
          return detail
        }

        if (Array.isArray(detail)) {
          return detail
            .map((item) => {
              if (
                typeof item === 'object' &&
                item !== null &&
                'msg' in item &&
                typeof item.msg === 'string'
              ) {
                return item.msg
              }

              return String(item)
            })
            .join(', ')
        }
      }
    }
  }

  return fallback
}

function formatDate(value: string) {
  return new Date(value).toLocaleString()
}

export default function AdminEvaluations() {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([])
  const [rounds, setRounds] = useState<Round[]>([])
  const [roundId, setRoundId] = useState('')
  const [status, setStatus] = useState('')

  const [selectedEvaluation, setSelectedEvaluation] =
    useState<Evaluation | null>(null)

  const [editingEvaluation, setEditingEvaluation] =
    useState<Evaluation | null>(null)

  const [editScore, setEditScore] = useState('')
  const [editRemarks, setEditRemarks] = useState('')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saveSuccess, setSaveSuccess] = useState('')

  const fetchEvaluations = async () => {
    try {
      setLoading(true)
      setError('')

      const params: {
        round_id?: number
        status?: string
      } = {}

      if (roundId) {
        params.round_id = Number(roundId)
      }

      if (status) {
        params.status = status
      }

      const response = await api.get<Evaluation[]>(
        '/admin/evaluations',
        { params },
      )

      setEvaluations(response.data)
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    api.get<Round[]>('/rounds')
      .then((response) => setRounds(response.data))
      .catch(() => setRounds([]))
  }, [])

  useEffect(() => {
    fetchEvaluations()
  }, [roundId, status])

  const submittedCount = evaluations.filter(
    (evaluation) => evaluation.status === 'submitted',
  ).length

  const pendingCount = evaluations.filter(
    (evaluation) => evaluation.status === 'pending',
  ).length

  const openEditModal = (evaluation: Evaluation) => {
    setEditingEvaluation(evaluation)
    setEditScore(
      evaluation.score === null
        ? ''
        : String(evaluation.score),
    )
    setEditRemarks(evaluation.remarks ?? '')
    setSaveError('')
    setSaveSuccess('')
  }

  const closeEditModal = () => {
    if (saving) {
      return
    }

    setEditingEvaluation(null)
    setEditScore('')
    setEditRemarks('')
    setSaveError('')
  }

  const handleSaveEvaluation = async () => {
    if (!editingEvaluation) {
      return
    }

    const score = Number(editScore)

    if (
      editScore.trim() === '' ||
      !Number.isInteger(score) ||
      score < 0 ||
      score > 100
    ) {
      setSaveError('Score must be an integer between 0 and 100.')
      return
    }

    try {
      setSaving(true)
      setSaveError('')
      setSaveSuccess('')

      const payload: EvaluationUpdate = {
        score,
        remarks: editRemarks.trim()
          ? editRemarks.trim()
          : null,
      }

      const response = await api.put<Evaluation>(
        `/admin/evaluations/${editingEvaluation.id}`,
        payload,
      )

      setEvaluations((current) =>
        current.map((evaluation) =>
          evaluation.id === response.data.id
            ? response.data
            : evaluation,
        ),
      )

      setSaveSuccess('Evaluation updated successfully.')

      setEditingEvaluation(null)
      setEditScore('')
      setEditRemarks('')
    } catch (requestError) {
      setSaveError(
        getErrorMessage(
          requestError,
          'Unable to update evaluation.',
        ),
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminLayout>
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.16em] text-gray-600">
              Admin Workspace
            </p>

            <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Evaluations
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Monitor submitted evaluations across teams and rounds.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <select
              value={roundId}
              onChange={(event) => setRoundId(event.target.value)}
              className="rounded-xl border border-white/10 bg-[#111827] px-4 py-2.5 text-sm text-gray-300 outline-none focus:border-white/25"
              aria-label="Filter by round"
            >
              <option value="">All rounds</option>

              {rounds.map((round) => (
                <option
                  key={round.id}
                  value={round.id}
                >
                  Round {round.round_number}: {round.name}
                </option>
              ))}
            </select>

            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="rounded-xl border border-white/10 bg-[#111827] px-4 py-2.5 text-sm text-gray-300 outline-none focus:border-white/25"
              aria-label="Filter by evaluation status"
            >
              <option value="">All statuses</option>
              <option value="submitted">Submitted</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>

        {saveSuccess && (
          <div className="mb-5 flex items-center gap-3 rounded-xl border border-white/10 bg-[#111827] px-4 py-3">
            <CheckCircle2
              size={17}
              className="shrink-0 text-gray-300"
            />

            <p className="text-sm text-gray-300">
              {saveSuccess}
            </p>

            <button
              type="button"
              onClick={() => setSaveSuccess('')}
              className="ml-auto rounded-lg p-1.5 text-gray-600 transition hover:bg-white/[0.05] hover:text-white"
              aria-label="Dismiss success message"
            >
              <X size={15} />
            </button>
          </div>
        )}

        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <SummaryCard
            label="Total evaluations"
            value={evaluations.length}
          />

          <SummaryCard
            label="Submitted"
            value={submittedCount}
          />

          <SummaryCard
            label="Pending"
            value={pendingCount}
          />
        </div>

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
          ) : evaluations.length === 0 ? (
            <div className="flex min-h-[320px] flex-col items-center justify-center px-6 text-center">
              <ClipboardCheck
                size={28}
                className="text-gray-600"
              />

              <p className="mt-4 text-sm text-gray-400">
                No evaluations yet
              </p>

              <p className="mt-2 max-w-sm text-xs leading-5 text-gray-600">
                Evaluations will appear after an evaluator submits marks.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1120px] text-left text-sm">
                <thead className="border-b border-white/10 text-[11px] uppercase tracking-[0.12em] text-gray-600">
                  <tr>
                    <th className="px-6 py-4 font-medium">
                      Team
                    </th>

                    <th className="px-6 py-4 font-medium">
                      Round
                    </th>

                    <th className="px-6 py-4 font-medium">
                      Evaluator
                    </th>

                    <th className="px-6 py-4 font-medium">
                      Score
                    </th>

                    <th className="px-6 py-4 font-medium">
                      Status
                    </th>

                    <th className="px-6 py-4 font-medium">
                      Submitted at
                    </th>

                    <th className="px-6 py-4 text-right font-medium">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/[0.06]">
                  {evaluations.map((evaluation) => (
                    <tr
                      key={evaluation.id}
                      className="transition hover:bg-white/[0.025]"
                    >
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-200">
                          {evaluation.team_name}
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          {evaluation.college_name}
                        </p>
                      </td>

                      <td className="px-6 py-4 text-gray-400">
                        Round {evaluation.round_number}

                        <p className="mt-1 text-xs text-gray-600">
                          {evaluation.round_name}
                        </p>
                      </td>

                      <td className="px-6 py-4 text-gray-400">
                        {evaluation.evaluator_name}
                      </td>

                      <td className="px-6 py-4 font-medium text-gray-200">
                        {evaluation.score === null
                          ? 'Not scored'
                          : `${evaluation.score} / 100`}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] ${
                            evaluation.status === 'submitted'
                              ? 'bg-emerald-400/10 text-emerald-300'
                              : 'bg-amber-400/10 text-amber-300'
                          }`}
                        >
                          {evaluation.status === 'submitted'
                            ? 'Submitted'
                            : 'Pending'}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-gray-500">
                        {formatDate(evaluation.created_at)}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              openEditModal(evaluation)
                            }
                            className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-gray-300 transition hover:border-white/25 hover:bg-white/[0.05] hover:text-white"
                          >
                            <Edit3 size={14} />
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setSelectedEvaluation(evaluation)
                            }
                            className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-gray-300 transition hover:border-white/25 hover:bg-white/[0.05] hover:text-white"
                          >
                            <Eye size={14} />
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {selectedEvaluation && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedEvaluation(null)
            }
          }}
        >
          <div
            className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#111827] p-6 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="evaluation-details-title"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.16em] text-gray-600">
                  Evaluation details
                </p>

                <h3
                  id="evaluation-details-title"
                  className="mt-2 text-xl font-semibold text-white"
                >
                  {selectedEvaluation.team_name}
                </h3>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedEvaluation(null)
                }
                className="rounded-lg p-2 text-gray-500 transition hover:bg-white/[0.05] hover:text-white"
                aria-label="Close evaluation details"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Detail
                label="College"
                value={selectedEvaluation.college_name}
              />

              <Detail
                label="Evaluator"
                value={selectedEvaluation.evaluator_name}
              />

              <Detail
                label="Round"
                value={`Round ${selectedEvaluation.round_number}: ${selectedEvaluation.round_name}`}
              />

              <Detail
                label="Score"
                value={
                  selectedEvaluation.score === null
                    ? 'Not scored'
                    : `${selectedEvaluation.score} / 100`
                }
              />

              <Detail
                label="Status"
                value={
                  selectedEvaluation.status === 'submitted'
                    ? 'Submitted'
                    : 'Pending'
                }
              />

              <Detail
                label="Updated"
                value={formatDate(
                  selectedEvaluation.updated_at,
                )}
              />
            </div>

            <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <p className="text-[11px] text-gray-600">
                Remarks
              </p>

              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-300">
                {selectedEvaluation.remarks ||
                  'No remarks provided'}
              </p>
            </div>

            <div className="mt-6 flex items-center gap-2 text-xs text-gray-600">
              <Clock3 size={14} />
              Submitted {formatDate(
                selectedEvaluation.created_at,
              )}
            </div>
          </div>
        </div>
      )}

      {editingEvaluation && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-4"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !saving
            ) {
              closeEditModal()
            }
          }}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#111827] p-6 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-evaluation-title"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.16em] text-gray-600">
                  Admin Override
                </p>

                <h3
                  id="edit-evaluation-title"
                  className="mt-2 text-xl font-semibold text-white"
                >
                  Edit Evaluation
                </h3>

                <p className="mt-2 text-sm text-gray-500">
                  {editingEvaluation.team_name} · Round{' '}
                  {editingEvaluation.round_number}
                </p>
              </div>

              <button
                type="button"
                onClick={closeEditModal}
                disabled={saving}
                className="rounded-lg p-2 text-gray-500 transition hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Close edit evaluation"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-6 space-y-5">
              <div>
                <label
                  htmlFor="edit-score"
                  className="text-xs font-medium text-gray-400"
                >
                  Score
                </label>

                <div className="mt-2 flex items-center gap-3">
                  <input
                    id="edit-score"
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={editScore}
                    onChange={(event) =>
                      setEditScore(event.target.value)
                    }
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-lg font-semibold text-white outline-none transition placeholder:text-gray-700 focus:border-white/25"
                    placeholder="0"
                  />

                  <span className="text-sm text-gray-600">
                    / 100
                  </span>
                </div>
              </div>

              <div>
                <label
                  htmlFor="edit-remarks"
                  className="text-xs font-medium text-gray-400"
                >
                  Remarks
                </label>

                <textarea
                  id="edit-remarks"
                  value={editRemarks}
                  onChange={(event) =>
                    setEditRemarks(event.target.value)
                  }
                  rows={5}
                  placeholder="Add or update evaluation remarks..."
                  className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-gray-700 focus:border-white/25"
                />
              </div>

              {saveError && (
                <div className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
                  <p className="text-sm text-gray-400">
                    {saveError}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeEditModal}
                disabled={saving}
                className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-gray-400 transition hover:border-white/20 hover:bg-white/[0.04] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveEvaluation}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? (
                  <Loader2
                    size={15}
                    className="animate-spin"
                  />
                ) : (
                  <Save size={15} />
                )}

                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

interface SummaryCardProps {
  label: string
  value: number
}

function SummaryCard({
  label,
  value,
}: SummaryCardProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#111827] p-5">
      <p className="text-xs text-gray-500">
        {label}
      </p>

      <p className="mt-3 text-3xl font-semibold tracking-tight text-white">
        {value}
      </p>
    </div>
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

      <p className="mt-2 break-words text-sm text-gray-300">
        {value}
      </p>
    </div>
  )
}