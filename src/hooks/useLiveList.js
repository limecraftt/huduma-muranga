import { useCallback, useEffect, useState } from 'react'

/** How often an open dashboard checks for new or changed items. */
const REFRESH_MS = 30_000

/**
 * Loads a list with `fetcher` and keeps it fresh: it reloads every 30 seconds and
 * whenever the tab becomes visible again, so nobody has to refresh the page.
 * `fetcher` must be a stable function (module-level or wrapped in useCallback).
 * Returns { items, loading, error, reload }.
 */
export function useLiveList(fetcher, fallbackError = 'Could not load the list.') {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      setItems(await fetcher())
      setError('')
    } catch (err) {
      setError(err.message || fallbackError)
    } finally {
      setLoading(false)
    }
  }, [fetcher, fallbackError])

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

  return { items, loading, error, reload: load }
}