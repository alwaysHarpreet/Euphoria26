import {
  ClipboardList,
  GitBranch,
  LayoutDashboard,
  Trophy,
  Users,
} from 'lucide-react'

import PortalSidebar from './PortalSidebar'

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

const navigationItems = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/dashboard',
  },
  {
    label: 'Problem Statement',
    icon: ClipboardList,
    path: '/problems',
  },
  {
    label: 'Team',
    icon: Users,
    path: '/team',
  },
  {
    label: 'Repository & Feedback',
    icon: GitBranch,
    path: '/repository-feedback',
  },
  {
    label: 'Leaderboard',
    icon: Trophy,
    path: '/leaderboard',
  },
]

export default function Sidebar({
  collapsed,
  onToggle,
}: SidebarProps) {
  return (
    <PortalSidebar
      portalLabel="Team Portal"
      sectionLabel="Participation"
      navigationItems={navigationItems}
      collapsed={collapsed}
      onToggle={onToggle}
    />
  )
}