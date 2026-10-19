import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, ChevronRight, Clock, ClipboardList, Mail, MapPin, Plus } from 'lucide-react'
import RequestDetails from '../components/RequestDetails'
import RequestForm from '../components/RequestForm'
import { Alert, Button, EmptyState, Modal, Spinner, StatCard, StatusBadge } from '../components/ui'
import { useAuth } from '../context/auth'
import { STATUS_META } from '../data/constants'
import { useRequests } from '../hooks/useRequests'
import { categoryOf, formatDate } from '../lib/helpers'
import { computeStats } from '../lib/stats'

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

  const firstName = user.fullName.split(' ')[0]

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      {/* Welcome banner */}
      <Reveal>
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-700 via-brand-800 to-brand-900 p-6 text-white shadow-lg sm:p-8">
          {/* Soft decorative glows */}
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-20 left-1/3 h-48 w-48 rounded-full bg-brand-500/20 blur-2xl" aria-hidden="true" />

          <div className="relative flex flex-wrap items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <span
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/15 text-2xl font-bold ring-2 ring-white/30"
                aria-hidden="true"
              >
                {firstName.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-brand-100">Citizen dashboard</p>
                <h1 className="truncate text-2xl font-extrabold sm:text-3xl">Welcome, {firstName}</h1>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 backdrop-blur-sm">
                    <MapPin className="h-3.5 w-3.5" aria-hidden="true" /> Ward: {user.ward}
                  </span>
                  <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 backdrop-blur-sm">
                    <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span className="truncate">{user.email}</span>
                  </span>
                </div>
              </div>
            </div>

            <Button variant="light" size="lg" className="group w-full sm:w-auto" onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 transition-transform duration-300 group-hover:rotate-90" aria-hidden="true" /> New request
            </Button>
          </div>
        </section>
      </Reveal>

      {notice && <div className="mt-6"><Alert type="success">{notice}</Alert></div>}
      {error && <div className="mt-6"><Alert>{error}</Alert></div>}

      {/* Stats: numbers count up, cards lift on hover */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[
          <StatCard key="total" label="Total requests" value={<CountUp value={stats.total} />} icon={ClipboardList} tone="slate" />,
          <StatCard
            key="open"
            label="Open"
            value={<CountUp value={stats.open} />}
            icon={Clock}
            tone="amber"
            hint={`${stats.pending} pending · ${stats.inProgress} in progress`}
          />,
          <StatCard key="resolved" label="Resolved" value={<CountUp value={stats.resolved} />} icon={CheckCircle2} />,
        ].map((card, i) => (
          <Reveal key={card.key} delay={i * 100}>
            <div className="h-full transition-all duration-300 hover:-translate-y-1 hover:drop-shadow-lg motion-reduce:transform-none">{card}</div>
          </Reveal>
        ))}
      </div>

      {/* Requests list */}
      <div className="mb-4 mt-10 flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">My requests</h2>
        {!loading && requests.length > 0 && (
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
            {requests.length} {requests.length === 1 ? 'request' : 'requests'}
          </span>
        )}
      </div>

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
          {requests.map((r, i) => {
            const category = categoryOf(r.category)
            const accent = STATUS_META[r.status]?.dot ?? STATUS_META.pending.dot
            return (
              <li key={r.id}>
                <Reveal delay={Math.min(i, 6) * 60}>
                  <button
                    onClick={() => setSelected(r)}
                    className="group relative flex w-full items-center gap-4 overflow-hidden rounded-xl border border-slate-200 bg-white p-4 pl-5 text-left shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-300 hover:bg-brand-50/40 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 motion-reduce:transform-none"
                  >
                    {/* Status colour strip on the left edge */}
                    <span className={`absolute inset-y-0 left-0 w-1.5 ${accent}`} aria-hidden="true" />

                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700 transition-all duration-300 group-hover:scale-110 group-hover:bg-brand-600 group-hover:text-white">
                      <category.icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-slate-900">{category.label} · {r.location}</span>
                      <span className="block truncate text-sm text-slate-500">{r.ref} · {formatDate(r.createdAt)}</span>
                    </span>
                    <StatusBadge status={r.status} />
                    <ChevronRight
                      className="hidden h-5 w-5 shrink-0 text-slate-300 transition-all duration-300 group-hover:translate-x-1 group-hover:text-brand-600 sm:block"
                      aria-hidden="true"
                    />
                  </button>
                </Reveal>
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