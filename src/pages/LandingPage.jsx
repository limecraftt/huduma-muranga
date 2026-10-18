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

/** Hero wrapper: fading background slideshow + green overlay + dots. */
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
      className="relative isolate flex min-h-[32rem] items-center overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 text-white sm:min-h-[36rem] lg:min-h-[40rem]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
    >
      {/* Background pictures: stacked, only the active one is visible */}
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
          className={`absolute inset-0 -z-20 h-full w-full object-cover transition-opacity duration-1000 ${
            i === active ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ))}

      {/* Green overlay: top-to-bottom on phones (text covers the full width),
          left-to-right on tablets and desktops (text sits on the left) */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-brand-900/85 via-brand-800/75 to-brand-700/85 sm:bg-gradient-to-r sm:from-brand-900/90 sm:via-brand-800/65 sm:to-brand-600/20" />

      {/* Hero content */}
      <div className="mx-auto w-full max-w-7xl px-4 pb-20 pt-14 sm:px-6 sm:pb-28 sm:pt-20">{children}</div>

      {/* Slide dots */}
      {HERO_IMAGES.length > 1 && (
        <div className="absolute bottom-12 left-1/2 flex -translate-x-1/2 gap-2 sm:bottom-14">
          {HERO_IMAGES.map((img, i) => (
            <button
              key={img.src}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Show slide ${i + 1}`}
              aria-current={i === active}
              className={`h-2.5 rounded-full transition-all ${
                i === active ? 'w-8 bg-white' : 'w-2.5 bg-white/50 hover:bg-white/80'
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
        <h1 className="max-w-3xl text-3xl font-extrabold leading-tight drop-shadow-sm sm:text-5xl lg:text-6xl">
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