import {
  useEffect,
  useState,
} from 'react'

import {
  CheckCircle2,
  Loader2,
  Plus,
  UserRoundCheck,
  X,
  XCircle,
} from 'lucide-react'

import AdminLayout from '../../components/layout/AdminLayout'
import api from '../../services/api'

interface Evaluator {
  id: number
  name: string
  email: string
  is_active: boolean
  created_at: string
}

interface EvaluatorForm {
  name: string
  email: string
  password: string
}

const emptyForm: EvaluatorForm = {
  name: '',
  email: '',
  password: '',
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

export default function AdminEvaluators() {
  const [evaluators, setEvaluators] = useState<Evaluator[]>([])
  const [form, setForm] = useState<EvaluatorForm>(emptyForm)
  const [formOpen, setFormOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')

  const fetchEvaluators = () =>
    api.get<Evaluator[]>('/admin/evaluators')

  const loadEvaluators = async () => {
    try {
      setError('')

      const response = await fetchEvaluators()
      setEvaluators(response.data)
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    }
  }

  useEffect(() => {
    fetchEvaluators()
      .then((response) => {
        setEvaluators(response.data)
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

  const createEvaluator = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!form.name.trim() || !form.email.trim() || !form.password) {
      setFormError('Name, email, and password are required.')
      return
    }

    try {
      setSaving(true)
      setFormError('')

      await api.post('/admin/evaluators', {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      })

      closeForm()
      await loadEvaluators()
    } catch (requestError) {
      setFormError(getErrorMessage(requestError))
    } finally {
      setSaving(false)
    }
  }

  const updateStatus = async (evaluator: Evaluator) => {
    const nextStatus = !evaluator.is_active

    if (
      !nextStatus &&
      !window.confirm(
        `Deactivate ${evaluator.name}? They will no longer be able to log in.`,
      )
    ) {
      return
    }

    try {
      setError('')

      const response = await api.patch<Evaluator>(
        `/admin/evaluators/${evaluator.id}/status`,
        { is_active: nextStatus },
      )

      setEvaluators((current) =>
        current.map((item) =>
          item.id === response.data.id ? response.data : item,
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
              Evaluators
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Manage the accounts that review team submissions.
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
            Add evaluator
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
          ) : evaluators.length === 0 ? (
            <div className="flex min-h-[320px] flex-col items-center justify-center px-6 text-center">
              <UserRoundCheck size={28} className="text-gray-600" />
              <p className="mt-4 text-sm text-gray-400">
                No evaluators have been created yet.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b border-white/10 text-[11px] uppercase tracking-[0.12em] text-gray-600">
                  <tr>
                    <th className="px-6 py-4 font-medium">Name</th>
                    <th className="px-6 py-4 font-medium">Email</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Created</th>
                    <th className="px-6 py-4 text-right font-medium">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/[0.06]">
                  {evaluators.map((evaluator) => (
                    <tr
                      key={evaluator.id}
                      className="transition hover:bg-white/[0.025]"
                    >
                      <td className="px-6 py-4 font-medium text-gray-200">
                        {evaluator.name}
                      </td>
                      <td className="px-6 py-4 text-gray-400">
                        {evaluator.email}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] ${
                            evaluator.is_active
                              ? 'bg-emerald-400/10 text-emerald-300'
                              : 'bg-white/[0.06] text-gray-500'
                          }`}
                        >
                          {evaluator.is_active ? (
                            <CheckCircle2 size={13} />
                          ) : (
                            <XCircle size={13} />
                          )}
                          {evaluator.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {new Date(evaluator.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => updateStatus(evaluator)}
                          className="rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-gray-300 transition hover:border-white/25 hover:bg-white/[0.05] hover:text-white"
                        >
                          {evaluator.is_active ? 'Deactivate' : 'Activate'}
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
            onSubmit={createEvaluator}
            className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#111827] p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.16em] text-gray-600">
                  Evaluator management
                </p>
                <h3 className="mt-2 text-xl font-semibold text-white">
                  Add evaluator
                </h3>
              </div>

              <button
                type="button"
                onClick={closeForm}
                className="rounded-lg p-2 text-gray-500 transition hover:bg-white/[0.05] hover:text-white"
                aria-label="Close evaluator form"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <label className="block">
                <span className="text-xs text-gray-500">Name</span>
                <input
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none placeholder:text-gray-600 focus:border-white/25"
                  placeholder="Evaluator name"
                />
              </label>

              <label className="block">
                <span className="text-xs text-gray-500">Email</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none placeholder:text-gray-600 focus:border-white/25"
                  placeholder="evaluator@example.com"
                />
              </label>

              <label className="block">
                <span className="text-xs text-gray-500">Password</span>
                <input
                  type="password"
                  value={form.password}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      password: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none placeholder:text-gray-600 focus:border-white/25"
                  placeholder="Minimum 8 characters"
                  minLength={8}
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
                Create evaluator
              </button>
            </div>
          </form>
        </div>
      )}
    </AdminLayout>
  )
}