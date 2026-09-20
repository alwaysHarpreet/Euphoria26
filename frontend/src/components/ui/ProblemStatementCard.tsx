import {
  Check,
  ChevronRight,
  Clock3,
  Users,
} from 'lucide-react'

import WorkspaceCard from './WorkspaceCard'

interface ProblemStatementCardProps {
  number: number
  title: string
  description: string
  isActive: boolean
  selectedCount: number
  capacity: number
  isSelected: boolean
  isLocked: boolean
  isSelecting: boolean
  onSelect: () => void
}

export default function ProblemStatementCard({
  number,
  title,
  description,
  isActive,
  selectedCount,
  capacity,
  isSelected,
  isLocked,
  isSelecting,
  onSelect,
}: ProblemStatementCardProps) {
  const isFull = selectedCount >= capacity
  const selectionText = `${selectedCount}/${capacity}`

  return (
    <WorkspaceCard
      selected={isSelected}
      className="min-h-[362px]"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1d2737] text-sm font-semibold text-gray-200">
            {String(number).padStart(2, '0')}
          </div>

          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-[#64748b]">
              Problem Statement
            </p>

            <h2 className="mt-1 text-base font-semibold leading-6 text-white">
              {title}
            </h2>
          </div>
        </div>

        {isSelected && (
          <div className="flex shrink-0 items-center gap-1.5 rounded-lg border border-emerald-400/20 bg-emerald-400/[0.05] px-2.5 py-1.5">
            <Check
              size={13}
              className="text-emerald-300"
            />

            <span className="text-[11px] font-medium text-emerald-300">
              Selected
            </span>
          </div>
        )}
      </div>

      {/* Description */}
      <p className="mt-7 min-h-[72px] text-sm leading-6 text-[#7183a0]">
        {description}
      </p>

      {/* Meta */}
      <div className="mt-7 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-lg bg-[#182132] px-3 py-2">
          <Users
            size={14}
            className="text-[#71809a]"
          />

          <span className="text-xs text-[#71809a]">
            Team selection
          </span>
        </div>

        <div
          className={[
            'flex items-center gap-2 rounded-lg px-3 py-2',
            isFull
              ? 'bg-red-500/[0.10]'
              : 'bg-[#182132]',
          ].join(' ')}
        >
          <Users
            size={14}
            className={
              isFull
                ? 'text-red-300'
                : 'text-[#71809a]'
            }
          />

          <span
            className={
              isFull
                ? 'text-xs font-medium text-red-300'
                : 'text-xs text-[#71809a]'
            }
          >
            {selectionText}
          </span>
        </div>

        <div className="flex items-center gap-2 rounded-lg bg-[#182132] px-3 py-2">
          <Clock3
            size={14}
            className="text-[#71809a]"
          />

          <span className="text-xs text-[#71809a]">
            {isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      {/* Action */}
      <div className="mt-6 border-t border-[#273247] pt-5">
        {isSelected ? (
          <button
            type="button"
            disabled
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#202a3a] text-sm font-medium text-[#8ca0bd]"
          >
            <Check size={16} />
            Problem Selected
          </button>
        ) : isLocked ? (
          <button
            type="button"
            disabled
            className="flex h-12 w-full items-center justify-center rounded-xl border border-[#293448] bg-transparent text-sm font-medium text-[#51627d]"
          >
            Selection Locked
          </button>
        ) : isFull ? (
          <button
            type="button"
            disabled
            className="flex h-12 w-full items-center justify-center rounded-xl bg-red-500/[0.10] text-sm font-semibold text-red-300"
          >
            Selection Full
          </button>
        ) : (
          <button
            type="button"
            onClick={onSelect}
            disabled={isSelecting}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-white text-sm font-semibold text-[#000000] transition-colors hover:bg-[#f1f3f5] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSelecting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#000000]/20 border-t-[#000000]" />
                Selecting...
              </>
            ) : (
              <>
                Select Problem
                <ChevronRight size={16} />
              </>
            )}
          </button>
        )}
      </div>
    </WorkspaceCard>
  )
}