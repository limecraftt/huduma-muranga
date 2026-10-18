/**
 * MOCK backend on localStorage.
 *
 * Pages never touch localStorage directly: they only call the functions below.
 * To move to Supabase, keep these function names and swap the bodies:
 *
 *   authService.register  -> supabase.auth.signUp({ email, password, options: { data: { ward } } })
 *   authService.login     -> supabase.auth.signInWithPassword({ email, password })
 *   authService.logout    -> supabase.auth.signOut()
 *   requestService.list   -> supabase.from('requests').select('*').order('created_at', { ascending: false })
 *   requestService.create -> upload the photo to Storage, then .insert({...})
 *   requestService.updateStatus -> .update({ status }).eq('id', id)  (admin only, enforced by RLS)
 */
import { CATEGORIES, ROLES, STATUS } from '../data/constants'
import { SEED_REQUESTS, SEED_USERS } from '../data/seed'
import { nameFromEmail } from '../lib/helpers'

const USERS_KEY = 'huduma.users'
const SESSION_KEY = 'huduma.session'
const REQUESTS_KEY = 'huduma.requests'

/** Simulates network latency so loading states are visible. */
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

/** Loads a collection, creating it from seed data on first run. */
function loadOrSeed(key, seed) {
  const existing = readJson(key, null)
  if (existing) return existing
  writeJson(key, seed)
  return seed
}

// Never hand the password to the UI
// eslint-disable-next-line no-unused-vars
const toPublicUser = ({ password, ...safe }) => safe

const newestFirst = (a, b) => new Date(b.createdAt) - new Date(a.createdAt)

/* ---------- Authentication ---------- */

export const authService = {
  getSession() {
    const id = readJson(SESSION_KEY, null)
    const user = id ? loadOrSeed(USERS_KEY, SEED_USERS).find((u) => u.id === id) : null
    return user ? toPublicUser(user) : null
  },

  /** New sign-ups are always citizens. */
  async register({ email, ward, password }) {
    await delay()
    const users = loadOrSeed(USERS_KEY, SEED_USERS)
    if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('An account with that email already exists.')
    }
    const user = { id: crypto.randomUUID(), fullName: nameFromEmail(email), email, ward, password, role: ROLES.CITIZEN }
    writeJson(USERS_KEY, [...users, user])
    writeJson(SESSION_KEY, user.id)
    return toPublicUser(user)
  },

  async login({ email, password }) {
    await delay()
    const user = loadOrSeed(USERS_KEY, SEED_USERS).find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password,
    )
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

/* ---------- Service requests ---------- */

export const requestService = {
  async list() {
    await delay(200)
    return [...loadOrSeed(REQUESTS_KEY, SEED_REQUESTS)].sort(newestFirst)
  },

  async listForUser(userId) {
    await delay(200)
    return loadOrSeed(REQUESTS_KEY, SEED_REQUESTS).filter((r) => r.userId === userId).sort(newestFirst)
  },

  async create({ userId, category, subCounty, location, description, image }) {
    await delay(400)
    const requests = loadOrSeed(REQUESTS_KEY, SEED_REQUESTS)
    const now = new Date().toISOString()
    const request = {
      id: crypto.randomUUID(),
      // Reference numbers like HM-2026-0007 let citizens quote their request
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

  /** Admin action: move a request along pending -> in progress -> resolved. */
  async updateStatus(id, status, note = '') {
    await delay(250)
    const now = new Date().toISOString()
    let updated = null
    const next = loadOrSeed(REQUESTS_KEY, SEED_REQUESTS).map((r) => {
      if (r.id !== id) return r
      updated = {
        ...r,
        status,
        updatedAt: now,
        history: [...r.history, { status, at: now, note: note || 'Status updated by administrator' }],
      }
      return updated
    })
    if (!updated) throw new Error('Request not found.')
    writeJson(REQUESTS_KEY, next)
    return updated
  },
}

/* ---------- Analytics ---------- */

/** Numbers for the dashboards (pure function, easy to test). */
export function computeStats(requests) {
  const count = (status) => requests.filter((r) => r.status === status).length
  const pending = count(STATUS.PENDING)
  const inProgress = count(STATUS.IN_PROGRESS)
  const resolved = count(STATUS.RESOLVED)
  const total = requests.length

  return {
    total,
    pending,
    inProgress,
    resolved,
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