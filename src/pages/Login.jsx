import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { LogIn, Mail } from 'lucide-react'
import { Alert, Button, Field, Spinner } from '../components/ui'
import PasswordInput from '../components/PasswordInput'
import { useAuth } from '../context/auth'
import { isValidEmail } from '../lib/helpers'

/** Login page: centred card with a green title bar (same layout idea as the county portal). */
export default function Login() {
  const { user, isAdmin, loading, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Already logged in? Skip the form. (`!submitting` lets our own navigate() win.)
  if (loading) return <Spinner />
  if (user && !submitting) return <Navigate to={isAdmin ? '/admin' : '/dashboard'} replace />

  const set = (name) => (e) => setForm((f) => ({ ...f, [name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    const found = {}
    if (!isValidEmail(form.email)) found.email = 'Enter a valid email address.'
    if (!form.password) found.password = 'Enter your password.'
    setErrors(found)
    if (Object.keys(found).length) return

    setSubmitting(true)
    setFormError('')
    try {
      const loggedIn = await login(form)
      const fallback = loggedIn.role === 'admin' ? '/admin' : '/dashboard'
      const from = location.state?.from
      // Only honour `from` if this user is allowed to see it
      const allowed = from && (loggedIn.role === 'admin' ? from.startsWith('/admin') : !from.startsWith('/admin'))
      navigate(allowed ? from : fallback, { replace: true })
    } catch (err) {
      setFormError(err.message)
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-7xl justify-center px-4 py-12 sm:px-6 sm:py-16">
      <div className="w-full max-w-md">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-md">
          <div className="bg-brand-600 px-6 py-4 text-center">
            <h1 className="text-lg font-bold uppercase tracking-wide text-white">Citizen Login</h1>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-5 p-6 sm:p-8">
            <img src="/logo.png" alt="" className="mx-auto h-20 w-auto" />
            {location.state?.notice && !formError && <Alert type="success">{location.state.notice}</Alert>}
            {formError && <Alert>{formError}</Alert>}

            <Field id="email" label="Email address" required error={errors.email}>
              {(cls) => (
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                  <input id="email" type="email" autoComplete="email" className={`${cls} pl-9`} value={form.email} onChange={set('email')} placeholder="you@example.com" />
                </div>
              )}
            </Field>

            <Field id="password" label="Password" required error={errors.password}>
              {(cls) => <PasswordInput id="password" autoComplete="current-password" className={cls} value={form.password} onChange={set('password')} placeholder="Your password" />}
            </Field>

            <div className="-mt-2 text-right">
              <Link to="/forgot-password" className="text-sm font-medium text-brand-700 hover:underline">Forgot password?</Link>
            </div>

            <Button type="submit" size="lg" className="w-full" loading={submitting}>
              <LogIn className="h-4 w-4" aria-hidden="true" /> Login
            </Button>

            <p className="text-center text-sm text-slate-600">
              Don&apos;t have an account?{' '}
              <Link to="/signup" className="font-semibold text-brand-700 hover:underline">Sign up</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}