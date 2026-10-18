import { useMemo, useState } from 'react'
import { CheckCircle2, Clock, ClipboardList, Hourglass } from 'lucide-react'
import RequestDetails from '../components/RequestDetails'
import TipsPanel from '../components/TipsPanel'
import { Alert, EmptyState, Spinner, StatCard, StatusBadge } from '../components/ui'
import { STATUS_FLOW, STATUS_META, SUB_COUNTIES } from '../data/constants'
import { useRequests } from '../hooks/useRequests'
import { categoryOf, fieldClass, formatDate } from '../lib/helpers'
import { computeStats } from '../services/mockApi'

/** Admin view: all requests, analytics, filters and status updates. */
export default function AdminDashboard() {
  const { requests, loading, error, reload } = useRequests()
  const [statusFilter, setStatusFilter] = useState('all')
  const [subCountyFilter, setSubCountyFilter] = useState('all')
  const [selected, setSelected] = useState(null)

  const stats = useMemo(() => computeStats(requests), [requests])
  const filtered = requests.filter(
    (r) => (statusFilter === 'all' || r.status === statusFilter) && (subCountyFilter === 'all' || r.subCounty === subCountyFilter),
  )
  const maxCategory = Math.max(1, ...stats.byCategory.map((c) => c.total))

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-slate-900">Admin dashboard</h1>
      <p className="text-sm text-slate-600">Review citizen requests and update their progress.</p>

      {error && <div className="mt-6"><Alert>{error}</Alert></div>}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total" value={stats.total} icon={ClipboardList} tone="slate" />
        <StatCard label="Pending" value={stats.pending} icon={Hourglass} tone="amber" />
        <StatCard label="In progress" value={stats.inProgress} icon={Clock} tone="sky" />
        <StatCard label="Resolved" value={stats.resolved} icon={CheckCircle2} hint={`${stats.resolutionRate}% resolution rate`} />
      </div>

      {/* Analytics */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-bold text-slate-900">Open vs resolved</h2>
          <div className="mt-4 flex h-4 overflow-hidden rounded-full bg-slate-100" role="img" aria-label={`${stats.open} open and ${stats.resolved} resolved`}>
            <div className="bg-amber-400" style={{ width: `${stats.total ? (stats.open / stats.total) * 100 : 0}%` }} />
            <div className="bg-brand-600" style={{ width: `${stats.total ? (stats.resolved / stats.total) * 100 : 0}%` }} />
          </div>
          <div className="mt-3 flex gap-6 text-sm text-slate-600">
            <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-amber-400" />Open: <strong>{stats.open}</strong></span>
            <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-brand-600" />Resolved: <strong>{stats.resolved}</strong></span>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-bold text-slate-900">Requests by category</h2>
          <ul className="mt-4 space-y-3">
            {stats.byCategory.length === 0 && <li className="text-sm text-slate-500">No data yet.</li>}
            {stats.byCategory.map((c) => (
              <li key={c.id}>
                <div className="flex justify-between text-sm"><span className="text-slate-700">{c.label}</span><span className="font-semibold text-slate-900">{c.total}</span></div>
                <div className="mt-1 h-2 rounded-full bg-slate-100">
                  <div className="h-2 rounded-full bg-brand-600" style={{ width: `${(c.total / maxCategory) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Requests table */}
      <div className="mb-4 mt-10 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-slate-900">All requests ({filtered.length})</h2>
        <div className="flex gap-2">
          <select aria-label="Filter by status" className={`${fieldClass()} !w-auto`} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All statuses</option>
            {STATUS_FLOW.map((s) => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
          </select>
          <select aria-label="Filter by sub-county" className={`${fieldClass()} !w-auto`} value={subCountyFilter} onChange={(e) => setSubCountyFilter(e.target.value)}>
            <option value="all">All sub-counties</option>
            {SUB_COUNTIES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <Spinner />
      ) : filtered.length === 0 ? (
        <EmptyState title="No matching requests" message="Try a different filter." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"><span className="sr-only">Action</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{r.ref}</td>
                  <td className="px-4 py-3">{categoryOf(r.category).label}</td>
                  <td className="px-4 py-3 text-slate-600">{r.location}, {r.subCounty}</td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(r.createdAt)}</td>
                  <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setSelected(r)} className="font-semibold text-brand-700 hover:underline">Manage</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <TipsPanel />

      {selected && <RequestDetails request={selected} isAdmin onClose={() => setSelected(null)} onChanged={reload} />}
    </div>
  )
}