/**
 * Anonymous crime tips, stored in Supabase.
 *
 * Tips are deliberately anonymous: the table has no user column, and every
 * call a reporter makes goes through `supabaseAnon`, a client with no session,
 * so a tip can never be linked to an account. The reporter only gets a random
 * tracking code. Only admins can read tips, and only admins can change their status.
 */
import { supabase, supabaseAnon } from '../lib/supabase'
import { toError } from '../lib/errors'
import { signedUrls, uploadDataUrl } from './storage'

const BUCKET = 'tip-images'
const SELECT = '*, tip_history(id, status, note, created_at)'

function toTip(row, imageUrls = {}) {
  return {
    id: row.id,
    code: row.code,
    crimeType: row.crime_type,
    subCounty: row.sub_county,
    location: row.location,
    description: row.description,
    image: row.image_path ? imageUrls[row.image_path] ?? null : null,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    history: (row.tip_history ?? [])
      .sort((a, b) => a.id - b.id)
      .map((h) => ({ status: h.status, at: h.created_at, note: h.note })),
  }
}

async function fetchTips(query) {
  const { data, error } = await query
  if (error) throw toError(error, 'Could not load tips.')
  const urls = await signedUrls(supabase, BUCKET, data.map((row) => row.image_path))
  return data.map((row) => toTip(row, urls))
}

export const tipService = {
  /** Open to everyone, logged in or not. Returns only the tracking code. */
  async create({ crimeType, subCounty, location, description, image }) {
    const imagePath = image ? await uploadDataUrl(supabaseAnon, BUCKET, '', image) : null
    const { data, error } = await supabaseAnon.rpc('submit_tip', {
      p_crime_type: crimeType,
      p_sub_county: subCounty,
      p_location: location.trim(),
      p_description: description.trim(),
      p_image_path: imagePath,
    })
    if (error) throw toError(error, 'Could not send your report.')
    return { code: data }
  },

  /** Public lookup by code. Returns only status info, never the details. */
  async track(code) {
    const { data, error } = await supabaseAnon.rpc('track_tip', { p_code: code })
    if (error) throw toError(error, 'Could not look up that code.')
    if (!data) throw new Error('No report found with that code. Check it and try again.')
    return { code: data.code, status: data.status, createdAt: data.created_at, updatedAt: data.updated_at, history: data.history }
  },

  /** Admin: every tip, newest first. */
  list() {
    return fetchTips(supabase.from('tips').select(SELECT).order('created_at', { ascending: false }))
  },

  async updateStatus(id, status, note = '') {
    const { error } = await supabase.rpc('update_tip_status', { p_id: id, p_status: status, p_note: note })
    if (error) throw toError(error, 'Could not update the tip.')
    const [updated] = await fetchTips(supabase.from('tips').select(SELECT).eq('id', id))
    return updated
  },
}