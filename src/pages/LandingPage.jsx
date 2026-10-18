import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BellRing, Camera, FileText, Search, ShieldCheck, Zap } from 'lucide-react'
import { useAuth } from '../context/auth'
import { CATEGORIES, SITE } from '../data/constants'
import { buttonClasses } from '../lib/helpers'

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

const FEATURES = [
  { icon: Zap, title: 'Report in minutes', text: 'Pick a category, describe the problem and send it. No queues, no paperwork.' },
  { icon: Camera, title: 'Add a photo and location', text: 'Show the county exactly what and where the problem is so it is fixed faster.' },
  { icon: BellRing, title: 'Follow every update', text: 'See your request move from Pending to In Progress to Resolved.' },
]

const STEPS = [
  { icon: ShieldCheck, title: 'Create an account', text: 'Sign up with your email, ward and a password.' },
  { icon: FileText, title: 'Submit a request', text: 'Pick a category, add the location, details and a photo.' },
  { icon: Search, title: 'Track progress', text: 'Follow it from Pending to In Progress to Resolved.' },
]

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** True once the element has scrolled into view (and stays true). */
function useInView(threshold = 0.15) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (!('IntersectionObserver' in window)) {
      setInView(true)
      return
    }
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
  }, [threshold])

  return [ref, inView]
}

/** Fades and slides its children up when they scroll into view. */
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

/**
 * Hero wrapper.
 * Phones/small tablets: the picture shows in full on top (no overlay),
 * and the text sits on solid green underneath, so nothing hides the photo.
 * md and up: the picture fills the hero and a soft shade covers only the
 * left side behind the text, so the right side stays bright and clear.
 * Extras: slow zoom on the active photo, and swipe on phones. No visible controls.
 */
