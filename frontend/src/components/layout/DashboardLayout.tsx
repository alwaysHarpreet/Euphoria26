import { useState } from 'react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="min-h-screen bg-[#0b0f19] text-white">
      <div className="flex min-h-screen">
        <Sidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed((value) => !value)}
        />

        <div className="min-w-0 flex-1">
          <Topbar />

          <main className="p-5 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}