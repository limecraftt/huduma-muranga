import { useEffect, useMemo, useRef, useState } from 'react'
import { CheckCircle2, ChevronRight, Clock, ClipboardList, Hourglass, ShieldCheck, X } from 'lucide-react'
import RequestDetails from '../components/RequestDetails'
import TipsPanel from '../components/TipsPanel'
import { Alert, Button, EmptyState, Spinner, StatCard, StatusBadge } from '../components/ui'
import { STATUS, STATUS_META, SUB_COUNTIES } from '../data/constants'
import { useRequests } from '../hooks/useRequests'
import { categoryOf, fieldClass, formatDate } from '../lib/helpers'
import { computeStats } from '../lib/stats'

/** Requests that still need work; everything else is history. */
const LIVE_STATUSES = [STATUS.PENDING, STATUS.IN_PROGRESS]
/** How many requests to show at once, so the page never gets overwhelmingly long. */
const PAGE_SIZE = 8

/* ---------- Small visual helpers (animation only, no app logic) ---------- */

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** True once the element has scrolled into view (and stays true). */
function useInView(threshold = 0.15) {
  const ref = useRef(null)
  // Old browsers without IntersectionObserver just show everything straight away
  const [inView, setInView] = useState(() => typeof IntersectionObserver === 'undefined')

  useEffect(() => {
    const el = ref.current
    if (!el || inView) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          io.disconnect()
        }
      },
      { threshold },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [threshold, inView])

  return [ref, inView]
}

