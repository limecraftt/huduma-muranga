import { Link } from 'react-router-dom'
import { ArrowRight, ClipboardList, FileText, Search, ShieldCheck } from 'lucide-react'
import { StatCard } from '../components/ui'
import { useAuth } from '../context/auth'
import { CATEGORIES, SITE } from '../data/constants'
import { useRequests } from '../hooks/useRequests'
import { buttonClasses } from '../lib/helpers'
import { computeStats } from '../services/mockApi'

const STEPS = [
  { icon: ShieldCheck, title: 'Create an account', text: 'Sign up with your email, ward and a password.' },
  { icon: FileText, title: 'Submit a request', text: 'Pick a category, add the location, details and a photo.' },
  { icon: Search, title: 'Track progress', text: 'Follow it from Pending to In Progress to Resolved.' },
]

export default function LandingPage() {
  const { user, isAdmin } = useAuth()
  const { requests } = useRequests()
  const stats = computeStats(requests)
  const dashboardPath = isAdmin ? '/admin' : '/dashboard'

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 text-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
          <p className="mb-3 inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider">{SITE.county}</p>
          <h1 className="max-w-3xl text-4xl font-extrabold leading-tight sm:text-5xl">Report a county service problem. Track it until it is fixed.</h1>
          <p className="mt-5 max-w-2xl text-lg text-brand-50">
            {SITE.name} lets residents report street lights, water, garbage, roads and more, and follow every request to resolution.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {user ? (
              <Link to={dashboardPath} className={buttonClasses({ variant: 'light', size: 'lg' })}>Go to dashboard <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
            ) : (
              <>
                <Link to="/signup" className={buttonClasses({ variant: 'light', size: 'lg' })}>Get started <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
                <Link to="/login" className="inline-flex items-center justify-center rounded-md border border-white/60 px-6 py-3 text-base font-semibold text-white hover:bg-white/10">Login</Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Public stats */}
      <section className="mx-auto -mt-8 max-w-7xl px-4 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Requests received" value={stats.total} icon={ClipboardList} />
          <StatCard label="Currently open" value={stats.open} icon={ClipboardList} tone="amber" />
          <StatCard label="Resolved" value={stats.resolved} icon={ShieldCheck} tone="brand" hint={`${stats.resolutionRate}% resolution rate`} />
        </div>
      </section>

      {/* Services */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <h2 className="text-2xl font-bold text-slate-900">Services you can report</h2>
        <p className="mt-1 text-slate-600">Choose the category that best matches the problem.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((c) => (
            <div key={c.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-50 text-brand-700"><c.icon className="h-5 w-5" aria-hidden="true" /></span>
              <h3 className="mt-4 font-semibold text-slate-900">{c.label}</h3>
              <p className="mt-1 text-sm text-slate-600">{c.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <h2 className="text-2xl font-bold text-slate-900">How it works</h2>
          <div className="mt-8 grid gap-8 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <div key={s.title} className="flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-600 font-bold text-white">{i + 1}</span>
                <div>
                  <h3 className="flex items-center gap-2 font-semibold text-slate-900"><s.icon className="h-4 w-4 text-brand-600" aria-hidden="true" />{s.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">{s.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}