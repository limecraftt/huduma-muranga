import { useCallback, useEffect, useState } from 'react'
import { MapPin } from 'lucide-react'
import { Alert, Button, EmptyState, Modal, Spinner, StatusBadge } from './ui'
import { CRIME_TYPES, STATUS_FLOW, STATUS_META } from '../data/constants'
import { fieldClass, formatDate, formatDateTime } from '../lib/helpers'
import { tipService } from '../services/mockApi'

const crimeLabel = (id) => CRIME_TYPES.find((c) => c.id === id)?.label ?? 'Other crime'

function TipDetails({ tip, onClose, onChanged }) {
  const [status, setStatus] = useState(tip.status)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const save = async () => {
    setSaving(true)
    setError('')
    try {
      await tipService.updateStatus(tip.id, status, note.trim())
      onChanged()
      onClose()
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <Modal title={`Anonymous tip ${tip.code}`} onClose={onClose}>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="font-semibold text-slate-900">{crimeLabel(tip.crimeType)}</p>
            <p className="flex items-center gap-1 text-sm text-slate-500"><MapPin className="h-3.5 w-3.5" aria-hidden="true" />{tip.location}, {tip.subCounty}</p>
          </div>
          <StatusBadge status={tip.status} />
        </div>
        <p className="text-sm leading-relaxed text-slate-700">{tip.description}</p>
        {tip.image && <img src={tip.image} alt="Photo attached to the tip" className="max-h-72 w-full rounded-lg border border-slate-200 object-cover" />}
        <ul className="space-y-2 border-l-2 border-brand-100 pl-4 text-sm">
          {[...tip.history].reverse().map((h, i) => (
            <li key={i}><span className="font-medium text-slate-800">{STATUS_META[h.status].label}</span> <span className="text-slate-500">· {formatDateTime(h.at)}</span><p className="text-slate-600">{h.note}</p></li>
          ))}
        </ul>
        <div className="space-y-3 rounded-xl border border-brand-200 bg-brand-50/50 p-4">
          <h3 className="text-sm font-semibold text-brand-800">Update status (the reporter sees the note)</h3>
          {error && <Alert>{error}</Alert>}
          <div className="grid gap-3 sm:grid-cols-2">
            <select aria-label="New status" className={fieldClass()} value={status} onChange={(e) => setStatus(e.target.value)}>
              {STATUS_FLOW.map((s) => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
            </select>
            <input aria-label="Note for the reporter" className={fieldClass()} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (optional)" />
          </div>
          <Button onClick={save} loading={saving} disabled={status === tip.status && !note.trim()}>Save update</Button>
        </div>
      </div>
    </Modal>
  )
}

/** Admin-only list of anonymous crime tips. */
export default function TipsPanel() {
  const [tips, setTips] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)

  const load = useCallback(async () => {
    try {
      setTips(await tipService.list())
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  return (
    <section className="mt-12">
      <h2 className="text-lg font-bold text-slate-900">Anonymous crime tips ({tips.length})</h2>
      <p className="mb-4 text-sm text-slate-600">Reporters are not identifiable. Update the status and leave a note they can see with their code.</p>
      {error && <Alert>{error}</Alert>}
      {loading ? (
        <Spinner />
      ) : tips.length === 0 ? (
        <EmptyState title="No tips yet" />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr><th className="px-4 py-3">Code</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Location</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Status</th><th className="px-4 py-3"><span className="sr-only">Action</span></th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tips.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono font-medium text-slate-900">{t.code}</td>
                  <td className="px-4 py-3">{crimeLabel(t.crimeType)}</td>
                  <td className="px-4 py-3 text-slate-600">{t.location}, {t.subCounty}</td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(t.createdAt)}</td>
                  <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                  <td className="px-4 py-3 text-right"><button onClick={() => setSelected(t)} className="font-semibold text-brand-700 hover:underline">Review</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {selected && <TipDetails tip={selected} onClose={() => setSelected(null)} onChanged={load} />}
    </section>
  )
}