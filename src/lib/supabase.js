import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  throw new Error(
    'Missing Supabase settings. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local, then restart `npm run dev`.',
  )
}

/** The main Supabase client: keeps the logged-in user's session. */
export const supabase = createClient(url, anonKey)

/**
 * A second client that NEVER holds a session. Anonymous crime tips go through it,
 * so nothing about a tip (database call or photo upload) can be linked to a
 * logged-in account, even if the reporter happens to be signed in.
 */
export const supabaseAnon = createClient(url, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, storageKey: 'huduma-anonymous' },
})