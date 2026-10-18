import { useCallback, useMemo, useState } from 'react'
import { AuthContext } from './auth'
import { authService } from '../services/mockApi'
import { ROLES } from '../data/constants'

/** Wraps the app and shares the logged-in user with every component. */
export default function AuthProvider({ children }) {
  // Lazy initial state: read the saved session once, synchronously.
  const [user, setUser] = useState(() => authService.getSession())

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

  const logout = useCallback(() => {
    authService.logout()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, login, register, logout, isAdmin: user?.role === ROLES.ADMIN }),
    [user, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}