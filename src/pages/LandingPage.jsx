import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ClipboardList, FileText, Search, ShieldCheck } from 'lucide-react'
import { StatCard } from '../components/ui'
import { useAuth } from '../context/auth'
import { CATEGORIES, SITE } from '../data/constants'
import { useRequests } from '../hooks/useRequests'
import { buttonClasses } from '../lib/helpers'
import { computeStats } from '../services/mockApi'

/**
 * Hero background pictures.
 * Put these files directly inside the /public folder.
 * Paths start with "/" and never include "public".
 * `position` controls which part of the photo stays visible when it is
 * cropped on small screens (e.g. 'center', 'left center', '70% center').
 */
const HERO_IMAGES = [
  { src: '/hero-1.jpg', position: 'center' },
  { src: '/hero-2.jpg', position: 'center' },
  { src: '/hero-3.jpg', position: 'center' },
]

const SLIDE_INTERVAL_MS = 6000

const STEPS = [
  { icon: ShieldCheck, title: 'Create an account', text: 'Sign up with your email, ward and a password.' },
  { icon: FileText, title: 'Submit a request', text: 'Pick a category, add the location, details and a photo.' },
  { icon: Search, title: 'Track progress', text: 'Follow it from Pending to In Progress to Resolved.' },
]

/**
 * Hero wrapper.
 * Phones/small tablets: the picture shows in full on top (no overlay),
 * and the text sits on solid green underneath, so nothing hides the photo.
 * md and up: the picture fills the hero and a soft shade covers only the
 * left side behind the text, so the right side stays bright and clear.
 */
function HeroSlideshow({ children }) {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused || HERO_IMAGES.length < 2) return
    // Respect visitors who prefer no animation
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = setInterval(() => setActive((i) => (i + 1) % HERO_IMAGES.length), SLIDE_INTERVAL_MS)
    return () => clearInterval(id)
  }, [paused])

  return (
    <section
      className="relative isolate bg-brand-800 text-white md:flex md:min-h-[34rem] md:items-center md:overflow-hidden lg:min-h-[40rem]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
    >
      {/* Pictures: a block on top on phones, full background from md up */}
      <div className="relative h-64 w-full overflow-hidden sm:h-80 md:absolute md:inset-0 md:-z-10 md:h-auto">
        {HERO_IMAGES.map((img, i) => (
          <img
            key={img.src}
            src={img.src}
            alt=""
            aria-hidden="true"
            decoding="async"
            loading={i === 0 ? 'eager' : 'lazy'}
            fetchPriority={i === 0 ? 'high' : 'auto'}
            style={{ objectPosition: img.position }}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${
              i === active ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ))}

        {/* Phones: only a thin blend into the green panel below */}
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-brand-800 to-transparent md:hidden" />

        {/* md+: shade only the left ~55% behind the text, clear on the right */}
        <div className="absolute inset-0 hidden bg-gradient-to-r from-brand-900/85 via-brand-900/45 via-45% to-transparent to-70% md:block" />
      </div>

      {/* Hero content */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-16 pt-8 sm:px-6 md:pb-28 md:pt-20">{children}</div>

      {/* Slide dots: bottom of the picture on phones, bottom of the hero on md+ */}
      {HERO_IMAGES.length > 1 && (
        <div className="absolute left-1/2 top-[13.25rem] z-20 flex -translate-x-1/2 gap-2 sm:top-[18.25rem] md:bottom-12 md:top-auto">
          {HERO_IMAGES.map((img, i) => (
            <button
              key={img.src}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Show slide ${i + 1}`}
              aria-current={i === active}
              className={`h-2.5 rounded-full shadow transition-all ${
                i === active ? 'w-8 bg-white' : 'w-2.5 bg-white/60 hover:bg-white/90'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  )
}

export default function LandingPage() {
  const { user, isAdmin } = useAuth()
  const { requests } = useRequests()
  const stats = computeStats(requests)
  const dashboardPath = isAdmin ? '/admin' : '/dashboard'

  return (
    <>
      {/* Hero */}
      <HeroSlideshow>
        <p className="mb-3 inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider backdrop-blur-sm">
          {SITE.county}
        </p>
        <h1 className="max-w-3xl text-3xl font-extrabold leading-tight sm:text-5xl md:drop-shadow-md lg:text-6xl">
          Report a county service problem. Track it until it is fixed.
        </h1>
        <p className="mt-5 max-w-2xl text-base text-brand-50 sm:text-lg">
          {SITE.name} lets residents report street lights, water, garbage, roads and more, and follow every request to resolution.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          {user ? (
            <Link to={dashboardPath} className={buttonClasses({ variant: 'light', size: 'lg' })}>
              Go to dashboard <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          ) : (
            <>
              <Link to="/signup" className={buttonClasses({ variant: 'light', size: 'lg' })}>
                Get started <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-md border border-white/60 px-6 py-3 text-base font-semibold text-white hover:bg-white/10"
              >
                Login
              </Link>
            </>
          )}
        </div>
      </HeroSlideshow>

      {/* Public stats */}
      <section className="relative z-10 mx-auto -mt-8 max-w-7xl px-4 sm:px-6">
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