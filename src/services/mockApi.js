/**
 * MOCK backend on localStorage, used for requests and anonymous tips only.
 * (Authentication already uses Supabase: see authService.js.)
 *
 * Pages never touch storage directly: they only call the functions below.
 * These are replaced with Supabase calls in the next steps.
 */
import { CATEGORIES, STATUS } from '../data/constants'

const REQUESTS_KEY = 'huduma.requests.v2'
const TIPS_KEY = 'huduma.tips.v2'

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

/** Loads a collection (empty until something is submitted). */
const load = (key) => readJson(key, [])

const newestFirst = (a, b) => new Date(b.createdAt) - new Date(a.createdAt)

/* ---------- Service requests ---------- */

export const requestService = {
  async list() {
    await delay(200)
    return [...load(REQUESTS_KEY)].sort(newestFirst)
  },

  async listForUser(userId) {
    await delay(200)
    return load(REQUESTS_KEY).filter((r) => r.userId === userId).sort(newestFirst)
  },

  async create({ userId, category, subCounty, location, description, image }) {
    await delay(400)
    const requests = load(REQUESTS_KEY)
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
    const next = load(REQUESTS_KEY).map((r) => {
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

/* ---------- Anonymous crime tips ---------- */

// No 0/O/1/I so codes are easy to read out or write down
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function makeTipCode() {
  const chars = [...crypto.getRandomValues(new Uint8Array(8))].map((b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('')
  return `TIP-${chars.slice(0, 4)}-${chars.slice(4)}`
}

/**
 * Tips are deliberately anonymous: no userId, no email, no session lookup.
 * The reporter only gets a random tracking code.
 */
export const tipService = {
  async create({ crimeType, subCounty, location, description, image }) {
    await delay(400)
    const tips = load(TIPS_KEY)
    const now = new Date().toISOString()
    const tip = {
      id: crypto.randomUUID(),
      code: makeTipCode(),
      crimeType, subCounty, location, description,
      image: image ?? null,
      status: STATUS.PENDING,
      createdAt: now,
      updatedAt: now,
      history: [{ status: STATUS.PENDING, at: now, note: 'Tip received' }],
    }
    writeJson(TIPS_KEY, [...tips, tip])
    return { code: tip.code }
  },

  /** Public lookup by code. Returns only status info, never the details. */
  async track(code) {
    await delay(300)
    const tip = load(TIPS_KEY).find((t) => t.code === code.trim().toUpperCase())
    if (!tip) throw new Error('No report found with that code. Check it and try again.')
    return { code: tip.code, status: tip.status, createdAt: tip.createdAt, updatedAt: tip.updatedAt, history: tip.history }
  },

  /** Admin: every tip, newest first. */
  async list() {
    await delay(200)
    return [...load(TIPS_KEY)].sort(newestFirst)
  },

  async updateStatus(id, status, note = '') {
    await delay(250)
    const now = new Date().toISOString()
    let updated = null
    const next = load(TIPS_KEY).map((t) => {
      if (t.id !== id) return t
      updated = { ...t, status, updatedAt: now, history: [...t.history, { status, at: now, note: note || 'Status updated by administrator' }] }
      return updated
    })
    if (!updated) throw new Error('Tip not found.')
    writeJson(TIPS_KEY, next)
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