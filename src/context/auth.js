import { createContext, useContext } from 'react'

/** Holds { user, login, register, logout, isAdmin }. Provided by <AuthProvider>. */
export const AuthContext = createContext(null)

/** Access the current user and auth actions from any component. */
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>')
  return context
}