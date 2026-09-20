import {
  Navigate,
  useLocation,
} from 'react-router-dom'

import {
  useAuth,
} from '../context/AuthContext'

type UserRole =
  | 'team'
  | 'evaluator'
  | 'admin'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRole?: UserRole
}

export default function ProtectedRoute({
  children,
  allowedRole,
}: ProtectedRouteProps) {
  const {
    isAuthenticated,
    role,
  } = useAuth()

  const location = useLocation()

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    )
  }

  if (
    allowedRole &&
    role !== allowedRole
  ) {
    if (role === 'admin') {
      return (
        <Navigate
          to="/admin/dashboard"
          replace
        />
      )
    }

    if (role === 'evaluator') {
      return (
        <Navigate
          to="/evaluator/dashboard"
          replace
        />
      )
    }

    return (
      <Navigate
        to="/dashboard"
        replace
      />
    )
  }

  return <>{children}</>
}