import { useState } from 'react'
import { MapPin } from 'lucide-react'
import LiveHistoryTabs from './LiveHistoryTabs'
import { Alert, Button, EmptyState, Modal, Spinner, StatusBadge } from './ui'
import { CRIME_TYPES, STATUS, STATUS_FLOW, STATUS_META } from '../data/constants'
import { fieldClass, formatDate, formatDateTime } from '../lib/helpers'
import { tipService } from '../services/tipService'

/** Tips shown per page, so the list never gets overwhelmingly long. */
const PAGE_SIZE = 6

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

/** One small number tile for the summary row. */
function Tile({ label, value, tone }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <p className="flex items-center gap-2 text-xs font-medium text-slate-500">
        <span className={`h-2 w-2 rounded-full ${tone}`} />{label}
      </p>
      <p className="mt-1 text-xl font-bold text-slate-900">{value}</p>
    </div>
  )
}

/**
 * Admin-only anonymous crime tips: counts, Live / History tabs, and a list
 * (cards on phones, table from tablet width). The dashboard loads the tips
 * and passes them in, so the same numbers can also feed the page header.
 */
export default function TipsPanel({ tips, loading, error, stats, onChanged }) {
  const [tab, setTab] = useState('live') // 'live' | 'history'
  const [visible, setVisible] = useState(PAGE_SIZE)
  const [selected, setSelected] = useState(null)

  const isHistory = tab === 'history'
  const liveTips = tips.filter((t) => t.status !== STATUS.RESOLVED)
  const historyTips = tips.filter((t) => t.status === STATUS.RESOLVED).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
  const list = isHistory ? historyTips : liveTips
  const shown = list.slice(0, visible)

  const changeTab = (next) => { setTab(next); setVisible(PAGE_SIZE) }

  return (
    <section className="mt-12">
      <h2 className="text-lg font-bold text-slate-900">Anonymous crime tips</h2>
      <p className="mb-4 mt-1 text-sm text-slate-600">Reporters are not identifiable. Update the status and leave a note they can see with their code.</p>

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tile label="Total tips" value={stats.total} tone="bg-slate-400" />
        <Tile label="Pending" value={stats.pending} tone="bg-amber-500" />
        <Tile label="In progress" value={stats.inProgress} tone="bg-sky-500" />
        <Tile label="Resolved" value={stats.resolved} tone="bg-brand-600" />
      </div>

      <LiveHistoryTabs tab={tab} onChange={changeTab} liveCount={liveTips.length} historyCount={historyTips.length} label="Tips list" />
      <p className="mb-4 mt-4 text-sm text-slate-600">
        {isHistory ? 'Resolved tips, most recently resolved first.' : 'Pending and in-progress tips that still need action.'}
      </p>

      {error && <div className="mb-4"><Alert>{error}</Alert></div>}
      {loading ? (
        <Spinner />
      ) : list.length === 0 ? (
        <EmptyState
          title={isHistory ? 'No resolved tips yet' : tips.length ? 'All caught up' : 'No tips yet'}
          message={isHistory ? 'Tips move here once you mark them as resolved.' : tips.length ? 'There are no live tips right now. Resolved ones are in History.' : 'Anonymous reports will appear here.'}
        />
      ) : (
        <>
          {/* Phones */}
          <ul className="space-y-3 md:hidden">
            {shown.map((t) => (
              <li key={t.id}>
                <button onClick={() => setSelected(t)} className="w-full rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-colors active:bg-slate-50">
                  <span className="block font-semibold text-slate-900">{crimeLabel(t.crimeType)}</span>
                  <span className="mt-0.5 flex items-center gap-1 text-sm text-slate-500">
                    <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span className="truncate">{t.location}, {t.subCounty}</span>
                  </span>
                  <span className="mt-3 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                    <span className="min-w-0 text-xs text-slate-500">
                      <span className="block font-mono font-medium text-slate-700">{t.code}</span>
                      <span>{isHistory ? `Resolved ${formatDate(t.updatedAt)}` : formatDate(t.createdAt)}</span>
                    </span>
                    <StatusBadge status={t.status} />
                  </span>
                </button>
              </li>
            ))}
          </ul>

          {/* Tablet and desktop */}
          <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">{isHistory ? 'Resolved' : 'Date'}</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3"><span className="sr-only">Action</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {shown.map((t) => (
                  <tr key={t.id} className="transition-colors hover:bg-slate-50">
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-medium text-slate-900">{t.code}</td>
                    <td className="px-4 py-3 text-slate-800">{crimeLabel(t.crimeType)}</td>
                    <td className="px-4 py-3 text-slate-600">{t.location}, {t.subCounty}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(isHistory ? t.updatedAt : t.createdAt)}</td>
                    <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => setSelected(t)} className="rounded-md border border-brand-200 bg-white px-3 py-1.5 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50 focus-visible:outline-2 focus-visible:outline-brand-600">{isHistory ? 'View' : 'Review'}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {list.length > shown.length && (
            <div className="mt-5 flex flex-col items-center gap-2">
              <Button variant="outline" onClick={() => setVisible((n) => n + PAGE_SIZE)}>Show more ({list.length - shown.length} remaining)</Button>
              <p className="text-xs text-slate-500">Showing {shown.length} of {list.length}</p>
            </div>
          )}
        </>
      )}
      {selected && <TipDetails tip={selected} onClose={() => setSelected(null)} onChanged={onChanged} />}
    </section>
  )
}