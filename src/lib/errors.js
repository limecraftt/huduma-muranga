/** Turns a Supabase / network error into a message a citizen can understand. */
export function toError(error, fallback = 'Something went wrong. Please try again.') {
  const text = (error?.message ?? '').toLowerCase()
  if (text.includes('failed to fetch') || text.includes('network')) return new Error('Could not reach the server. Check your internet connection.')
  if (text.includes('row-level security') || text.includes('permission denied')) return new Error('You are not allowed to do that.')
  if (text.includes('jwt') || text.includes('not authenticated')) return new Error('Your session has expired. Please log in again.')
  if (text.includes('check constraint')) return new Error('Please check the details you entered and try again.')
  if (text.includes('payload too large') || text.includes('exceeded the maximum')) return new Error('That photo is too large. Try a smaller one.')
  return new Error(error?.message || fallback)
}