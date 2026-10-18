/**
 * Huduma Murang'a: Public Service Request System
 *
 * SINGLE-FILE VERSION so you can see the whole UI working first.
 * Later we split this file into components/, pages/, services/ etc.
 * Sections below are in the same order as the future folders:
 *   1. Config        2. Data        3. Utils        4. Services (mock backend)
 *   5. Auth context  6. UI pieces   7. Layout       8. Request components
 *   9. Pages         10. App + routes
 */
import { createContext, useCallback, useContext, useEffect, useId, useMemo, useState } from 'react'
import {
  BrowserRouter, Link, NavLink, Navigate, Outlet, Route, Routes,
  useLocation, useNavigate, useParams, useSearchParams,
} from 'react-router-dom'
import {
  AlertCircle, ArrowLeft, ArrowRight, Calendar, Check, CheckCircle2, ChevronRight, ChevronsUp,
  ClipboardCheck, Clock, Construction, Droplets, Eye, FilePlus2, FileSearch, FileText,
  HeartPulse, ImagePlus, Info, LayoutDashboard, Lightbulb, Loader, Loader2, LogIn, LogOut,
  Mail, MapPin, Menu, MoreHorizontal, Phone, Plus, Search, Trash2, User, UserPlus, X,
} from 'lucide-react'

/* ==========================================================================
 * 1. CONFIG  (future: src/config/site.js)
 *    Contact details are placeholders for the academic demo.
 * ======================================================================== */
const SITE = {
  county: "Murang'a County",
  description:
    "We are dedicated to transforming the livelihood of the people of Murang'a County on a foundation of integrity through accountable, efficient and effective leadership.",
  copyrightYears: '2026 - 2027',
  disclaimer: 'Academic project. Not an official government service.',
}
const CONTACT = {
  address: "P.O Box 00000 - 10200 Murang'a",
  phone: '+254 700 000 000',
  email: 'info@example.go.ke',
  complaintsEmail: 'complaints@example.go.ke',
}
const QUICK_CONTACTS = [
  { label: 'Ambulance', phone: '0700 000 001' },
  { label: 'Call Center', phone: '0700 000 002' },
  { label: 'Fire Hotline', phone: '0700 000 003' },
]
const SOCIAL_LINKS = [
  { name: 'Facebook', href: '#', icon: 'facebook' },
  { name: 'X (Twitter)', href: '#', icon: 'twitter' },
  { name: 'Instagram', href: '#', icon: 'instagram' },
]

/* ==========================================================================
 * 2. DATA  (future: src/data/categories.js and seed.js)
 * ======================================================================== */
const CATEGORIES = [
  { id: 'street-lights', label: 'Street Lights', icon: Lightbulb, description: 'Broken or missing street lighting' },
  { id: 'water', label: 'Water & Sewer', icon: Droplets, description: 'Leaks, shortages, burst pipes, sewer blockages' },
  { id: 'garbage', label: 'Garbage Collection', icon: Trash2, description: 'Missed collection, illegal dumping' },
  { id: 'roads', label: 'Roads & Drainage', icon: Construction, description: 'Potholes, blocked drains, damaged culverts' },
  { id: 'health', label: 'Public Health', icon: HeartPulse, description: 'Sanitation and public health concerns' },
  { id: 'other', label: 'Other Services', icon: MoreHorizontal, description: 'Anything else the county should know about' },
]
const SUB_COUNTIES = ['Kangema', 'Mathioya', 'Kiharu', 'Kigumo', 'Maragwa', 'Kandara', 'Gatanga']

const STATUS = { PENDING: 'pending', IN_PROGRESS: 'in_progress', RESOLVED: 'resolved' }
const STATUS_FLOW = [STATUS.PENDING, STATUS.IN_PROGRESS, STATUS.RESOLVED]
const STATUS_META = {
  pending: { label: 'Pending', classes: 'bg-amber-50 text-amber-800 ring-amber-200', dot: 'bg-amber-500' },
  in_progress: { label: 'In Progress', classes: 'bg-sky-50 text-sky-800 ring-sky-200', dot: 'bg-sky-500' },
  resolved: { label: 'Resolved', classes: 'bg-brand-50 text-brand-800 ring-brand-200', dot: 'bg-brand-600' },
}
const ROLES = { CITIZEN: 'citizen', ADMIN: 'admin' }

// Demo accounts. Plain-text passwords ONLY because this is a mock backend.
const DEMO_ADMIN = { id: 'admin-1', fullName: 'Service Admin', email: 'admin@huduma.test', phone: '0700000000', password: 'Admin@123', role: ROLES.ADMIN }
const DEMO_CITIZEN = { id: 'citizen-1', fullName: 'Wanjiku Kamau', email: 'citizen@huduma.test', phone: '0711000000', password: 'Citizen@123', role: ROLES.CITIZEN }

const daysAgo = (n) => new Date(Date.now() - n * 86_400_000).toISOString()
const received = (n) => ({ status: STATUS.PENDING, at: daysAgo(n), note: 'Request received' })

const SEED_USERS = [DEMO_ADMIN, DEMO_CITIZEN]
const SEED_REQUESTS = [
  {
    id: 'seed-1', ref: 'HM-2026-0001', userId: 'citizen-1', category: 'street-lights', subCounty: 'Kiharu',
    location: "Murang'a Town, near Kenol junction",
    description: 'The street light outside the bus stage has been out for two weeks. It is very dark at night.',
    image: null, status: STATUS.RESOLVED, createdAt: daysAgo(21), updatedAt: daysAgo(14),
    history: [received(21), { status: STATUS.IN_PROGRESS, at: daysAgo(18), note: 'Technician assigned' }, { status: STATUS.RESOLVED, at: daysAgo(14), note: 'Bulb and wiring replaced' }],
  },
  {
    id: 'seed-2', ref: 'HM-2026-0002', userId: 'citizen-1', category: 'water', subCounty: 'Kangema', location: 'Kangema Market',
    description: 'A main pipe is leaking near the market and water is flowing onto the road.',
    image: null, status: STATUS.IN_PROGRESS, createdAt: daysAgo(6), updatedAt: daysAgo(3),
    history: [received(6), { status: STATUS.IN_PROGRESS, at: daysAgo(3), note: 'Water team dispatched' }],
  },
  {
    id: 'seed-3', ref: 'HM-2026-0003', userId: 'citizen-1', category: 'garbage', subCounty: 'Maragwa', location: 'Kenol, behind the main stage',
    description: 'Garbage has not been collected for over a week and the pile is attracting dogs.',
    image: null, status: STATUS.PENDING, createdAt: daysAgo(2), updatedAt: daysAgo(2), history: [received(2)],
  },
  {
    id: 'seed-4', ref: 'HM-2026-0004', userId: 'citizen-2', category: 'roads', subCounty: 'Kandara', location: 'Kandara-Gatanga road, 2km from the town',
    description: 'Large potholes have formed after the rains, making the road dangerous for motorbikes.',
    image: null, status: STATUS.RESOLVED, createdAt: daysAgo(30), updatedAt: daysAgo(20),
    history: [received(30), { status: STATUS.IN_PROGRESS, at: daysAgo(26), note: 'Road crew scheduled' }, { status: STATUS.RESOLVED, at: daysAgo(20), note: 'Potholes patched' }],
  },
  {
    id: 'seed-5', ref: 'HM-2026-0005', userId: 'citizen-3', category: 'street-lights', subCounty: 'Gatanga', location: 'Ngorongo shopping centre',
    description: 'Three street lights are not working along the main shopping strip.',
    image: null, status: STATUS.PENDING, createdAt: daysAgo(1), updatedAt: daysAgo(1), history: [received(1)],
  },
  {
    id: 'seed-6', ref: 'HM-2026-0006', userId: 'citizen-4', category: 'water', subCounty: 'Mathioya', location: 'Kiru village',
    description: 'No water supply for five days. Residents are walking far to fetch water.',
    image: null, status: STATUS.IN_PROGRESS, createdAt: daysAgo(5), updatedAt: daysAgo(4),
    history: [received(5), { status: STATUS.IN_PROGRESS, at: daysAgo(4), note: 'Investigating the intake' }],
  },
]

