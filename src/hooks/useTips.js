import { tipService } from '../services/tipService'
import { useLiveList } from './useLiveList'

const fetchTips = () => tipService.list()

/**
 * Admin only: every anonymous crime tip, kept up to date by itself.
 * Returns { tips, loading, error, reload }.
 */
export function useTips() {
  const { items, loading, error, reload } = useLiveList(fetchTips, 'Could not load tips.')
  return { tips: items, loading, error, reload }
}