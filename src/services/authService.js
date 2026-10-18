/**
 * Authentication with Supabase Auth.
 * Passwords are handled and hashed by Supabase: we never store them.
 * A row in `profiles` (created by a database trigger on sign-up) holds the
 * full name, ward and the role ('citizen' or 'admin').
 */
import { supabase } from '../lib/supabase'
import { nameFromEmail } from '../lib/helpers'

/** Turns Supabase's technical errors into messages a citizen understands. */
function friendlyMessage(error) {
  const text = (error?.message ?? '').toLowerCase()
  if (text.includes('already registered') || text.includes('already been registered')) return 'An account with that email already exists.'
  if (text.includes('invalid login credentials')) return 'Incorrect email or password.'
  if (text.includes('different from the old')) return 'Your new password must be different from your old one.'
  if (text.includes('session missing')) return 'Your reset session has expired. Please request a new code.'
  if (text.includes('token') || text.includes('otp') || text.includes('expired')) return 'That code is incorrect or has expired. Request a new one and try again.'
  if (text.includes('email not confirmed')) return 'Please confirm your email first, then log in.'
  if (text.includes('rate limit') || text.includes('too many')) return 'Too many attempts. Please wait a minute and try again.'
  if (text.includes('password') && text.includes('characters')) return 'Your password is too short.'
  if (text.includes('fetch') || text.includes('network')) return 'Could not reach the server. Check your internet connection.'
  return error?.message || 'Something went wrong. Please try again.'
}

/** Reads the profile row and merges it with the auth user into one object for the UI. */
async function loadUser(authUser) {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('full_name, ward, role')
    .eq('id', authUser.id)
    .single()
  if (error) throw new Error('Your account profile could not be loaded. Please try again.')

  return {
    id: authUser.id,
    email: authUser.email,
    fullName: profile.full_name || nameFromEmail(authUser.email),
    ward: profile.ward,
    role: profile.role,
  }
}

export const authService = {
  /** The logged-in user from the saved session, or null. */
  async getCurrentUser() {
    const { data } = await supabase.auth.getSession()
    return data.session ? loadUser(data.session.user) : null
  },

  /** Calls `callback` when the session ends (logout, expiry, or logout in another tab). */
  onSignedOut(callback) {
    // Keep this callback synchronous: awaiting Supabase calls inside it can deadlock.
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') callback()
    })
    return () => data.subscription.unsubscribe()
  },

  /** New sign-ups are always citizens. Admins are promoted in the database. */
  async register({ fullName, email, ward, password }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { ward, full_name: fullName } },
    })
    if (error) throw new Error(friendlyMessage(error))
    // With "Confirm email" switched on in Supabase there is no session yet
    if (!data.session) throw new Error('Account created. Check your email to confirm it, then log in.')
    return loadUser(data.user)
  },

  async login({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(friendlyMessage(error))
    return loadUser(data.user)
  },

  async logout() {
    await supabase.auth.signOut()
  },

  /** Emails a 6-digit code. Supabase gives the same answer whether or not the email exists. */
  async requestPasswordReset(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    if (error) throw new Error(friendlyMessage(error))
  },

  /** Checks the emailed code. If it is right, Supabase signs the person in temporarily so they can set a password. */
  async verifyResetCode(email, token) {
    const { error } = await supabase.auth.verifyOtp({ email, token, type: 'recovery' })
    if (error) throw new Error(friendlyMessage(error))
  },

  /** Works only while the person holds the temporary session from a verified code (or is logged in). */
  async updatePassword(password) {
    const { error } = await supabase.auth.updateUser({ password })
    if (error) throw new Error(friendlyMessage(error))
  },
}