import {
  useEffect,
  useState,
} from 'react'

import {
  CheckCircle2,
  Layers3,
  Loader2,
  Plus,
  Power,
  X,
  XCircle,
} from 'lucide-react'

import AdminLayout from '../../components/layout/AdminLayout'
import api from '../../services/api'

interface Round {
  id: number
  name: string
  round_number: number
  description: string | null
  is_active: boolean
  created_at: string
}

interface RoundForm {
  name: string
  round_number: string
  description: string
}

const emptyForm: RoundForm = {
  name: '',
  round_number: '',
  description: '',
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

function formatDate(value: string) {
  return new Date(value).toLocaleDateString()
}

export default function AdminRounds() {
  const [rounds, setRounds] = useState<Round[]>([])
  const [form, setForm] = useState<RoundForm>(emptyForm)
  const [formOpen, setFormOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')

  const fetchRounds = () => api.get<Round[]>('/admin/rounds')

  const loadRounds = async () => {
    try {
      setError('')
      const response = await fetchRounds()
      setRounds(response.data)
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    }
  }

  useEffect(() => {
    fetchRounds()
      .then((response) => {
        setRounds(response.data)
        setLoading(false)
      })
      .catch((requestError) => {
        setError(getErrorMessage(requestError))
        setLoading(false)
      })
  }, [])

  const closeForm = () => {
    setFormOpen(false)
    setForm(emptyForm)
    setFormError('')
  }

  const createRound = async (event: React.FormEvent) => {
    event.preventDefault()

    const roundNumber = Number(form.round_number)

    if (!form.name.trim() || !form.round_number.trim()) {
      setFormError('Round name and round number are required.')
      return
    }

    if (!Number.isInteger(roundNumber) || roundNumber < 1) {
      setFormError('Round number must be a positive whole number.')
      return
    }

    try {
      setSaving(true)
      setFormError('')

      await api.post('/admin/rounds', {
        name: form.name.trim(),
        round_number: roundNumber,
        description: form.description.trim() || null,
      })

      closeForm()
      await loadRounds()
    } catch (requestError) {
      setFormError(getErrorMessage(requestError))
    } finally {
      setSaving(false)
    }
  }

  const updateStatus = async (round: Round) => {
    const nextStatus = !round.is_active

    if (
      round.is_active &&
      !window.confirm(
        `Deactivate ${round.name}? Evaluator submissions will be paused until a round is active again.`,
      )
    ) {
      return
    }

    try {
      setError('')

      const response = await api.patch<Round>(
        `/admin/rounds/${round.id}/status`,
        { is_active: nextStatus },
      )

      setRounds((current) =>
        current.map((item) =>
          item.id === response.data.id
            ? response.data
            : nextStatus
              ? { ...item, is_active: false }
              : item,
        ),
      )
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    }
  }

  return (
    <AdminLayout>
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.16em] text-gray-600">
              Admin Workspace
            </p>

            <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Rounds
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Manage hackathon rounds and control the active evaluation round.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setForm(emptyForm)
              setFormError('')
              setFormOpen(true)
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-[#000000] transition hover:bg-gray-200"
          >
            <Plus size={16} />
            Create round
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-400/20 bg-red-400/5 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#111827]">
          {loading ? (
            <div className="flex min-h-[320px] items-center justify-center">
              <Loader2 size={22} className="animate-spin text-gray-500" />
            </div>
          ) : rounds.length === 0 ? (
            <div className="flex min-h-[320px] flex-col items-center justify-center px-6 text-center">
              <Layers3 size={28} className="text-gray-600" />
              <p className="mt-4 text-sm text-gray-400">No rounds created yet.</p>
              <button
                type="button"
                onClick={() => setFormOpen(true)}
                className="mt-4 inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-gray-300 transition hover:bg-white/[0.05] hover:text-white"
              >
                <Plus size={16} />
                Create round
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="border-b border-white/10 text-[11px] uppercase tracking-[0.12em] text-gray-600">
                  <tr>
                    <th className="px-6 py-4 font-medium">Round</th>
                    <th className="px-6 py-4 font-medium">Description</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Created</th>
                    <th className="px-6 py-4 text-right font-medium">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/[0.06]">
                  {rounds.map((round) => (
                    <tr
                      key={round.id}
                      className="transition hover:bg-white/[0.025]"
                    >
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-200">
                          Round {round.round_number}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {round.name}
                        </p>
                      </td>
                      <td className="max-w-md px-6 py-4 text-gray-400">
                        <p className="truncate">
                          {round.description || 'No description provided'}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] ${
                            round.is_active
                              ? 'bg-emerald-400/10 text-emerald-300'
                              : 'bg-white/[0.06] text-gray-500'
                          }`}
                        >
                          {round.is_active ? (
                            <CheckCircle2 size={13} />
                          ) : (
                            <XCircle size={13} />
                          )}
                          {round.is_active ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {formatDate(round.created_at)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => updateStatus(round)}
                          className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-gray-300 transition hover:border-white/25 hover:bg-white/[0.05] hover:text-white"
                        >
                          <Power size={14} />
                          {round.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {formOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeForm()
            }
          }}
        >
          <form
            onSubmit={createRound}
            className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#111827] p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.16em] text-gray-600">
                  Round management
                </p>
                <h3 className="mt-2 text-xl font-semibold text-white">
                  Create round
                </h3>
              </div>

              <button
                type="button"
                onClick={closeForm}
                className="rounded-lg p-2 text-gray-500 transition hover:bg-white/[0.05] hover:text-white"
                aria-label="Close round form"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <label className="block">
                <span className="text-xs text-gray-500">Round name</span>
                <input
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none placeholder:text-gray-600 focus:border-white/25"
                  placeholder="Idea Presentation"
                />
              </label>

              <label className="block">
                <span className="text-xs text-gray-500">Round number</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={form.round_number}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      round_number: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none placeholder:text-gray-600 focus:border-white/25"
                  placeholder="1"
                />
              </label>

              <label className="block">
                <span className="text-xs text-gray-500">Description</span>
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  className="mt-2 min-h-28 w-full resize-y rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none placeholder:text-gray-600 focus:border-white/25"
                  placeholder="Describe this evaluation round"
                />
              </label>
            </div>

            {formError && (
              <p className="mt-4 text-sm text-red-300">{formError}</p>
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
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-[#000000] transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving && <Loader2 size={16} className="animate-spin" />}
                Create round
              </button>
            </div>
          </form>
        </div>
      )}
    </AdminLayout>
  )
}