import { useCallback } from 'react'
import { requestService } from '../services/requestService'
import { useLiveList } from './useLiveList'

/**
 * Loads service requests.
 *   useRequests()        -> every request (admin, landing page stats)
 *   useRequests(userId)  -> only that citizen's requests
 * Stays up to date by itself (see useLiveList).
 * Returns { requests, loading, error, reload }.
 */
export function useRequests(userId) {
  const fetchRequests = useCallback(
    () => (userId ? requestService.listForUser(userId) : requestService.list()),
    [userId],
  )
  const { items, loading, error, reload } = useLiveList(fetchRequests, 'Could not load requests.')
  return { requests: items, loading, error, reload }
}