function HeroSlideshow({ children }) {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const touchX = useRef(null)
  const total = HERO_IMAGES.length

  const next = () => setActive((i) => (i + 1) % total)
  const prev = () => setActive((i) => (i - 1 + total) % total)

  useEffect(() => {
    if (paused || total < 2 || prefersReducedMotion()) return
    const id = setInterval(() => setActive((i) => (i + 1) % total), SLIDE_INTERVAL_MS)
    return () => clearInterval(id)
  }, [paused, total])

  const onTouchStart = (e) => {
    touchX.current = e.touches[0].clientX
    setPaused(true)
  }
  const onTouchEnd = (e) => {
    const dx = e.changedTouches[0].clientX - (touchX.current ?? 0)
    if (Math.abs(dx) > 50) (dx < 0 ? next : prev)()
    touchX.current = null
    setPaused(false)
  }

  return (
    <section
      className="relative isolate bg-brand-800 text-white md:flex md:min-h-[34rem] md:items-center md:overflow-hidden lg:min-h-[40rem]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Pictures: a block on top on phones, full background from md up */}
      <div className="relative h-64 w-full overflow-hidden sm:h-80 md:absolute md:inset-0 md:-z-10 md:h-auto">
        {HERO_IMAGES.map((img, i) => {
          const isActive = i === active
          return (
            <img
              key={img.src}
              src={img.src}
              alt=""
              aria-hidden="true"
              decoding="async"
              loading={i === 0 ? 'eager' : 'lazy'}
              fetchPriority={i === 0 ? 'high' : 'auto'}
              style={{
                objectPosition: img.position,
                // Active: fade in + slow zoom. Inactive: fade out, then reset zoom unseen.
                transition: isActive ? 'opacity 1s ease, transform 8s linear' : 'opacity 1s ease, transform 0s linear 1s',
              }}
              className={`absolute inset-0 h-full w-full object-cover motion-reduce:scale-100 ${
                isActive ? 'scale-110 opacity-100' : 'scale-100 opacity-0'
              }`}
            />
          )
        })}

        {/* Phones: only a thin blend into the green panel below */}
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-brand-800 to-transparent md:hidden" />

        {/* md+: shade only the left ~55% behind the text, clear on the right */}
        <div className="absolute inset-0 hidden bg-gradient-to-r from-brand-900/85 via-brand-900/45 via-45% to-transparent to-70% md:block" />
      </div>

      {/* Hero content */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-16 pt-8 sm:px-6 md:pb-28 md:pt-20">{children}</div>
    </section>
  )
}

export default function LandingPage() {
  const { user, isAdmin } = useAuth()
  const dashboardPath = isAdmin ? '/admin' : '/dashboard'
  const reportPath = user ? dashboardPath : '/login'

  return (
    <>
      {/* Hero: each piece rises in one after the other */}
      <HeroSlideshow>
        <Reveal>
          <p className="mb-3 inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider backdrop-blur-sm">
            {SITE.county}
          </p>
        </Reveal>
        <Reveal delay={120}>
          <h1 className="max-w-3xl text-3xl font-extrabold leading-tight sm:text-5xl md:drop-shadow-md lg:text-6xl">
            Report a county service problem. Track it until it is fixed.
          </h1>
        </Reveal>
        <Reveal delay={240}>
          <p className="mt-5 max-w-2xl text-base text-brand-50 sm:text-lg">
            {SITE.name} lets residents report street lights, water, garbage, roads and more, and follow every request to resolution.
          </p>
        </Reveal>
        <Reveal delay={360}>
          <div className="mt-8 flex flex-wrap gap-3">
            {user ? (
              <Link to={dashboardPath} className={`group ${buttonClasses({ variant: 'light', size: 'lg' })}`}>
                Go to dashboard
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
              </Link>
            ) : (
              <>
                <Link to="/signup" className={`group ${buttonClasses({ variant: 'light', size: 'lg' })}`}>
                  Get started
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center rounded-md border border-white/60 px-6 py-3 text-base font-semibold text-white transition hover:bg-white/10"
                >
                  Login
                </Link>
              </>
            )}
          </div>
        </Reveal>
      </HeroSlideshow>

      {/* Why use it: cards lift, glow and tilt their icon on hover */}
      <section className="relative z-10 mx-auto -mt-8 max-w-7xl px-4 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 120}>
              <div className="group h-full cursor-default rounded-xl border border-slate-200 bg-white p-5 shadow-md transition-all duration-300 hover:-translate-y-2 hover:border-brand-400 hover:bg-brand-50 hover:shadow-xl hover:shadow-brand-600/20 motion-reduce:transform-none">
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-50 text-brand-700 transition-all duration-300 group-hover:rotate-6 group-hover:scale-110 group-hover:bg-brand-600 group-hover:text-white">
                  <f.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 font-semibold text-slate-900">{f.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{f.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Services: tap a card to start a report */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <Reveal>
          <h2 className="text-2xl font-bold text-slate-900">Services you can report</h2>
          <p className="mt-1 text-slate-600">Choose the category that best matches the problem.</p>
        </Reveal>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((c, i) => (
            <Reveal key={c.id} delay={(i % 3) * 100}>
              <Link
                to={reportPath}
                className="group relative block h-full overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:border-brand-400 hover:bg-brand-50 hover:shadow-xl hover:shadow-brand-600/20 motion-reduce:transform-none"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-50 text-brand-700 transition-all duration-300 group-hover:scale-110 group-hover:bg-brand-600 group-hover:text-white">
                  <c.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 font-semibold text-slate-900">{c.label}</h3>
                <p className="mt-1 text-sm text-slate-600">{c.description}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 transition-all duration-300 md:-translate-x-2 md:opacity-0 md:group-hover:translate-x-0 md:group-hover:opacity-100">
                  Report this <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="absolute bottom-0 left-0 h-1 w-0 bg-brand-600 transition-all duration-500 group-hover:w-full" />
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <Reveal>
            <h2 className="text-2xl font-bold text-slate-900">How it works</h2>
          </Reveal>
          <div className="mt-8 grid gap-8 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <Reveal key={s.title} delay={i * 150}>
                <div className="group flex h-full gap-4 rounded-xl border border-transparent p-4 transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:bg-brand-50 hover:shadow-lg motion-reduce:transform-none">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-600 font-bold text-white shadow-md shadow-brand-600/30 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="flex items-center gap-2 font-semibold text-slate-900">
                      <s.icon className="h-4 w-4 text-brand-600" aria-hidden="true" />
                      {s.title}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">{s.text}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Closing call to action (hidden once the visitor is logged in) */}
      {!user && (
        <section className="bg-slate-50">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
            <Reveal>
              <div className="flex flex-col items-start justify-between gap-6 rounded-2xl bg-gradient-to-br from-brand-700 to-brand-900 p-8 text-white shadow-lg sm:flex-row sm:items-center sm:p-10">
                <div>
                  <h2 className="text-2xl font-bold sm:text-3xl">See a problem in your ward?</h2>
                  <p className="mt-2 max-w-xl text-brand-50">Create a free account and report it in under two minutes.</p>
                </div>
                <Link to="/signup" className={`group shrink-0 ${buttonClasses({ variant: 'light', size: 'lg' })}`}>
                  Get started
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
                </Link>
              </div>
            </Reveal>
          </div>
        </section>
      )}
    </>
  )
}