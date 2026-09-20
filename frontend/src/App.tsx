import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom'

import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './routes/ProtectedRoute'
import RoleSelection from './pages/auth/RoleSelection'

// Team
import TeamLogin from './pages/auth/Login'
import Dashboard from './pages/team/Dashboard'
import ProblemSelection from './pages/team/ProblemSelection'
import RepositoryFeedback from './pages/team/RepositoryFeedback'
import Team from './pages/team/Team'

// Evaluator
import EvaluatorLogin from './pages/evaluator/Login'
import EvaluatorDashboard from './pages/evaluator/Dashboard'
import Evaluation from './pages/evaluator/Evaluation'

// Admin
import AdminLogin from './pages/admin/Login'
import AdminDashboard from './pages/admin/Dashboard'
import AdminTeams from './pages/admin/Teams'
import AdminProblems from './pages/admin/Problems'
import AdminEvaluators from './pages/admin/Evaluators'
import AdminEvaluations from './pages/admin/Evaluations'
import AdminReports from './pages/admin/Reports'
import AdminRounds from './pages/admin/Rounds'
import Leaderboard from './pages/leaderboard/Leaderboard'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>

          {/* =========================
              TEAM AUTHENTICATION
          ========================= */}

          <Route
            path="/login"
            element={<RoleSelection />}
          />

          <Route
            path="/team/login"
            element={<TeamLogin />}
          />

          {/* =========================
              EVALUATOR AUTHENTICATION
          ========================= */}

          <Route
            path="/evaluator/login"
            element={<EvaluatorLogin />}
          />

          {/* =========================
              ADMIN AUTHENTICATION
          ========================= */}

          <Route
            path="/admin/login"
            element={<AdminLogin />}
          />

          {/* =========================
              TEAM
          ========================= */}

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRole="team">
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/problems"
            element={
              <ProtectedRoute allowedRole="team">
                <ProblemSelection />
              </ProtectedRoute>
            }
          />

          <Route
            path="/team"
            element={
              <ProtectedRoute allowedRole="team">
                <Team />
              </ProtectedRoute>
            }
          />

          <Route
            path="/repository-feedback"
            element={
              <ProtectedRoute allowedRole="team">
                <RepositoryFeedback />
              </ProtectedRoute>
            }
          />

          {/* =========================
              EVALUATOR
          ========================= */}

          <Route
            path="/evaluator/dashboard"
            element={
              <ProtectedRoute allowedRole="evaluator">
                <EvaluatorDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/evaluator/rounds/:roundId/teams/:teamId/evaluate"
            element={
              <ProtectedRoute allowedRole="evaluator">
                <Evaluation />
              </ProtectedRoute>
            }
          />

          {/* =========================
              ADMIN
          ========================= */}

          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/teams"
            element={
              <ProtectedRoute allowedRole="admin">
                <AdminTeams />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/problems"
            element={
              <ProtectedRoute allowedRole="admin">
                <AdminProblems />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/evaluators"
            element={
              <ProtectedRoute allowedRole="admin">
                <AdminEvaluators />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/evaluations"
            element={
              <ProtectedRoute allowedRole="admin">
                <AdminEvaluations />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/reports"
            element={
              <ProtectedRoute allowedRole="admin">
                <AdminReports />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/rounds"
            element={
              <ProtectedRoute allowedRole="admin">
                <AdminRounds />
              </ProtectedRoute>
            }
          />

          <Route
            path="/leaderboard"
            element={<Leaderboard />}
          />

          {/* =========================
              DEFAULT
          ========================= */}

          <Route
            path="/"
            element={
              <Navigate
                to="/login"
                replace
              />
            }
          />

          {/* =========================
              UNKNOWN ROUTES
          ========================= */}

          <Route
            path="*"
            element={
              <Navigate
                to="/login"
                replace
              />
            }
          />

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App