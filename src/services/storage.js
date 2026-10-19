/**
 * Photo helpers for Supabase Storage. Buckets are private: photos are shown
 * through short-lived signed links, never public URLs.
 */
import { toError } from '../lib/errors'

const SIGNED_URL_SECONDS = 60 * 60

/**
 * Uploads a photo given as a data URL (the form shrinks photos in the browser first).
 * `client` is the Supabase client to use, `folder` is '' or e.g. the citizen's user id.
 * Returns the stored path.
 */
export async function uploadDataUrl(client, bucket, folder, dataUrl) {
  const blob = await (await fetch(dataUrl)).blob()
  const extension = blob.type === 'image/png' ? 'png' : 'jpg'
  const path = `${folder ? `${folder}/` : ''}${crypto.randomUUID()}.${extension}`
  const { error } = await client.storage.from(bucket).upload(path, blob, { contentType: blob.type || 'image/jpeg' })
  if (error) throw toError(error, 'Could not upload the photo.')
  return path
}

/** Returns { storagePath: signedUrl } for every path. A failed link just means no photo is shown. */
export async function signedUrls(client, bucket, paths) {
  const unique = [...new Set(paths.filter(Boolean))]
  if (unique.length === 0) return {}
  const { data, error } = await client.storage.from(bucket).createSignedUrls(unique, SIGNED_URL_SECONDS)
  if (error || !data) return {}
  return Object.fromEntries(data.filter((item) => item.signedUrl).map((item) => [item.path, item.signedUrl]))
}