/* ==========================================================================
 * 3. UTILS  (future: src/utils/format.js and image.js)
 * ======================================================================== */
const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }) : ''

const formatDateTime = (iso) =>
  iso
    ? new Date(iso).toLocaleString('en-KE', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : ''

const categoryOf = (id) => CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1]
const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
const isValidKenyanPhone = (v) => /^(?:\+254|0)[17]\d{8}$/.test(v.replace(/\s+/g, ''))

/** Resizes an image to a small JPEG data URL (localStorage has a ~5MB limit). */
function fileToResizedDataUrl(file, maxSize = 900, quality = 0.75) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) return reject(new Error('Please choose an image file.'))
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read the image.'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('That image could not be opened.'))
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}

/* ==========================================================================
 * 4. SERVICES: mock backend on localStorage  (future: src/services/*)
 *    Pages only call these functions, so swapping in Supabase later means
 *    rewriting this section only.
 * ======================================================================== */
const USERS_KEY = 'huduma.users'
const SESSION_KEY = 'huduma.session'
const REQUESTS_KEY = 'huduma.requests'

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms))

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}
function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    throw new Error('Storage is full. Try a smaller image or clear old data.')
  }
}

function loadUsers() {
  const existing = readJson(USERS_KEY, null)
  if (existing) return existing
  writeJson(USERS_KEY, SEED_USERS)
  return SEED_USERS
}
function loadRequests() {
  const existing = readJson(REQUESTS_KEY, null)
  if (existing) return existing
  writeJson(REQUESTS_KEY, SEED_REQUESTS)
  return SEED_REQUESTS
}
const newestFirst = (a, b) => new Date(b.createdAt) - new Date(a.createdAt)

// Never hand the password to the UI
// eslint-disable-next-line no-unused-vars
const toPublicUser = ({ password, ...safe }) => safe

const authService = {
  getSession() {
    const id = readJson(SESSION_KEY, null)
    const user = id ? loadUsers().find((u) => u.id === id) : null
    return user ? toPublicUser(user) : null
  },
  async register({ fullName, email, phone, password }) {
    await delay()
    const users = loadUsers()
    if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('An account with that email already exists.')
    }
    const user = { id: crypto.randomUUID(), fullName, email, phone, password, role: ROLES.CITIZEN }
    writeJson(USERS_KEY, [...users, user])
    writeJson(SESSION_KEY, user.id)
    return toPublicUser(user)
  },
  async login({ email, password }) {
    await delay()
    const user = loadUsers().find((u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password)
    if (!user) throw new Error('Incorrect email or password.')
    writeJson(SESSION_KEY, user.id)
    return toPublicUser(user)
  },
  logout() {
    try {
      localStorage.removeItem(SESSION_KEY)
    } catch {
      /* nothing to do */
    }
  },
}

const requestService = {
  async list() {
    await delay(200)
    return [...loadRequests()].sort(newestFirst)
  },
  async listForUser(userId) {
    await delay(200)
    return loadRequests().filter((r) => r.userId === userId).sort(newestFirst)
  },
  async get(id) {
    await delay(150)
    return loadRequests().find((r) => r.id === id) ?? null
  },
  async create({ userId, category, subCounty, location, description, image }) {
    await delay(400)
    const requests = loadRequests()
    const now = new Date().toISOString()
    const request = {
      id: crypto.randomUUID(),
      ref: `HM-${new Date().getFullYear()}-${String(requests.length + 1).padStart(4, '0')}`,
      userId, category, subCounty, location, description,
      image: image ?? null,
      status: STATUS.PENDING,
      createdAt: now,
      updatedAt: now,
      history: [{ status: STATUS.PENDING, at: now, note: 'Request received' }],
    }
    writeJson(REQUESTS_KEY, [...requests, request])
    return request
  },
  async updateStatus(id, status, note = '') {
    await delay(250)
    const now = new Date().toISOString()
    let updated = null
    const next = loadRequests().map((r) => {
      if (r.id !== id) return r
      updated = { ...r, status, updatedAt: now, history: [...r.history, { status, at: now, note: note || 'Status updated by administrator' }] }
      return updated
    })
    if (!updated) throw new Error('Request not found.')
    writeJson(REQUESTS_KEY, next)
    return updated
  },
}

/** Numbers for the admin analytics (pure function, easy to test). */
function computeStats(requests) {
  const count = (s) => requests.filter((r) => r.status === s).length
  const pending = count(STATUS.PENDING)
  const inProgress = count(STATUS.IN_PROGRESS)
  const resolved = count(STATUS.RESOLVED)
  const total = requests.length
  return {
    total, pending, inProgress, resolved,
    open: pending + inProgress,
    resolutionRate: total ? Math.round((resolved / total) * 100) : 0,
    byCategory: CATEGORIES.map((c) => ({
      id: c.id,
      label: c.label,
      total: requests.filter((r) => r.category === c.id).length,
      resolved: requests.filter((r) => r.category === c.id && r.status === STATUS.RESOLVED).length,
    })).filter((c) => c.total > 0),
  }
}

/* ==========================================================================
 * 5. AUTH CONTEXT + HOOKS  (future: src/context/ and src/hooks/)
 * ======================================================================== */
const AuthContext = createContext(null)

function AuthProvider({ children }) {
  const [user, setUser] = useState(() => authService.getSession())

  const login = useCallback(async (credentials) => {
    const loggedIn = await authService.login(credentials)
    setUser(loggedIn)
    return loggedIn
  }, [])
  const register = useCallback(async (details) => {
    const created = await authService.register(details)
    setUser(created)
    return created
  }, [])
  const logout = useCallback(() => {
    authService.logout()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, login, register, logout, isAdmin: user?.role === ROLES.ADMIN }),
    [user, login, register, logout],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>')
  return context
}

