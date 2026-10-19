/**
 * Service requests, stored in Supabase.
 * Pages call these functions only; row-level security in the database decides
 * who may see what (citizens: their own requests, admins: all of them).
 */
import { supabase } from '../lib/supabase'
import { toError } from '../lib/errors'
import { signedUrls, uploadDataUrl } from './storage'

const BUCKET = 'request-images'
const SELECT = '*, request_history(id, status, note, created_at)'
const newestFirst = { ascending: false }

/** Database row (snake_case) -> the object the pages use (camelCase). */
function toRequest(row, imageUrls = {}) {
  return {
    id: row.id,
    ref: row.ref,
    userId: row.user_id,
    category: row.category,
    subCounty: row.sub_county,
    location: row.location,
    description: row.description,
    image: row.image_path ? imageUrls[row.image_path] ?? null : null,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    history: (row.request_history ?? [])
      .sort((a, b) => a.id - b.id)
      .map((h) => ({ status: h.status, at: h.created_at, note: h.note })),
  }
}

/** Runs a select query and converts the rows, attaching signed photo links. */
async function fetchRequests(query) {
  const { data, error } = await query
  if (error) throw toError(error, 'Could not load requests.')
  const urls = await signedUrls(supabase, BUCKET, data.map((row) => row.image_path))
  return data.map((row) => toRequest(row, urls))
}

export const requestService = {
  /** Every request the current user may see: all of them for an admin. */
  list() {
    return fetchRequests(supabase.from('requests').select(SELECT).order('created_at', newestFirst))
  },

  listForUser(userId) {
    return fetchRequests(supabase.from('requests').select(SELECT).eq('user_id', userId).order('created_at', newestFirst))
  },

  /** `image` is an optional data URL. The reference number and first history entry are created by the database. */
  async create({ userId, category, subCounty, location, description, image }) {
    const imagePath = image ? await uploadDataUrl(supabase, BUCKET, userId, image) : null
    const { data, error } = await supabase
      .from('requests')
      .insert({
        category,
        sub_county: subCounty,
        location: location.trim(),
        description: description.trim(),
        image_path: imagePath,
      })
      .select(SELECT)
      .single()
    if (error) throw toError(error, 'Could not submit your request.')
    return toRequest(data)
  },

  /** Admin action: pending -> in progress -> resolved. The database function checks the caller is an admin. */
  async updateStatus(id, status, note = '') {
    const { error } = await supabase.rpc('update_request_status', { p_id: id, p_status: status, p_note: note })
    if (error) throw toError(error, 'Could not update the request.')
    const [updated] = await fetchRequests(supabase.from('requests').select(SELECT).eq('id', id))
    return updated
  },
}