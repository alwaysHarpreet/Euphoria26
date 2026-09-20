import { ShieldCheck } from 'lucide-react'

import { useAuth } from '../../context/AuthContext'

export default function AdminTopbar() {
  const { role } = useAuth()

  return (
    <header className="flex h-[72px] items-center justify-between border-b border-white/10 bg-[#0b0f19] px-5 lg:px-8">
      <div>
        <p className="text-xs text-gray-500">
          Administration
        </p>

        <h1 className="mt-0.5 text-sm font-semibold text-white">
          HackOddsey Control Center
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 sm:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />

          <span className="text-[11px] text-gray-400">
            System Online
          </span>
        </div>

        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04]">
          <ShieldCheck
            size={17}
            strokeWidth={1.8}
            className="text-gray-400"
          />
        </div>

        <div className="hidden sm:block">
          <p className="text-xs font-medium text-gray-300">
            Administrator
          </p>

          <p className="text-[10px] text-gray-600">
            {role === 'admin'
              ? 'Admin Access'
              : 'Restricted'}
          </p>
        </div>
      </div>
    </header>
  )
}