/** useRequests() = all requests (admin). useRequests(userId) = one citizen's. */
function useRequests(userId) {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      setRequests(userId ? await requestService.listForUser(userId) : await requestService.list())
      setError('')
    } catch (err) {
      setError(err.message || 'Could not load requests.')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  return { requests, loading, error, reload: load }
}

/* ==========================================================================
 * 6. UI PIECES  (future: src/components/ui/*)
 * ======================================================================== */
const BUTTON_BASE =
  'inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60'
const BUTTON_VARIANTS = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 shadow-sm',
  outline: 'border border-brand-600 text-brand-700 bg-white hover:bg-brand-50',
  ghost: 'text-slate-700 hover:bg-slate-100',
  light: 'bg-white text-brand-700 hover:bg-brand-50 shadow-sm',
}
const BUTTON_SIZES = { sm: 'px-3 py-1.5 text-sm', md: 'px-4 py-2.5 text-sm', lg: 'px-6 py-3 text-base' }

/** Same look for <button> and <Link>: className={buttonClasses({ variant: 'outline' })} */
const buttonClasses = ({ variant = 'primary', size = 'md', className = '' } = {}) =>
  `${BUTTON_BASE} ${BUTTON_VARIANTS[variant]} ${BUTTON_SIZES[size]} ${className}`.trim()

function Button({ variant, size, loading = false, className, children, disabled, type = 'button', ...rest }) {
  return (
    <button type={type} disabled={disabled || loading} className={buttonClasses({ variant, size, className })} {...rest}>
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  )
}

const CONTROL =
  'block w-full rounded-md border bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20'

/** Label + control + hint/error. `control(id, describedBy)` renders the actual input. */
function FieldShell({ label, hint, error, required, control }) {
  const id = useId()
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="ml-0.5 text-red-600" aria-hidden="true">*</span>}
      </label>
      {control(id, describedBy)}
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-sm text-red-600">{error}</p>
      ) : (
        hint && <p id={`${id}-hint`} className="mt-1.5 text-xs text-slate-500">{hint}</p>
      )}
    </div>
  )
}
const fieldClass = (error) => `${CONTROL} ${error ? 'border-red-400' : 'border-slate-300'}`

function Input({ label, hint, error, required, ...props }) {
  return (
    <FieldShell label={label} hint={hint} error={error} required={required}
      control={(id, d) => <input id={id} required={required} aria-invalid={Boolean(error)} aria-describedby={d} className={fieldClass(error)} {...props} />} />
  )
}
function Textarea({ label, hint, error, required, rows = 4, ...props }) {
  return (
    <FieldShell label={label} hint={hint} error={error} required={required}
      control={(id, d) => <textarea id={id} rows={rows} required={required} aria-invalid={Boolean(error)} aria-describedby={d} className={fieldClass(error)} {...props} />} />
  )
}
function Select({ label, hint, error, required, options, placeholder, ...props }) {
  return (
    <FieldShell label={label} hint={hint} error={error} required={required}
      control={(id, d) => (
        <select id={id} required={required} aria-invalid={Boolean(error)} aria-describedby={d} className={fieldClass(error)} {...props}>
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      )} />
  )
}

