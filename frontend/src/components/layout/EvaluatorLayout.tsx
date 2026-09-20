import { useState } from 'react'

import EvaluatorSidebar from './EvaluatorSidebar'
import EvaluatorTopbar from './EvaluatorTopbar'

interface EvaluatorLayoutProps {
  children: React.ReactNode
}

export default function EvaluatorLayout({ children }: EvaluatorLayoutProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="min-h-screen bg-[#0b0f19] text-white">
      <div className="flex min-h-screen">
        <EvaluatorSidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed((value) => !value)}
        />
        <div className="min-w-0 flex-1">
          <EvaluatorTopbar />
          <main className="p-5 lg:p-8">{children}</main>
        </div>
      </div>
    </div>
  )
}