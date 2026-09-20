import type { ReactNode } from 'react'

interface WorkspaceCardProps {
  children: ReactNode
  className?: string
  selected?: boolean
}

export default function WorkspaceCard({
  children,
  className = '',
  selected = false,
}: WorkspaceCardProps) {
  return (
    <div
      className={[
        'relative overflow-hidden rounded-2xl border bg-[#111827] p-6',
        'transition-colors duration-200',
        selected
          ? 'border-white/20'
          : 'border-white/10 hover:border-white/15',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  )
}