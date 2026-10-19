import { CATEGORIES, STATUS } from '../data/constants'

/** Numbers for the dashboards (pure function, easy to test). */
export function computeStats(requests) {
  const count = (status) => requests.filter((r) => r.status === status).length
  const pending = count(STATUS.PENDING)
  const inProgress = count(STATUS.IN_PROGRESS)
  const resolved = count(STATUS.RESOLVED)
  const total = requests.length

  return {
    total,
    pending,
    inProgress,
    resolved,
    open: pending + inProgress,
    resolutionRate: total ? Math.round((resolved / total) * 100) : 0,
    byCategory: CATEGORIES.map((c) => ({
      id: c.id,
      label: c.label,
      total: requests.filter((r) => r.category === c.id).length,
      resolved: requests.filter((r) => r.category === c.id && r.status === STATUS.RESOLVED).length,
    })).filter((c) => c.total > 0),
  }
}