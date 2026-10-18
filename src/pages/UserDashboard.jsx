import { useState } from 'react'
import { CheckCircle2, Clock, ClipboardList, Plus } from 'lucide-react'
import RequestDetails from '../components/RequestDetails'
import RequestForm from '../components/RequestForm'
import { Alert, Button, EmptyState, Modal, Spinner, StatCard, StatusBadge } from '../components/ui'
import { useAuth } from '../context/auth'
import { useRequests } from '../hooks/useRequests'
import { categoryOf, formatDate } from '../lib/helpers'
import { computeStats } from '../services/mockApi'

/** Citizen view: own requests, a "new request" form and status tracking. */
export default function UserDashboard() {
  const { user } = useAuth()
  const { requests, loading, error, reload } = useRequests(user.id)
  const [showForm, setShowForm] = useState(false)
  const [selected, setSelected] = useState(null)
  const [notice, setNotice] = useState('')
  const stats = computeStats(requests)

  const handleCreated = (created) => {
    setShowForm(false)
    setNotice(`Request ${created.ref} submitted. We will update its status as work progresses.`)
    reload()
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome, {user.fullName.split(' ')[0]}</h1>
          <p className="text-sm text-slate-600">Ward: {user.ward} · {user.email}</p>
        </div>
        <Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4" aria-hidden="true" /> New request</Button>
      </div>

      {notice && <div className="mt-6"><Alert type="success">{notice}</Alert></div>}
      {error && <div className="mt-6"><Alert>{error}</Alert></div>}

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total requests" value={stats.total} icon={ClipboardList} tone="slate" />
        <StatCard label="Open" value={stats.open} icon={Clock} tone="amber" hint={`${stats.pending} pending · ${stats.inProgress} in progress`} />
        <StatCard label="Resolved" value={stats.resolved} icon={CheckCircle2} />
      </div>

      <h2 className="mb-4 mt-10 text-lg font-bold text-slate-900">My requests</h2>
      {loading ? (
        <Spinner />
      ) : requests.length === 0 ? (
        <EmptyState
          title="No requests yet"
          message="Report your first problem and track it here."
          action={<Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4" aria-hidden="true" /> New request</Button>}
        />
      ) : (
        <ul className="space-y-3">
          {requests.map((r) => {
            const category = categoryOf(r.category)
            return (
              <li key={r.id}>
                <button onClick={() => setSelected(r)} className="flex w-full items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-shadow hover:shadow-md">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700"><category.icon className="h-5 w-5" aria-hidden="true" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-slate-900">{category.label} · {r.location}</span>
                    <span className="block truncate text-sm text-slate-500">{r.ref} · {formatDate(r.createdAt)}</span>
                  </span>
                  <StatusBadge status={r.status} />
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {showForm && (
        <Modal title="New service request" onClose={() => setShowForm(false)}>
          <RequestForm onCreated={handleCreated} onCancel={() => setShowForm(false)} />
        </Modal>
      )}
      {selected && <RequestDetails request={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}