function StatusBadge({ status }) {
  const meta = STATUS_META[status] ?? STATUS_META.pending
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${meta.classes}`}>
      <span className={`size-1.5 rounded-full ${meta.dot}`} aria-hidden="true" />
      {meta.label}
    </span>
  )
}

const ALERT_STYLES = {
  error: { box: 'border-red-200 bg-red-50 text-red-800', Icon: AlertCircle },
  success: { box: 'border-brand-200 bg-brand-50 text-brand-800', Icon: CheckCircle2 },
  info: { box: 'border-sky-200 bg-sky-50 text-sky-800', Icon: Info },
}
function Alert({ type = 'info', children }) {
  const { box, Icon } = ALERT_STYLES[type]
  return (
    <div role={type === 'error' ? 'alert' : 'status'} className={`flex gap-3 rounded-md border p-3 text-sm ${box}`}>
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div>{children}</div>
    </div>
  )
}

function Spinner({ label = 'Loading...' }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-slate-500" role="status">
      <Loader2 className="size-5 animate-spin text-brand-600" aria-hidden="true" />
      <span className="text-sm">{label}</span>
    </div>
  )
}

function PageHeader({ title, subtitle, children }) {
  return (
    <div className="bg-brand-700 text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
          {subtitle && <p className="mt-1 max-w-2xl text-brand-100">{subtitle}</p>}
        </div>
        {children}
      </div>
    </div>
  )
}

function EmptyState({ icon: Icon, title, message, action }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
      {Icon && (
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
          <Icon className="size-6" aria-hidden="true" />
        </div>
      )}
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      {message && <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">{message}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

/* ==========================================================================
 * 7. LAYOUT: logo, navbar, footer, route guard  (future: src/components/layout/*)
 * ======================================================================== */
/** Original placeholder emblem. `light` = white version for green backgrounds. */
function Logo({ light = false }) {
  return (
    <span className="inline-flex items-center gap-3">
      <svg viewBox="0 0 48 56" className="h-11 w-auto" aria-hidden="true">
        <path d="M24 2 4 9v19c0 13 8.5 22 20 26 11.5-4 20-13 20-26V9L24 2Z" fill={light ? '#ffffff' : '#1a8754'} />
        <path d="M24 8 9 13.5V28c0 10.4 6.4 17.6 15 21 8.6-3.4 15-10.6 15-21V13.5L24 8Z" fill={light ? '#1a8754' : '#ffffff'} />
        <circle cx="24" cy="22" r="5" fill="#c9a37b" />
        <path d="M24 46c-5-6-6-12-1-17 3 3 6 5 8 9-1 4-3 6-7 8Z" fill={light ? '#ffffff' : '#1a8754'} />
      </svg>
      <span className="leading-tight">
        <span className={`block text-lg font-extrabold tracking-tight ${light ? 'text-white' : 'text-brand-800'}`}>Huduma Murang&apos;a</span>
        <span className={`block text-[11px] font-medium uppercase tracking-wider ${light ? 'text-brand-100' : 'text-slate-500'}`}>Public Service Requests</span>
      </span>
    </span>
  )
}

/** Brand icons as inline SVG (lucide-react no longer ships brand logos). */
function SocialIcon({ name }) {
  const shapes = {
    facebook: <path d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.6-1.5h1.5V4.4c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8v2.4H8v3h2.7V21h2.8Z" />,
    twitter: <path d="M17.8 4h2.7l-5.9 6.7L21.5 20h-5.4l-4.2-5.5L7 20H4.3l6.3-7.2L3.8 4h5.5l3.8 5 4.7-5Zm-1 14.4h1.5L8.5 5.5H6.9l9.9 12.9Z" />,
    instagram: (
      <>
        <rect x="4.5" y="4.5" width="15" height="15" rx="4.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="12" cy="12" r="3.4" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="16.6" cy="7.4" r="1" />
      </>
    ),
  }
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="size-4" aria-hidden="true">
      {shapes[name]}
    </svg>
  )
}

function FooterHeading({ children }) {
  return <h2 className="mb-5 border-l-4 border-accent pl-3 text-xl font-semibold text-white">{children}</h2>
}

/** Round "back to top" button that appears after scrolling. */
function ScrollToTopButton() {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  if (!visible) return null
  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Back to top"
      className="fixed bottom-6 right-6 z-40 flex size-12 items-center justify-center rounded-full bg-accent text-white shadow-lg transition hover:brightness-110"
    >
      <ChevronsUp className="size-6" aria-hidden="true" />
    </button>
  )
}

function Footer() {
  const tel = (p) => `tel:${p.replace(/\s/g, '')}`
  return (
    <footer className="mt-auto">
      <div className="bg-brand-600 text-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-3">
          <div>
            <Logo light />
            <p className="mt-6 max-w-xs text-sm leading-7 text-white/95">{SITE.description}</p>
            <div className="mt-8">
              <FooterHeading>Social Info</FooterHeading>
              <ul className="flex gap-3">
                {SOCIAL_LINKS.map((s) => (
                  <li key={s.name}>
                    <a href={s.href} aria-label={s.name} className="flex size-9 items-center justify-center border border-dotted border-white/60 text-white transition hover:bg-white/15">
                      <SocialIcon name={s.icon} />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div>
            <FooterHeading>Get In Touch</FooterHeading>
            <ul className="space-y-4 text-sm font-medium">
              <li className="flex items-start gap-2.5"><MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />{CONTACT.address}</li>
              <li className="flex items-center gap-2.5"><Phone className="size-4 shrink-0" aria-hidden="true" /><a href={tel(CONTACT.phone)} className="hover:underline">{CONTACT.phone}</a></li>
              <li className="flex items-center gap-2.5"><Mail className="size-4 shrink-0" aria-hidden="true" /><a href={`mailto:${CONTACT.email}`} className="hover:underline">{CONTACT.email}</a></li>
              <li className="flex items-center gap-2.5"><Mail className="size-4 shrink-0" aria-hidden="true" /><a href={`mailto:${CONTACT.complaintsEmail}`} className="hover:underline">{CONTACT.complaintsEmail}</a></li>
            </ul>
          </div>

          <div>
            <FooterHeading>Quick Contacts</FooterHeading>
            <ul className="max-w-xs divide-y divide-white/25 text-sm font-medium">
              {QUICK_CONTACTS.map((c) => (
                <li key={c.label} className="flex items-center justify-between py-3 first:pt-0">
                  <span>{c.label}</span>
                  <a href={tel(c.phone)} className="flex items-center gap-2 hover:underline"><Phone className="size-4" aria-hidden="true" />{c.phone}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-mint text-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-5 text-sm font-medium sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>&copy; {SITE.copyrightYears} | All rights reserved by <span className="text-yellow-300">{SITE.county} Government</span></p>
          <p className="text-xs text-white/90">{SITE.disclaimer}</p>
        </div>
      </div>
      <ScrollToTopButton />
    </footer>
  )
}

const navLinkClass = ({ isActive }) =>
  `rounded-md px-3 py-2 text-sm font-semibold transition-colors ${isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-700 hover:bg-slate-100'}`

function Navbar() {
  const { user, isAdmin, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const links = [{ to: '/', label: 'Home', end: true }]
  if (user && !isAdmin) links.push({ to: '/requests/new', label: 'New Request' }, { to: '/requests', label: 'My Requests', end: true })
  if (isAdmin) links.push({ to: '/admin', label: 'Dashboard' })

  const close = () => setOpen(false)
  const handleLogout = () => {
    logout()
    close()
    navigate('/')
  }
  const firstName = user?.fullName.split(' ')[0]

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="bg-brand-800 text-xs text-brand-100">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-1.5 sm:px-6">
          <span>Murang&apos;a County &middot; Public Service Requests</span>
          <span className="hidden sm:inline">Academic demo</span>
        </div>
      </div>

      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6" aria-label="Main">
        <Link to="/" onClick={close} aria-label="Huduma Murang'a home"><Logo /></Link>

        <div className="hidden items-center gap-1 md:flex">
          {links.map((l) => <NavLink key={l.to} to={l.to} end={l.end} className={navLinkClass}>{l.label}</NavLink>)}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              <span className="flex items-center gap-2 pr-2 text-sm text-slate-600">
                {isAdmin ? <LayoutDashboard className="size-4" aria-hidden="true" /> : <User className="size-4" aria-hidden="true" />}
                {firstName}
              </span>
              <button type="button" onClick={handleLogout} className={buttonClasses({ variant: 'outline', size: 'sm' })}>
                <LogOut className="size-4" aria-hidden="true" />Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className={buttonClasses({ variant: 'outline', size: 'sm' })}>Log in</Link>
              <Link to="/register" className={buttonClasses({ size: 'sm' })}>Register</Link>
            </>
          )}
        </div>

        <button type="button" className="rounded-md p-2 text-slate-700 hover:bg-slate-100 md:hidden" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-label={open ? 'Close menu' : 'Open menu'}>
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-slate-200 bg-white px-4 pb-4 pt-2 md:hidden">
          <div className="flex flex-col gap-1">
            {links.map((l) => <NavLink key={l.to} to={l.to} end={l.end} className={navLinkClass} onClick={close}>{l.label}</NavLink>)}
          </div>
          <div className="mt-3 flex flex-col gap-2 border-t border-slate-100 pt-3">
            {user ? (
              <button type="button" onClick={handleLogout} className={buttonClasses({ variant: 'outline' })}>
                <LogOut className="size-4" aria-hidden="true" />Log out ({firstName})
              </button>
            ) : (
              <>
                <Link to="/login" onClick={close} className={buttonClasses({ variant: 'outline' })}>Log in</Link>
                <Link to="/register" onClick={close} className={buttonClasses()}>Register</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}

/** Page shell: navbar, page content, footer. */
function Layout() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-slate-50"><Outlet /></main>
      <Footer />
    </div>
  )
}

/** Route guard: <ProtectedRoute /> = logged in, <ProtectedRoute adminOnly /> = admins only. */
function ProtectedRoute({ adminOnly = false }) {
  const { user, isAdmin } = useAuth()
  const location = useLocation()
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  if (adminOnly && !isAdmin) return <Navigate to="/" replace />
  return <Outlet />
}

/* ==========================================================================
 * 8. REQUEST COMPONENTS  (future: src/components/)
 * ======================================================================== */
/** Pending -> In Progress -> Resolved tracker with dates and notes. */
function RequestTimeline({ request }) {
  const currentIndex = STATUS_FLOW.indexOf(request.status)
  return (
    <ol>
      {STATUS_FLOW.map((status, index) => {
        const reached = index <= currentIndex
        const entry = request.history.findLast((h) => h.status === status)
        const isLast = index === STATUS_FLOW.length - 1
        return (
          <li key={status} className="relative flex gap-4 pb-8 last:pb-0">
            {!isLast && (
              <span className={`absolute left-4 top-8 h-full w-0.5 -translate-x-1/2 ${index < currentIndex ? 'bg-brand-600' : 'bg-slate-200'}`} aria-hidden="true" />
            )}
            <span className={`relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border-2 ${reached ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300 bg-white text-slate-300'}`}>
              {reached ? <Check className="size-4" aria-hidden="true" /> : <span className="size-2 rounded-full bg-current" />}
            </span>
            <div className="pt-0.5">
              <p className={`text-sm font-semibold ${reached ? 'text-slate-900' : 'text-slate-400'}`}>{STATUS_META[status].label}</p>
              {entry ? (
                <>
                  <p className="text-xs text-slate-500">{formatDateTime(entry.at)}</p>
                  {entry.note && <p className="mt-0.5 text-sm text-slate-600">{entry.note}</p>}
                </>
              ) : (
                <p className="text-xs text-slate-400">Not reached yet</p>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

function RequestCard({ request }) {
  const category = categoryOf(request.category)
  const Icon = category.icon
  return (
    <Link to={`/requests/${request.id}`} className="group flex items-center gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-brand-300 hover:shadow-md">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
        <Icon className="size-6" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h3 className="font-semibold text-slate-900">{category.label}</h3>
          <span className="text-xs font-medium text-slate-500">{request.ref}</span>
        </div>
        <p className="mt-0.5 line-clamp-1 text-sm text-slate-600">{request.description}</p>
        <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
          <MapPin className="size-3.5" aria-hidden="true" />
          {request.location}, {request.subCounty} &middot; {formatDate(request.createdAt)}
        </p>
      </div>
      <div className="hidden shrink-0 sm:block"><StatusBadge status={request.status} /></div>
      <ChevronRight className="size-5 shrink-0 text-slate-400 transition group-hover:text-brand-600" aria-hidden="true" />
    </Link>
  )
}

/* ==========================================================================
 * 9. PAGES  (future: src/pages/*)
 * ======================================================================== */
const HOW_IT_WORKS = [
  { icon: FilePlus2, title: 'Submit', text: 'Pick a category, tell us where the problem is and add a photo.' },
  { icon: Search, title: 'Track', text: 'Follow your request from Pending to In Progress to Resolved.' },
  { icon: ClipboardCheck, title: 'Resolved', text: 'The county team fixes the issue and closes the request.' },
]

function Home() {
  const { user, isAdmin } = useAuth()
  const { requests } = useRequests()
  const stats = computeStats(requests)
  const primary = isAdmin ? { to: '/admin', label: 'Open dashboard' } : { to: '/requests/new', label: 'Report an issue' }

  return (
    <>
      <section className="bg-linear-to-br from-brand-700 via-brand-600 to-brand-500 text-white">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 md:py-20">
          <div>
            <p className="mb-3 inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider">Murang&apos;a County</p>
            <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl lg:text-5xl">Report a public service issue. Track it to resolution.</h1>
            <p className="mt-4 max-w-lg text-lg text-brand-50">Broken street lights, water problems, uncollected garbage. Tell the county once and follow every step online.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to={primary.to} className={buttonClasses({ variant: 'light', size: 'lg' })}>
                {primary.label}<ArrowRight className="size-5" aria-hidden="true" />
              </Link>
              {!user && (
                <Link to="/login" className="inline-flex items-center justify-center rounded-md border border-white/70 px-6 py-3 text-base font-semibold text-white transition hover:bg-white/10">Log in</Link>
              )}
            </div>
          </div>

          <div className="rounded-xl bg-white p-6 text-slate-800 shadow-xl">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">County at a glance</h2>
            <dl className="mt-4 grid grid-cols-3 gap-4 text-center">
              <div><dd className="text-3xl font-extrabold text-brand-700">{stats.total}</dd><dt className="mt-1 text-xs text-slate-500">Requests received</dt></div>
              <div><dd className="text-3xl font-extrabold text-amber-600">{stats.open}</dd><dt className="mt-1 text-xs text-slate-500">Being handled</dt></div>
              <div><dd className="text-3xl font-extrabold text-brand-700">{stats.resolved}</dd><dt className="mt-1 text-xs text-slate-500">Resolved</dt></div>
            </dl>
            <div className="mt-6">
              <div className="mb-1.5 flex justify-between text-xs font-medium text-slate-600"><span>Resolution rate</span><span>{stats.resolutionRate}%</span></div>
              <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${stats.resolutionRate}%` }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <h2 className="text-2xl font-bold text-slate-900">What would you like to report?</h2>
        <p className="mt-1 text-slate-600">Choose a service to start a new request.</p>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((c) => (
            <li key={c.id}>
              <Link to={`/requests/new?category=${c.id}`} className="group flex h-full items-start gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-400 hover:shadow-md">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700 transition group-hover:bg-brand-600 group-hover:text-white">
                  <c.icon className="size-6" aria-hidden="true" />
                </span>
                <span>
                  <span className="block font-semibold text-slate-900">{c.label}</span>
                  <span className="mt-0.5 block text-sm text-slate-600">{c.description}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <h2 className="text-center text-2xl font-bold text-slate-900">How it works</h2>
          <ol className="mt-10 grid gap-8 md:grid-cols-3">
            {HOW_IT_WORKS.map((s, i) => (
              <li key={s.title} className="text-center">
                <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-brand-600 text-white"><s.icon className="size-6" aria-hidden="true" /></span>
                <h3 className="mt-4 font-semibold text-slate-900">{i + 1}. {s.title}</h3>
                <p className="mx-auto mt-1 max-w-xs text-sm text-slate-600">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {!user && (
        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="flex flex-col items-start justify-between gap-6 rounded-xl bg-brand-50 p-8 ring-1 ring-brand-200 md:flex-row md:items-center">
            <div>
              <h2 className="text-xl font-bold text-brand-900">Create a free citizen account</h2>
              <p className="mt-1 text-brand-800">Register once to submit and track all your requests.</p>
            </div>
            <Link to="/register" className={buttonClasses({ size: 'lg' })}>Register now</Link>
          </div>
        </section>
      )}
    </>
  )
}

function Login() {
  const { user, isAdmin, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Already signed in: skip the form. (`!submitting` lets our own navigate() below run first.)
  if (user && !submitting) return <Navigate to={isAdmin ? '/admin' : '/requests'} replace />

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  const fillDemo = (account) => setForm({ email: account.email, password: account.password })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!isValidEmail(form.email)) return setError('Enter a valid email address.')
    setSubmitting(true)
    try {
      const loggedIn = await login(form)
      navigate(location.state?.from ?? (loggedIn.role === ROLES.ADMIN ? '/admin' : '/requests'), { replace: true })
    } catch (err) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:px-6">
      <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <span className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-brand-50 text-brand-700"><LogIn className="size-6" aria-hidden="true" /></span>
          <h1 className="text-2xl font-bold text-slate-900">Log in</h1>
          <p className="mt-1 text-sm text-slate-600">Access your service requests.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {error && <Alert type="error">{error}</Alert>}
          <Input label="Email address" type="email" autoComplete="email" required value={form.email} onChange={update('email')} />
          <Input label="Password" type="password" autoComplete="current-password" required value={form.password} onChange={update('password')} />
          <Button type="submit" loading={submitting} className="w-full">Log in</Button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-600">
          New here? <Link to="/register" className="font-semibold text-brand-700 hover:underline">Create an account</Link>
        </p>
      </div>

      <div className="mt-4 rounded-lg border border-dashed border-brand-300 bg-brand-50 p-4 text-sm text-brand-900">
        <p className="font-semibold">Demo accounts</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => fillDemo(DEMO_CITIZEN)}>Fill citizen login</Button>
          <Button size="sm" variant="outline" onClick={() => fillDemo(DEMO_ADMIN)}>Fill admin login</Button>
        </div>
      </div>
    </div>
  )
}

function validateRegistration(f) {
  const errors = {}
  if (f.fullName.trim().length < 3) errors.fullName = 'Enter your full name.'
  if (!isValidEmail(f.email)) errors.email = 'Enter a valid email address.'
  if (!isValidKenyanPhone(f.phone)) errors.phone = 'Use a Kenyan number such as 0712 345 678.'
  if (f.password.length < 8) errors.password = 'Use at least 8 characters.'
  if (f.confirm !== f.password) errors.confirm = 'Passwords do not match.'
  return errors
}

function Register() {
  const { user, register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Already signed in: skip the form. (`!submitting` lets our own navigate() below run first.)
  if (user && !submitting) return <Navigate to="/requests" replace />

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setServerError('')
    const found = validateRegistration(form)
    setErrors(found)
    if (Object.keys(found).length > 0) return
    setSubmitting(true)
    try {
      await register({ fullName: form.fullName.trim(), email: form.email.trim(), phone: form.phone.replace(/\s+/g, ''), password: form.password })
      navigate('/requests/new', { replace: true })
    } catch (err) {
      setServerError(err.message)
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:px-6">
      <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <span className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-brand-50 text-brand-700"><UserPlus className="size-6" aria-hidden="true" /></span>
          <h1 className="text-2xl font-bold text-slate-900">Create your account</h1>
          <p className="mt-1 text-sm text-slate-600">Register as a citizen to submit service requests.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {serverError && <Alert type="error">{serverError}</Alert>}
          <Input label="Full name" autoComplete="name" required value={form.fullName} onChange={update('fullName')} error={errors.fullName} />
          <Input label="Email address" type="email" autoComplete="email" required value={form.email} onChange={update('email')} error={errors.email} />
          <Input label="Phone number" type="tel" autoComplete="tel" required placeholder="0712 345 678" value={form.phone} onChange={update('phone')} error={errors.phone} />
          <Input label="Password" type="password" autoComplete="new-password" required hint="At least 8 characters." value={form.password} onChange={update('password')} error={errors.password} />
          <Input label="Confirm password" type="password" autoComplete="new-password" required value={form.confirm} onChange={update('confirm')} error={errors.confirm} />
          <Button type="submit" loading={submitting} className="w-full">Create account</Button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-600">
          Already registered? <Link to="/login" className="font-semibold text-brand-700 hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  )
}

const MAX_IMAGE_MB = 8

function NewRequest() {
  const { user } = useAuth()
  const [params] = useSearchParams()
  const presetCategory = CATEGORIES.some((c) => c.id === params.get('category')) ? params.get('category') : ''

  const [form, setForm] = useState({ category: presetCategory, subCounty: '', location: '', description: '' })
  const [image, setImage] = useState(null)
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [created, setCreated] = useState(null)

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleImage = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setErrors((prev) => ({ ...prev, image: undefined }))
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      return setErrors((prev) => ({ ...prev, image: `Image must be smaller than ${MAX_IMAGE_MB}MB.` }))
    }
    try {
      setImage(await fileToResizedDataUrl(file))
    } catch (err) {
      setErrors((prev) => ({ ...prev, image: err.message }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setServerError('')
    const found = {}
    if (!form.category) found.category = 'Choose a category.'
    if (!form.subCounty) found.subCounty = 'Choose a sub-county.'
    if (form.location.trim().length < 3) found.location = 'Describe where the problem is.'
    if (form.description.trim().length < 15) found.description = 'Please give a little more detail (at least 15 characters).'
    setErrors(found)
    if (Object.keys(found).length > 0) return

    setSubmitting(true)
    try {
      setCreated(await requestService.create({ userId: user.id, ...form, location: form.location.trim(), description: form.description.trim(), image }))
    } catch (err) {
      setServerError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (created) {
    return (
      <div className="mx-auto max-w-lg px-4 py-14 sm:px-6">
        <div className="rounded-xl border border-brand-200 bg-white p-8 text-center shadow-sm">
          <CheckCircle2 className="mx-auto size-14 text-brand-600" aria-hidden="true" />
          <h1 className="mt-4 text-2xl font-bold text-slate-900">Request submitted</h1>
          <p className="mt-2 text-slate-600">Keep this reference number to follow up on your request.</p>
          <p className="mx-auto mt-4 inline-block rounded-md bg-brand-50 px-5 py-2 font-mono text-xl font-bold tracking-wider text-brand-800">{created.ref}</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to={`/requests/${created.id}`} className={buttonClasses()}>Track this request</Link>
            <Link to="/requests" className={buttonClasses({ variant: 'outline' })}>View all my requests</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <PageHeader title="Submit a service request" subtitle="Tell us what needs fixing and where. We will keep you updated." />
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <form onSubmit={handleSubmit} noValidate className="space-y-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          {serverError && <Alert type="error">{serverError}</Alert>}

          <fieldset>
            <legend className="mb-2 text-sm font-medium text-slate-700">Service category <span className="text-red-600" aria-hidden="true">*</span></legend>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {CATEGORIES.map((c) => {
                const selected = form.category === c.id
                return (
                  <label key={c.id} className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition ${selected ? 'border-brand-600 bg-brand-50 ring-1 ring-brand-600' : 'border-slate-200 hover:border-brand-300'}`}>
                    <input type="radio" name="category" value={c.id} checked={selected} onChange={update('category')} className="sr-only" />
                    <c.icon className={`size-5 ${selected ? 'text-brand-700' : 'text-slate-500'}`} aria-hidden="true" />
                    <span className="text-sm font-medium text-slate-800">{c.label}</span>
                  </label>
                )
              })}
            </div>
            {errors.category && <p role="alert" className="mt-1.5 text-sm text-red-600">{errors.category}</p>}
          </fieldset>

          <div className="grid gap-5 sm:grid-cols-2">
            <Select label="Sub-county" required placeholder="Select sub-county" options={SUB_COUNTIES.map((s) => ({ value: s, label: s }))} value={form.subCounty} onChange={update('subCounty')} error={errors.subCounty} />
            <Input label="Location / landmark" required placeholder="e.g. Next to Kenol bus stage" value={form.location} onChange={update('location')} error={errors.location} />
          </div>

          <Textarea label="Describe the problem" required rows={5} placeholder="What is wrong, how long has it been like this, and is anyone at risk?" value={form.description} onChange={update('description')} error={errors.description} />

          <div>
            <p className="mb-1.5 text-sm font-medium text-slate-700">Photo (optional)</p>
            {image ? (
              <div className="relative inline-block">
                <img src={image} alt="Selected upload preview" className="max-h-56 rounded-lg border border-slate-200" />
                <button type="button" onClick={() => setImage(null)} aria-label="Remove photo" className="absolute -right-2 -top-2 flex size-7 items-center justify-center rounded-full bg-slate-800 text-white shadow hover:bg-red-600">
                  <X className="size-4" aria-hidden="true" />
                </button>
              </div>
            ) : (
              <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 px-6 py-8 text-center text-sm text-slate-600 transition hover:border-brand-400 hover:bg-brand-50/50">
                <ImagePlus className="size-8 text-brand-600" aria-hidden="true" />
                <span className="font-medium">Click to add a photo</span>
                <span className="text-xs text-slate-500">JPG or PNG, up to {MAX_IMAGE_MB}MB</span>
                <input type="file" accept="image/*" onChange={handleImage} className="sr-only" />
              </label>
            )}
            {errors.image && <p role="alert" className="mt-1.5 text-sm text-red-600">{errors.image}</p>}
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-6">
            <Link to="/" className={buttonClasses({ variant: 'ghost' })}>Cancel</Link>
            <Button type="submit" loading={submitting}>Submit request</Button>
          </div>
        </form>
      </div>
    </>
  )
}

const MY_FILTERS = [{ value: 'all', label: 'All' }, ...STATUS_FLOW.map((s) => ({ value: s, label: STATUS_META[s].label }))]

function MyRequests() {
  const { user } = useAuth()
  const { requests, loading, error } = useRequests(user.id)
  const [filter, setFilter] = useState('all')

  const visible = filter === 'all' ? requests : requests.filter((r) => r.status === filter)
  const countFor = (v) => (v === 'all' ? requests.length : requests.filter((r) => r.status === v).length)

  return (
    <>
      <PageHeader title="My requests" subtitle={`Signed in as ${user.fullName}`}>
        <Link to="/requests/new" className={buttonClasses({ variant: 'light' })}><Plus className="size-4" aria-hidden="true" />New request</Link>
      </PageHeader>

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-wrap gap-2" role="tablist" aria-label="Filter by status">
          {MY_FILTERS.map((f) => (
            <button key={f.value} type="button" role="tab" aria-selected={filter === f.value} onClick={() => setFilter(f.value)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${filter === f.value ? 'bg-brand-600 text-white' : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100'}`}>
              {f.label} <span className="opacity-75">({countFor(f.value)})</span>
            </button>
          ))}
        </div>

        {loading && <Spinner label="Loading your requests..." />}
        {error && <Alert type="error">{error}</Alert>}

        {!loading && !error && visible.length === 0 && (
          <EmptyState
            icon={FileSearch}
            title={requests.length === 0 ? 'No requests yet' : 'Nothing in this status'}
            message={requests.length === 0 ? 'When you report an issue it will show up here so you can track it.' : 'Try another filter.'}
            action={requests.length === 0 && <Link to="/requests/new" className={buttonClasses()}>Submit your first request</Link>}
          />
        )}

        <ul className="space-y-3">
          {visible.map((r) => <li key={r.id}><RequestCard request={r} /></li>)}
        </ul>
      </div>
    </>
  )
}

function RequestDetail() {
  const { id } = useParams()
  const { user, isAdmin } = useAuth()
  const [state, setState] = useState({ loading: true, request: null })

  useEffect(() => {
    let cancelled = false
    requestService.get(id).then((request) => {
      if (!cancelled) setState({ loading: false, request })
    })
    return () => {
      cancelled = true // ignore the response if the user navigates away first
    }
  }, [id])

  const { loading, request } = state
  const backTo = isAdmin ? '/admin' : '/requests'

  if (loading) return <Spinner label="Loading request..." />

  // Citizens may only open their own requests; admins may open any
  if (!request || !(isAdmin || request.userId === user.id)) {
    return (
      <div className="mx-auto max-w-lg px-4 py-14">
        <EmptyState title="Request not found" message="It may have been removed, or it belongs to another account." action={<Link to={backTo} className={buttonClasses()}>Go back</Link>} />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Link to={backTo} className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:underline">
        <ArrowLeft className="size-4" aria-hidden="true" />Back
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-mono text-sm font-semibold text-slate-500">{request.ref}</p>
              <h1 className="mt-1 text-2xl font-bold text-slate-900">{categoryOf(request.category).label}</h1>
            </div>
            <StatusBadge status={request.status} />
          </div>

          <dl className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
            <div className="flex items-center gap-1.5"><MapPin className="size-4 text-brand-600" aria-hidden="true" /><dt className="sr-only">Location</dt><dd>{request.location}, {request.subCounty}</dd></div>
            <div className="flex items-center gap-1.5"><Calendar className="size-4 text-brand-600" aria-hidden="true" /><dt className="sr-only">Submitted</dt><dd>{formatDateTime(request.createdAt)}</dd></div>
          </dl>

          <h2 className="mt-6 text-sm font-semibold uppercase tracking-wider text-slate-500">Description</h2>
          <p className="mt-2 whitespace-pre-line leading-7 text-slate-800">{request.description}</p>

          {request.image && (
            <>
              <h2 className="mt-6 text-sm font-semibold uppercase tracking-wider text-slate-500">Photo</h2>
              <img src={request.image} alt="Uploaded by the citizen" className="mt-2 max-h-96 rounded-lg border border-slate-200" />
            </>
          )}
        </section>

        <aside className="h-fit rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-lg font-semibold text-slate-900">Progress</h2>
          <RequestTimeline request={request} />
        </aside>
      </div>
    </div>
  )
}

/* ---- Admin dashboard ---------------------------------------------------- */
const FILTER_CONTROL = 'rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20'

function StatCard({ icon: Icon, label, value, tone }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <span className={`flex size-12 items-center justify-center rounded-lg ${tone}`}><Icon className="size-6" aria-hidden="true" /></span>
      <div>
        <p className="text-3xl font-extrabold text-slate-900">{value}</p>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
    </div>
  )
}

/** Open vs resolved as one stacked bar (pure CSS, no chart library). */
function OpenVsResolved({ stats }) {
  const pct = (n) => (stats.total ? (n / stats.total) * 100 : 0)
  const parts = [
    { key: 'pending', label: 'Pending', value: stats.pending, color: 'bg-amber-500' },
    { key: 'progress', label: 'In progress', value: stats.inProgress, color: 'bg-sky-500' },
    { key: 'resolved', label: 'Resolved', value: stats.resolved, color: 'bg-brand-600' },
  ]
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Open vs resolved cases</h2>
      <p className="mt-1 text-sm text-slate-500">
        <strong className="text-slate-800">{stats.open}</strong> open &middot; <strong className="text-slate-800">{stats.resolved}</strong> resolved &middot; <strong className="text-brand-700">{stats.resolutionRate}%</strong> resolution rate
      </p>
      <div className="mt-5 flex h-6 overflow-hidden rounded-full bg-slate-100" role="img" aria-label={`${stats.pending} pending, ${stats.inProgress} in progress, ${stats.resolved} resolved`}>
        {parts.map((p) => <div key={p.key} className={`${p.color} transition-all`} style={{ width: `${pct(p.value)}%` }} />)}
      </div>
      <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
        {parts.map((p) => (
          <li key={p.key} className="flex items-center gap-2"><span className={`size-3 rounded-sm ${p.color}`} aria-hidden="true" />{p.label}: <strong className="text-slate-900">{p.value}</strong></li>
        ))}
      </ul>
    </section>
  )
}

function CategoryBreakdown({ stats }) {
  const max = Math.max(1, ...stats.byCategory.map((c) => c.total))
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Requests by category</h2>
      {stats.byCategory.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">No data yet.</p>
      ) : (
        <ul className="mt-5 space-y-4">
          {stats.byCategory.map((c) => (
            <li key={c.id}>
              <div className="mb-1 flex justify-between text-sm">
                <span className="font-medium text-slate-700">{c.label}</span>
                <span className="text-slate-500">{c.resolved}/{c.total} resolved</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-100" style={{ width: `${(c.total / max) * 100}%` }}>
                <div className="h-full bg-brand-600" style={{ width: `${(c.resolved / c.total) * 100}%` }} />
                <span className="sr-only">{c.total} total</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function Dashboard() {
  const { requests, loading, error, reload } = useRequests()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [updatingId, setUpdatingId] = useState(null)
  const [actionError, setActionError] = useState('')

  const stats = useMemo(() => computeStats(requests), [requests])

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase()
    return requests.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false
      if (categoryFilter !== 'all' && r.category !== categoryFilter) return false
      return !term || [r.ref, r.location, r.subCounty, r.description].some((v) => v.toLowerCase().includes(term))
    })
  }, [requests, search, statusFilter, categoryFilter])

  const handleStatusChange = async (id, status) => {
    setActionError('')
    setUpdatingId(id)
    try {
      await requestService.updateStatus(id, status)
      await reload()
    } catch (err) {
      setActionError(err.message)
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <>
      <PageHeader title="Admin dashboard" subtitle="Review citizen requests, update their status and watch resolution progress." />
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
        {loading && <Spinner label="Loading dashboard..." />}
        {error && <Alert type="error">{error}</Alert>}

        {!loading && !error && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard icon={FileText} label="Total requests" value={stats.total} tone="bg-slate-100 text-slate-700" />
              <StatCard icon={Clock} label="Pending" value={stats.pending} tone="bg-amber-50 text-amber-700" />
              <StatCard icon={Loader} label="In progress" value={stats.inProgress} tone="bg-sky-50 text-sky-700" />
              <StatCard icon={CheckCircle2} label="Resolved" value={stats.resolved} tone="bg-brand-50 text-brand-700" />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <OpenVsResolved stats={stats} />
              <CategoryBreakdown stats={stats} />
            </div>

            <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-lg font-semibold text-slate-900">All requests</h2>
                <div className="flex flex-wrap gap-2">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                    <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search reference or place" aria-label="Search requests" className={`${FILTER_CONTROL} pl-9`} />
                  </div>
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter by status" className={FILTER_CONTROL}>
                    <option value="all">All statuses</option>
                    {STATUS_FLOW.map((s) => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
                  </select>
                  <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} aria-label="Filter by category" className={FILTER_CONTROL}>
                    <option value="all">All categories</option>
                    {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </div>
              </div>

              {actionError && <div className="p-4"><Alert type="error">{actionError}</Alert></div>}

              {visible.length === 0 ? (
                <div className="p-6"><EmptyState title="No matching requests" message="Try clearing the search or filters." /></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-175 text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                      <tr>
                        {['Reference', 'Category', 'Location', 'Submitted', 'Status', 'Update'].map((h) => <th key={h} scope="col" className="px-4 py-3 font-semibold">{h}</th>)}
                        <th scope="col" className="px-4 py-3"><span className="sr-only">View</span></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {visible.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50/70">
                          <td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-semibold text-slate-700">{r.ref}</td>
                          <td className="px-4 py-3 text-slate-800">{categoryOf(r.category).label}</td>
                          <td className="px-4 py-3 text-slate-600">{r.location}<span className="block text-xs text-slate-400">{r.subCounty}</span></td>
                          <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(r.createdAt)}</td>
                          <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                          <td className="px-4 py-3">
                            <select value={r.status} disabled={updatingId === r.id} onChange={(e) => handleStatusChange(r.id, e.target.value)} aria-label={`Change status of ${r.ref}`} className={`${FILTER_CONTROL} py-1.5 disabled:opacity-60`}>
                              {STATUS_FLOW.map((s) => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
                            </select>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Link to={`/requests/${r.id}`} aria-label={`View ${r.ref}`} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-brand-700 hover:bg-brand-50">
                              <Eye className="size-4" aria-hidden="true" />View
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </>
  )
}

function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <p className="text-6xl font-extrabold text-brand-600">404</p>
      <h1 className="mt-4 text-2xl font-bold text-slate-900">Page not found</h1>
      <p className="mt-2 text-slate-600">The page you are looking for does not exist or has moved.</p>
      <Link to="/" className={`${buttonClasses()} mt-8`}>Back to home</Link>
    </div>
  )
}

/* ==========================================================================
 * 10. APP + ROUTES
 *     Public: /, /login, /register   Signed in: /requests, /requests/new, /requests/:id
 *     Admin only: /admin
 * ======================================================================== */
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/requests" element={<MyRequests />} />
              <Route path="/requests/new" element={<NewRequest />} />
              <Route path="/requests/:id" element={<RequestDetail />} />
            </Route>

            <Route element={<ProtectedRoute adminOnly />}>
              <Route path="/admin" element={<Dashboard />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}