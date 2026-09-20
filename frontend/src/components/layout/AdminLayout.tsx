import { useState } from 'react'

import AdminSidebar from './AdminSidebar'
import AdminTopbar from './AdminTopbar'

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({
  children,
}: AdminLayoutProps) {
  const [collapsed, setCollapsed] =
    useState(false)

  return (
    <div className="min-h-screen bg-[#0b0f19] text-white">
      <div className="flex min-h-screen">
        <AdminSidebar
          collapsed={collapsed}
          onToggle={() =>
            setCollapsed(
              (value) => !value,
            )
          }
        />

        <div className="min-w-0 flex-1">
          <AdminTopbar />

          <main className="p-5 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}