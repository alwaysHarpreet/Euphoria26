import {
  createContext,
  useContext,
  useState,
} from 'react'
import type { ReactNode } from 'react'

type UserRole = 'team' | 'evaluator' | 'admin'

function getStoredRole(): UserRole | null {
  const storedRole = localStorage.getItem('hackoddsey_role')

  if (
    storedRole === 'team' ||
    storedRole === 'evaluator' ||
    storedRole === 'admin'
  ) {
    return storedRole
  }

  localStorage.removeItem('hackoddsey_token')
  localStorage.removeItem('hackoddsey_role')
  return null
}

interface AuthContextType {
  token: string | null
  role: UserRole | null
  isAuthenticated: boolean
  login: (
    accessToken: string,
    userRole: UserRole,
  ) => void
  logout: () => void
}

const AuthContext = createContext<
  AuthContextType | undefined
>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({
  children,
}: AuthProviderProps) {
  const [token, setToken] = useState<string | null>(() => {
    getStoredRole()
    return localStorage.getItem('hackoddsey_token')
  })

  const [role, setRole] = useState<UserRole | null>(() => {
    return getStoredRole()
  })

  const login = (
    accessToken: string,
    userRole: UserRole,
  ) => {
    localStorage.setItem(
      'hackoddsey_token',
      accessToken,
    )

    localStorage.setItem(
      'hackoddsey_role',
      userRole,
    )

    setToken(accessToken)
    setRole(userRole)
  }

  const logout = () => {
    localStorage.removeItem('hackoddsey_token')
    localStorage.removeItem('hackoddsey_role')

    setToken(null)
    setRole(null)
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        role,
        isAuthenticated: Boolean(token && role),
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error(
      'useAuth must be used inside AuthProvider',
    )
  }

  return context
}