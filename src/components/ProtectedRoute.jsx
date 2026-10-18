import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Spinner } from './ui'
import { useAuth } from '../context/auth'

/**
 * Guards a group of routes.
 *   <ProtectedRoute />            any logged-in user
 *   <ProtectedRoute adminOnly />  admins only (citizens go to /dashboard)
 */
export default function ProtectedRoute({ adminOnly = false }) {
  const { user, isAdmin, loading } = useAuth()
  const location = useLocation()

  if (loading) return <Spinner label="Checking your session…" />
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (adminOnly && !isAdmin) return <Navigate to="/dashboard" replace />
  if (!adminOnly && isAdmin) return <Navigate to="/admin" replace />
  return <Outlet />
}