import {
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react'
import {
  NavLink,
  useNavigate,
} from 'react-router-dom'

import { useAuth } from '../../context/AuthContext'

export interface PortalNavigationItem {
  label: string
  path: string
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>
}

interface PortalSidebarProps {
  portalLabel: string
  sectionLabel: string
  navigationItems: PortalNavigationItem[]
  collapsed: boolean
  onToggle: () => void
}

export default function PortalSidebar({
  portalLabel,
  sectionLabel,
  navigationItems,
  collapsed,
  onToggle,
}: PortalSidebarProps) {
  const { logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <aside
      className={`flex min-h-screen flex-col border-r border-white/10 bg-[#0d111c] transition-all duration-200 ${
        collapsed ? 'w-[76px]' : 'w-[250px]'
      }`}
    >
      <div
        className={`flex h-[72px] items-center border-b border-white/10 ${
          collapsed ? 'justify-center' : 'px-5'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-xs font-bold text-[#000000]">
            HO
          </div>

          {!collapsed && (
            <div>
              <h1 className="text-sm font-semibold tracking-tight text-white">
                HackOddsey
              </h1>
              <p className="mt-0.5 text-[9px] uppercase tracking-[0.14em] text-gray-500">
                {portalLabel}
              </p>
            </div>
          )}
        </div>
      </div>

      <nav className="space-y-1 px-3 py-5">
        {!collapsed && (
          <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-600">
            {sectionLabel}
          </p>
        )}

        {navigationItems.map((item) => {
          const Icon = item.icon

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `group flex items-center rounded-xl px-3 py-2.5 text-xs font-medium transition ${
                  isActive
                    ? 'bg-white/[0.08] text-white'
                    : 'text-gray-500 hover:bg-white/[0.04] hover:text-gray-300'
                } ${collapsed ? 'justify-center' : 'gap-3'}`
              }
              title={collapsed ? item.label : undefined}
            >
              <Icon size={17} strokeWidth={1.8} />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          )
        })}
      </nav>

      <div className="mt-8 border-t border-white/10 p-3">
        <button
          type="button"
          onClick={onToggle}
          className={`mb-1 flex w-full items-center rounded-xl px-3 py-2.5 text-xs font-medium text-gray-500 transition hover:bg-white/[0.04] hover:text-gray-300 ${
            collapsed ? 'justify-center' : 'gap-3'
          }`}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <PanelLeftOpen size={17} strokeWidth={1.8} />
          ) : (
            <>
              <PanelLeftClose size={17} strokeWidth={1.8} />
              <span>Collapse</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleLogout}
          className={`flex w-full items-center rounded-xl px-3 py-2.5 text-xs font-medium text-gray-500 transition hover:bg-white/[0.04] hover:text-gray-300 ${
            collapsed ? 'justify-center' : 'gap-3'
          }`}
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut size={17} strokeWidth={1.8} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  )
}