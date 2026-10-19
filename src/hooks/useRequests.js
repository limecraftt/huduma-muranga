import { useCallback, useEffect, useState } from 'react'
import { requestService } from '../services/requestService'

/** How often an open dashboard checks for new or changed requests. */
const REFRESH_MS = 30_000

/**
 * Loads service requests.
 *   useRequests()        -> every request (admin, landing page stats)
 *   useRequests(userId)  -> only that citizen's requests
 * Refreshes by itself every 30 seconds and whenever the tab becomes visible again,
 * so an admin sees new requests without reloading the page.
 * Returns { requests, loading, error, reload }.
 */
export function useRequests(userId) {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      setRequests(userId ? await requestService.listForUser(userId) : await requestService.list())
      setError('')
    } catch (err) {
      setError(err.message || 'Could not load requests.')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === 'visible') load()
    }
    const timer = setInterval(refresh, REFRESH_MS)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [load])

  return { requests, loading, error, reload: load }
}