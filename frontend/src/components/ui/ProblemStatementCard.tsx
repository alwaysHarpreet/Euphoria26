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
  isActive: boolean
  selectedCount: number
  capacity: number
  isSelected: boolean
  isLocked: boolean
  onView: () => void
}

export default function ProblemStatementCard({
  number,
  title,
  isActive,
  selectedCount,
  capacity,
  isSelected,
  isLocked,
  onView,
}: ProblemStatementCardProps) {
  const isFull = selectedCount >= capacity
  const selectionText = `${selectedCount}/${capacity}`

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onView}
      onKeyDown={(event) => {
        if (
          event.key === 'Enter' ||
          event.key === ' '
        ) {
          event.preventDefault()
          onView()
        }
      }}
      className="cursor-pointer outline-none"
      aria-label={`View problem statement: ${title}`}
    >
      <WorkspaceCard
        selected={isSelected}
        className="flex h-[365px] flex-col transition-colors hover:border-white/20"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1d2737] text-sm font-semibold text-gray-200">
              {String(number).padStart(2, '0')}
            </div>

            <div className="min-w-0">
              <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-[#64748b]">
                Problem Statement
              </p>

              <h2 className="mt-1 line-clamp-2 text-base font-semibold leading-6 text-white">
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

        <div className="mt-10 flex items-center gap-2 text-xs text-[#7183a0]">
          <span className="text-[#64748b]">
            Click to view the complete problem statement
          </span>

          <ChevronRight size={14} />
        </div>

        <div className="mt-7 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg bg-[#182132] px-3 py-2">
            <Users size={14} className="text-[#71809a]" />

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
            <Clock3 size={14} className="text-[#71809a]" />

            <span className="text-xs text-[#71809a]">
              {isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>

        <div className="mt-auto border-t border-[#273247] pt-5">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              onView()
            }}
            className={[
              'flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-colors',
              isSelected
                ? 'bg-[#202a3a] text-[#8ca0bd] hover:bg-[#273247]'
                : isLocked
                  ? 'border border-[#293448] bg-transparent text-[#71809a] hover:bg-white/[0.03]'
                  : 'bg-white text-[#000000] hover:bg-[#f1f3f5]',
            ].join(' ')}
          >
            {isSelected ? (
              <>
                <Check size={16} />
                View Selected Problem
              </>
            ) : (
              <>
                View Problem Statement
                <ChevronRight size={16} />
              </>
            )}
          </button>
        </div>
      </WorkspaceCard>
    </div>
  )
}