import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Lock, Mail, MapPin, UserPlus } from 'lucide-react'
import { Alert, Button, Field } from '../components/ui'
import { useAuth } from '../context/auth'
import { isValidEmail } from '../lib/helpers'

const WARD_SUGGESTIONS = ['Township', 'Kenol', 'Kiharu', 'Ichagaki', 'Mugoiri', 'Kangema', 'Kimorori', 'Gaichanjiru', 'Kandara', 'Ruchu']

/** Sign-up asks only for email, ward and password. */
export default function SignUp() {
  const { user, isAdmin, register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', ward: '', password: '' })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (user && !submitting) return <Navigate to={isAdmin ? '/admin' : '/dashboard'} replace />

  const set = (name) => (e) => setForm((f) => ({ ...f, [name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    const found = {}
    if (!isValidEmail(form.email)) found.email = 'Enter a valid email address.'
    if (form.ward.trim().length < 2) found.ward = 'Enter your ward.'
    if (form.password.length < 8) found.password = 'Use at least 8 characters.'
    setErrors(found)
    if (Object.keys(found).length) return

    setSubmitting(true)
    setFormError('')
    try {
      await register({ email: form.email.trim(), ward: form.ward.trim(), password: form.password })
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setFormError(err.message)
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-7xl justify-center px-4 py-12 sm:px-6 sm:py-16">
      <div className="w-full max-w-md overflow-hidden rounded-xl border border-slate-200 bg-white shadow-md">
        <div className="bg-brand-600 px-6 py-4 text-center">
          <h1 className="text-lg font-bold uppercase tracking-wide text-white">Create Citizen Account</h1>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-5 p-6 sm:p-8">
          <img src="/logo.png" alt="" className="mx-auto h-20 w-auto" />
          {formError && <Alert>{formError}</Alert>}

          <Field id="email" label="Email address" required error={errors.email}>
            {(cls) => (
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                <input id="email" type="email" autoComplete="email" className={`${cls} pl-9`} value={form.email} onChange={set('email')} placeholder="you@example.com" />
              </div>
            )}
          </Field>

          <Field id="ward" label="Ward" required error={errors.ward} hint="The ward where you live in Murang'a County">
            {(cls) => (
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                <input id="ward" list="ward-options" autoComplete="off" className={`${cls} pl-9`} value={form.ward} onChange={set('ward')} placeholder="e.g. Township" />
                <datalist id="ward-options">
                  {WARD_SUGGESTIONS.map((w) => <option key={w} value={w} />)}
                </datalist>
              </div>
            )}
          </Field>

          <Field id="password" label="Password" required error={errors.password} hint="At least 8 characters">
            {(cls) => (
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                <input id="password" type="password" autoComplete="new-password" className={`${cls} pl-9`} value={form.password} onChange={set('password')} placeholder="Create a password" />
              </div>
            )}
          </Field>

          <Button type="submit" size="lg" className="w-full" loading={submitting}>
            <UserPlus className="h-4 w-4" aria-hidden="true" /> Create account
          </Button>

          <p className="text-center text-sm text-slate-600">
            Already registered?{' '}
            <Link to="/login" className="font-semibold text-brand-700 hover:underline">Login</Link>
          </p>
        </form>
      </div>
    </div>
  )
}