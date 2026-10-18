import { useState } from 'react'
import { Check, MapPin } from 'lucide-react'
import { Alert, Button, Modal, StatusBadge } from './ui'
import { STATUS_FLOW, STATUS_META } from '../data/constants'
import { categoryOf, fieldClass, formatDate, formatDateTime } from '../lib/helpers'
import { requestService } from '../services/mockApi'

/** Three-step tracker: Pending -> In Progress -> Resolved. */
function ProgressTracker({ status }) {
  const current = STATUS_FLOW.indexOf(status)
  return (
    <ol className="flex items-center" aria-label="Request progress">
      {STATUS_FLOW.map((step, i) => {
        const done = i <= current
        return (
          <li key={step} className="flex flex-1 items-center last:flex-none">
            <span className="flex flex-col items-center gap-1">
              <span className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${done ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                {i < current ? <Check className="h-4 w-4" aria-hidden="true" /> : i + 1}
              </span>
              <span className={`text-xs font-medium ${done ? 'text-brand-700' : 'text-slate-500'}`}>{STATUS_META[step].label}</span>
            </span>
            {i < STATUS_FLOW.length - 1 && <span className={`mx-2 mb-5 h-0.5 flex-1 ${i < current ? 'bg-brand-600' : 'bg-slate-200'}`} />}
          </li>
        )
      })}
    </ol>
  )
}

/**
 * Modal with the full request, its status history and (for admins)
 * a control to change the status.
 */
export default function RequestDetails({ request, isAdmin = false, onClose, onChanged }) {
  const category = categoryOf(request.category)
  const [status, setStatus] = useState(request.status)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      await requestService.updateStatus(request.id, status, note.trim())
      onChanged?.()
      onClose()
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <Modal title={`Request ${request.ref}`} onClose={onClose}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
              <category.icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="font-semibold text-slate-900">{category.label}</p>
              <p className="flex items-center gap-1 text-sm text-slate-500"><MapPin className="h-3.5 w-3.5" aria-hidden="true" />{request.location}, {request.subCounty}</p>
            </div>
          </div>
          <StatusBadge status={request.status} />
        </div>

        <ProgressTracker status={request.status} />

        <div>
          <h3 className="text-sm font-semibold text-slate-700">Description</h3>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">{request.description}</p>
          <p className="mt-2 text-xs text-slate-500">Submitted {formatDate(request.createdAt)}</p>
        </div>

        {request.image && <img src={request.image} alt="Photo attached to the request" className="max-h-72 w-full rounded-lg border border-slate-200 object-cover" />}

        <div>
          <h3 className="text-sm font-semibold text-slate-700">History</h3>
          <ul className="mt-2 space-y-3 border-l-2 border-brand-100 pl-4">
            {[...request.history].reverse().map((h, i) => (
              <li key={i} className="text-sm">
                <p className="font-medium text-slate-800">{STATUS_META[h.status].label} <span className="font-normal text-slate-500">· {formatDateTime(h.at)}</span></p>
                <p className="text-slate-600">{h.note}</p>
              </li>
            ))}
          </ul>
        </div>

        {isAdmin && (
          <div className="space-y-3 rounded-xl border border-brand-200 bg-brand-50/50 p-4">
            <h3 className="text-sm font-semibold text-brand-800">Update status</h3>
            {error && <Alert>{error}</Alert>}
            <div className="grid gap-3 sm:grid-cols-2">
              <select aria-label="New status" className={fieldClass()} value={status} onChange={(e) => setStatus(e.target.value)}>
                {STATUS_FLOW.map((s) => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
              </select>
              <input aria-label="Note for the citizen" className={fieldClass()} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (optional)" />
            </div>
            <Button onClick={handleSave} loading={saving} disabled={status === request.status && !note.trim()}>Save update</Button>
          </div>
        )}
      </div>
    </Modal>
  )
}