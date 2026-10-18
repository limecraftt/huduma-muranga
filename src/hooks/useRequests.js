import { useCallback, useEffect, useState } from 'react'
import { requestService } from '../services/mockApi'

/**
 * Loads service requests.
 *   useRequests()        -> every request (admin, landing page stats)
 *   useRequests(userId)  -> only that citizen's requests
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

  return { requests, loading, error, reload: load }
}