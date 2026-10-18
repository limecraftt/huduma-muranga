import { useCallback, useEffect, useMemo, useState } from 'react'
import { AuthContext } from './auth'
import { authService } from '../services/authService'
import { ROLES } from '../data/constants'

/** Wraps the app and shares the logged-in user with every component. */
export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  // True until we know whether a saved session exists (avoids a login-page flash on refresh)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    authService
      .getCurrentUser()
      .then((current) => active && setUser(current))
      .catch(() => active && setUser(null))
      .finally(() => active && setLoading(false))

    const unsubscribe = authService.onSignedOut(() => active && setUser(null))
    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  const login = useCallback(async (credentials) => {
    const loggedIn = await authService.login(credentials)
    setUser(loggedIn)
    return loggedIn
  }, [])

  const register = useCallback(async (details) => {
    const created = await authService.register(details)
    setUser(created)
    return created
  }, [])

  const logout = useCallback(async () => {
    await authService.logout()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, loading, login, register, logout, isAdmin: user?.role === ROLES.ADMIN }),
    [user, loading, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}