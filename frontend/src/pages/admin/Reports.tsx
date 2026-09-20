import { useState } from 'react'
import type { ReactNode } from 'react'

import {
  CheckCircle2,
  ClipboardCheck,
  Download,
  FileText,
  Loader2,
  Users,
  XCircle,
} from 'lucide-react'

import AdminLayout from '../../components/layout/AdminLayout'
import api from '../../services/api'

type ReportType = 'evaluations' | 'teams'

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

  return 'Unable to download the report.'
}

export default function AdminReports() {
  const [downloading, setDownloading] =
    useState<ReportType | null>(null)
  const [error, setError] = useState('')

  const downloadReport = async (reportType: ReportType) => {
    try {
      setDownloading(reportType)
      setError('')

      const response = await api.get<Blob>(
        `/admin/reports/${reportType}.csv`,
        { responseType: 'blob' },
      )

      const url = window.URL.createObjectURL(response.data)
      const link = document.createElement('a')
      link.href = url
      link.download =
        reportType === 'evaluations'
          ? 'hackoddsey_evaluations.csv'
          : 'hackoddsey_teams.csv'
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setDownloading(null)
    }
  }

  return (
    <AdminLayout>
      <div className="mx-auto max-w-[1100px]">
        <div className="mb-8">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.16em] text-gray-600">
            Admin Workspace
          </p>

          <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Reports
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Export HackOddsey data and evaluation records.
          </p>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-400/20 bg-red-400/5 px-4 py-3 text-sm text-red-300">
            <XCircle size={17} />
            {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <ReportCard
            icon={<ClipboardCheck size={20} />}
            title="Evaluation Report"
            description="Export submitted evaluation records with team, round, evaluator and score details."
            loading={downloading === 'evaluations'}
            disabled={downloading !== null}
            onDownload={() => downloadReport('evaluations')}
          />

          <ReportCard
            icon={<Users size={20} />}
            title="Team Report"
            description="Export registered team information and problem-selection details."
            loading={downloading === 'teams'}
            disabled={downloading !== null}
            onDownload={() => downloadReport('teams')}
          />
        </div>

        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-white/10 bg-[#111827] p-5">
          <FileText size={18} className="mt-0.5 shrink-0 text-gray-500" />
          <div>
            <p className="text-sm text-gray-300">CSV exports use live database data.</p>
            <p className="mt-1 text-xs leading-5 text-gray-600">
              Reports include the latest teams and evaluation records available to the administrator.
            </p>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

interface ReportCardProps {
  icon: ReactNode
  title: string
  description: string
  loading: boolean
  disabled: boolean
  onDownload: () => void
}

function ReportCard({
  icon,
  title,
  description,
  loading,
  disabled,
  onDownload,
}: ReportCardProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#111827] p-6">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.05] text-gray-400">
        {icon}
      </div>

      <h3 className="mt-5 text-base font-semibold text-white">{title}</h3>
      <p className="mt-2 min-h-12 text-sm leading-6 text-gray-500">
        {description}
      </p>

      <button
        type="button"
        onClick={onDownload}
        disabled={disabled}
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-[#000000] transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Download size={16} />
        )}
        {loading ? 'Downloading...' : 'Download CSV'}
      </button>

      <div className="mt-5 flex items-center gap-2 text-[11px] text-gray-600">
        <CheckCircle2 size={14} />
        Authenticated admin export
      </div>
    </div>
  )
}