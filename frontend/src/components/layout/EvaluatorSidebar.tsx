import { LayoutDashboard } from 'lucide-react'

import PortalSidebar from './PortalSidebar'

interface EvaluatorSidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export default function EvaluatorSidebar({
  collapsed,
  onToggle,
}: EvaluatorSidebarProps) {
  return (
    <PortalSidebar
      portalLabel="Evaluator Portal"
      sectionLabel="Evaluation"
      navigationItems={[
        {
          label: 'Dashboard',
          path: '/evaluator/dashboard',
          icon: LayoutDashboard,
        },
      ]}
      collapsed={collapsed}
      onToggle={onToggle}
    />
  )
}