/** Fades and slides its children up when they appear. */
function Reveal({ children, delay = 0, className = '' }) {
  const [ref, shown] = useInView()
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:transition-none ${
        shown ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
      } ${className}`}
    >
      {children}
    </div>
  )
}

/** Counts up from 0 to `value` when it appears. */
function CountUp({ value, duration = 1000 }) {
  const [ref, inView] = useInView(0.4)
  const [n, setN] = useState(0)
  const instant = !value || prefersReducedMotion()

  useEffect(() => {
    if (!inView || instant) return
    let raf
    const start = performance.now()
    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1)
      setN(Math.round(value * (1 - Math.pow(1 - t, 3))))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, instant, value, duration])

  return <span ref={ref}>{instant ? value : n}</span>
}

/** A bar segment whose width grows from 0 when it appears. */
function GrowBar({ percent, className = '', delay = 0 }) {
  const [ref, inView] = useInView(0.3)
  return (
    <div
      ref={ref}
      className={`h-full transition-[width] duration-1000 ease-out motion-reduce:transition-none ${className}`}
      style={{ width: `${inView ? percent : 0}%`, transitionDelay: `${delay}ms` }}
    />
  )
}

/** Admin view: all requests, analytics, filters and status updates. */
export default function AdminDashboard() {
  const { requests, loading, error, reload } = useRequests()
  const [tab, setTab] = useState('live') // 'live' | 'history'
  const [statusFilter, setStatusFilter] = useState('all')
  const [subCountyFilter, setSubCountyFilter] = useState('all')
  const [visible, setVisible] = useState(PAGE_SIZE)
  const [selected, setSelected] = useState(null)

  const stats = useMemo(() => computeStats(requests), [requests])

  // Live = pending / in progress (newest first). History = resolved (most recently resolved first).
  const { liveRequests, historyRequests } = useMemo(
    () => ({
      liveRequests: requests.filter((r) => LIVE_STATUSES.includes(r.status)),
      historyRequests: requests.filter((r) => r.status === STATUS.RESOLVED).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)),
    }),
    [requests],
  )

  const isHistory = tab === 'history'
  const filtered = (isHistory ? historyRequests : liveRequests).filter(
    (r) => (isHistory || statusFilter === 'all' || r.status === statusFilter) && (subCountyFilter === 'all' || r.subCounty === subCountyFilter),
  )
  const shown = filtered.slice(0, visible)

  // Changing a filter or tab always starts the list from the top again
  const changeTab = (next) => { setTab(next); setStatusFilter('all'); setVisible(PAGE_SIZE) }
  const changeStatus = (value) => { setStatusFilter(value); setVisible(PAGE_SIZE) }
  const changeSubCounty = (value) => { setSubCountyFilter(value); setVisible(PAGE_SIZE) }
  const clearFilters = () => { setStatusFilter('all'); setSubCountyFilter('all'); setVisible(PAGE_SIZE) }

  const maxCategory = Math.max(1, ...stats.byCategory.map((c) => c.total))
  const filtersActive = statusFilter !== 'all' || subCountyFilter !== 'all'
  const openPct = stats.total ? (stats.open / stats.total) * 100 : 0
  const resolvedPct = stats.total ? (stats.resolved / stats.total) * 100 : 0

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      {/* Header banner */}
      <Reveal>
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-700 via-brand-800 to-brand-900 p-6 text-white shadow-lg sm:p-8">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-20 left-1/3 h-48 w-48 rounded-full bg-brand-500/20 blur-2xl" aria-hidden="true" />

          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-2 ring-white/30" aria-hidden="true">
                <ShieldCheck className="h-6 w-6" />
              </span>
              <div>
                <h1 className="text-2xl font-extrabold sm:text-3xl">Admin dashboard</h1>
                <p className="text-sm text-brand-100">Review citizen requests and update their progress.</p>
              </div>
            </div>
            {!loading && (
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1.5 text-sm font-semibold backdrop-blur-sm">
                <span className="relative flex h-2.5 w-2.5">
                  {stats.pending > 0 && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-300 opacity-75 motion-reduce:hidden" />}
                  <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${stats.pending > 0 ? 'bg-amber-300' : 'bg-brand-300'}`} />
                </span>
                {stats.pending} awaiting action
              </span>
            )}
          </div>
        </section>
      </Reveal>

      {error && <div className="mt-6"><Alert>{error}</Alert></div>}

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {[
          <StatCard key="total" label="Total" value={<CountUp value={stats.total} />} icon={ClipboardList} tone="slate" />,
          <StatCard key="pending" label="Pending" value={<CountUp value={stats.pending} />} icon={Hourglass} tone="amber" />,
          <StatCard key="progress" label="In progress" value={<CountUp value={stats.inProgress} />} icon={Clock} tone="sky" />,
          <StatCard
            key="resolved"
            label="Resolved"
            value={<CountUp value={stats.resolved} />}
            icon={CheckCircle2}
            hint={`${stats.resolutionRate}% resolution rate`}
          />,
        ].map((card, i) => (
          <Reveal key={card.key} delay={i * 80} className="h-full">
            <div className="h-full [&>*]:h-full transition-all duration-300 hover:-translate-y-1 hover:drop-shadow-lg motion-reduce:transform-none">{card}</div>
          </Reveal>
        ))}
      </div>

      {/* Analytics */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Reveal className="h-full">
          <section className="h-full rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow duration-300 hover:shadow-md">
            <h2 className="font-bold text-slate-900">Open vs resolved</h2>
            <div
              className="mt-4 flex h-4 overflow-hidden rounded-full bg-slate-100"
              role="img"
              aria-label={`${stats.open} open and ${stats.resolved} resolved`}
            >
              <GrowBar percent={openPct} className="bg-amber-400" />
              <GrowBar percent={resolvedPct} className="bg-brand-600" delay={150} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-amber-50 p-3">
                <span className="flex items-center gap-2 text-slate-600"><span className="h-2.5 w-2.5 rounded-full bg-amber-400" />Open</span>
                <p className="mt-1 text-xl font-bold text-slate-900">{stats.open}</p>
              </div>
              <div className="rounded-lg bg-brand-50 p-3">
                <span className="flex items-center gap-2 text-slate-600"><span className="h-2.5 w-2.5 rounded-full bg-brand-600" />Resolved</span>
                <p className="mt-1 text-xl font-bold text-slate-900">{stats.resolved}</p>
              </div>
            </div>
          </section>
        </Reveal>

        <Reveal delay={100} className="h-full">
          <section className="h-full rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow duration-300 hover:shadow-md">
            <h2 className="font-bold text-slate-900">Requests by category</h2>
            <ul className="mt-4 space-y-3.5">
              {stats.byCategory.length === 0 && <li className="text-sm text-slate-500">No data yet.</li>}
              {stats.byCategory.map((c, i) => (
                <li key={c.id} className="group">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-700 transition-colors group-hover:text-brand-700">{c.label}</span>
                    <span className="font-semibold text-slate-900">{c.total}</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                    <GrowBar percent={(c.total / maxCategory) * 100} className="rounded-full bg-brand-600" delay={i * 80} />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </Reveal>
      </div>

      {/* Requests: live work on top, resolved ones tucked away in History */}
      <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div role="tablist" aria-label="Request list" className="grid grid-cols-2 rounded-xl bg-slate-200/70 p-1 sm:inline-grid sm:w-72">
          {[
            { id: 'live', label: 'Live', count: liveRequests.length },
            { id: 'history', label: 'History', count: historyRequests.length },
          ].map((t) => {
            const active = tab === t.id
            return (
              <button
                key={t.id}
                role="tab"
                aria-selected={active}
                onClick={() => changeTab(t.id)}
                className={`flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                  active ? 'bg-white text-brand-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.label}
                <span className={`rounded-full px-2 py-0.5 text-xs ${active ? 'bg-brand-100 text-brand-800' : 'bg-white/70 text-slate-500'}`}>{t.count}</span>
              </button>
            )
          })}
        </div>

        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:items-center">
          {!isHistory && (
            <select aria-label="Filter by status" className={`${fieldClass()} !w-full sm:!w-auto`} value={statusFilter} onChange={(e) => changeStatus(e.target.value)}>
              <option value="all">All live</option>
              {LIVE_STATUSES.map((s) => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
            </select>
          )}
          <select
            aria-label="Filter by sub-county"
            className={`${fieldClass()} !w-full sm:!w-auto ${isHistory ? 'col-span-2 sm:col-span-1' : ''}`}
            value={subCountyFilter}
            onChange={(e) => changeSubCounty(e.target.value)}
          >
            <option value="all">All sub-counties</option>
            {SUB_COUNTIES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          {filtersActive && (
            <button
              type="button"
              onClick={clearFilters}
              className="col-span-2 inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50 sm:col-span-1"
            >
              <X className="h-4 w-4" aria-hidden="true" /> Clear
            </button>
          )}
        </div>
      </div>

      <p className="mb-4 mt-4 text-sm text-slate-600">
        {isHistory ? 'Resolved requests, most recently resolved first.' : 'Pending and in-progress requests that still need action.'}
        <span className="ml-1 font-semibold text-slate-800">{filtered.length} {filtered.length === 1 ? 'request' : 'requests'}</span>
      </p>

      {loading ? (
        <Spinner />
      ) : filtered.length === 0 ? (
        isHistory ? (
          <EmptyState title="No resolved requests yet" message="Requests move here once you mark them as resolved." />
        ) : (
          <EmptyState
            title={filtersActive || liveRequests.length ? 'No matching requests' : 'All caught up'}
            message={filtersActive || liveRequests.length ? 'Try a different filter.' : 'There are no live requests right now. Resolved ones are in History.'}
            action={filtersActive ? <Button variant="outline" onClick={clearFilters}>Clear filters</Button> : undefined}
          />
        )
      ) : (
        <>
          {/* Phones and small tablets: one card per request, no sideways scrolling */}
          <ul className="space-y-3 md:hidden">
            {shown.map((r, i) => {
              const category = categoryOf(r.category)
              const accent = STATUS_META[r.status]?.dot ?? STATUS_META.pending.dot
              return (
                <li key={r.id}>
                  <Reveal delay={Math.min(i, 5) * 50}>
                    <button
                      onClick={() => setSelected(r)}
                      className="relative w-full overflow-hidden rounded-xl border border-slate-200 bg-white p-4 pl-5 text-left shadow-sm transition-all duration-300 active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                    >
                      <span className={`absolute inset-y-0 left-0 w-1.5 ${accent}`} aria-hidden="true" />
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                          <category.icon className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <div className="min-w-0">
                          <p className="font-semibold leading-snug text-slate-900">{category.label}</p>
                          <p className="font-mono text-xs text-slate-500">{r.ref}</p>
                        </div>
                      </div>
                      <p className="mt-3 text-sm text-slate-600">{r.location}, {r.subCounty}</p>
                      <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                        <span className="text-xs text-slate-500">{isHistory ? `Resolved ${formatDate(r.updatedAt)}` : formatDate(r.createdAt)}</span>
                        <span className="flex items-center gap-1 whitespace-nowrap">
                          <StatusBadge status={r.status} />
                          <ChevronRight className="h-4 w-4 text-slate-400" aria-hidden="true" />
                        </span>
                      </div>
                    </button>
                  </Reveal>
                </li>
              )
            })}
          </ul>

          {/* Tablets and desktops: full table */}
          <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Reference</th>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold">Location</th>
                  <th className="px-4 py-3 font-semibold">{isHistory ? 'Resolved' : 'Date'}</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3"><span className="sr-only">Action</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {shown.map((r) => {
                  const category = categoryOf(r.category)
                  return (
                    <tr key={r.id} className="group transition-colors hover:bg-brand-50/50">
                      <td className="px-4 py-3 font-medium text-slate-900">{r.ref}</td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-2.5">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700 transition-all duration-300 group-hover:bg-brand-600 group-hover:text-white">
                            <category.icon className="h-4 w-4" aria-hidden="true" />
                          </span>
                          {category.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{r.location}, {r.subCounty}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(isHistory ? r.updatedAt : r.createdAt)}</td>
                      <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setSelected(r)}
                          className="inline-flex items-center gap-1 rounded-md border border-brand-200 px-3 py-1.5 font-semibold text-brand-700 transition-all duration-300 hover:border-brand-600 hover:bg-brand-600 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                        >
                          {isHistory ? 'View' : 'Manage'} <ChevronRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden="true" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Keeps the page short: reveal more only when asked */}
          {filtered.length > shown.length && (
            <div className="mt-5 flex flex-col items-center gap-2">
              <Button variant="outline" onClick={() => setVisible((n) => n + PAGE_SIZE)}>
                Show more ({filtered.length - shown.length} remaining)
              </Button>
              <p className="text-xs text-slate-500">Showing {shown.length} of {filtered.length}</p>
            </div>
          )}
        </>
      )}

      <TipsPanel />

      {selected && <RequestDetails request={selected} isAdmin onClose={() => setSelected(null)} onChanged={reload} />}
    </div>
  )
}