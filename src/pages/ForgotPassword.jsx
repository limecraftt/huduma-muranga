import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { KeyRound, Mail, Save, Send } from 'lucide-react'
import { Alert, Button, Field } from '../components/ui'
import PasswordInput from '../components/PasswordInput'
import { useAuth } from '../context/auth'
import { authService } from '../services/authService'
import { isValidEmail } from '../lib/helpers'

const TITLES = {
  email: 'Forgot Password',
  code: 'Enter Your Code',
  password: 'Choose a New Password',
}

/** Password reset in three steps on one page: email -> 6-digit code -> new password. */
export default function ForgotPassword() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState('email') // email | code | password
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [form, setForm] = useState({ password: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [info, setInfo] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const setField = (name) => (e) => setForm((f) => ({ ...f, [name]: e.target.value }))

  /** Runs an async step with shared loading / error handling. */
  const run = async (action) => {
    setSubmitting(true)
    setFormError('')
    setInfo('')
    try {
      await action()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const sendCode = (e) => {
    e?.preventDefault()
    if (!isValidEmail(email)) return setErrors({ email: 'Enter a valid email address.' })
    setErrors({})
    return run(async () => {
      await authService.requestPasswordReset(email.trim())
      setStep('code')
      setInfo(`If an account exists for ${email.trim()}, we have sent a 6-digit code. Check your inbox and spam folder.`)
    })
  }

  const verifyCode = (e) => {
    e.preventDefault()
    if (!/^\d{6}$/.test(code)) return setErrors({ code: 'Enter the 6-digit code from your email.' })
    setErrors({})
    return run(async () => {
      await authService.verifyResetCode(email.trim(), code)
      setStep('password')
    })
  }

  const savePassword = (e) => {
    e.preventDefault()
    const found = {}
    if (form.password.length < 8) found.password = 'Use at least 8 characters.'
    if (form.confirm !== form.password) found.confirm = 'The passwords do not match.'
    setErrors(found)
    if (Object.keys(found).length) return

    return run(async () => {
      await authService.updatePassword(form.password)
      await logout() // end the temporary reset session, then log in normally
      navigate('/login', { replace: true, state: { notice: 'Password updated. Please log in with your new password.' } })
    })
  }

  return (
    <div className="mx-auto flex max-w-7xl justify-center px-4 py-12 sm:px-6 sm:py-16">
      <div className="w-full max-w-md overflow-hidden rounded-xl border border-slate-200 bg-white shadow-md">
        <div className="bg-brand-600 px-6 py-4 text-center">
          <h1 className="text-lg font-bold uppercase tracking-wide text-white">{TITLES[step]}</h1>
        </div>

        <div className="space-y-5 p-6 sm:p-8">
          <img src="/logo.png" alt="" className="mx-auto h-20 w-auto" />
          {formError && <Alert>{formError}</Alert>}
          {info && !formError && <Alert type="success">{info}</Alert>}

          {step === 'email' && (
            <form onSubmit={sendCode} noValidate className="space-y-5">
              <p className="text-sm text-slate-600">Enter the email you registered with and we will send you a 6-digit code.</p>
              <Field id="email" label="Email address" required error={errors.email}>
                {(cls) => (
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                    <input id="email" type="email" autoComplete="email" className={`${cls} pl-9`} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
                  </div>
                )}
              </Field>
              <Button type="submit" size="lg" className="w-full" loading={submitting}>
                <Send className="h-4 w-4" aria-hidden="true" /> Send code
              </Button>
            </form>
          )}

          {step === 'code' && (
            <form onSubmit={verifyCode} noValidate className="space-y-5">
              <Field id="code" label="6-digit code" required error={errors.code}>
                {(cls) => (
                  <div className="relative">
                    <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                    <input
                      id="code"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      className={`${cls} pl-9 text-lg tracking-[0.5em]`}
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="······"
                    />
                  </div>
                )}
              </Field>
              <Button type="submit" size="lg" className="w-full" loading={submitting}>
                <KeyRound className="h-4 w-4" aria-hidden="true" /> Verify code
              </Button>
              <div className="flex items-center justify-between text-sm">
                <button type="button" onClick={() => sendCode()} disabled={submitting} className="font-medium text-brand-700 hover:underline disabled:opacity-50">Resend code</button>
                <button type="button" onClick={() => { setStep('email'); setCode(''); setInfo(''); setFormError('') }} className="font-medium text-slate-600 hover:underline">Change email</button>
              </div>
            </form>
          )}

          {step === 'password' && (
            <form onSubmit={savePassword} noValidate className="space-y-5">
              <Field id="password" label="New password" required error={errors.password} hint="At least 8 characters">
                {(cls) => <PasswordInput id="password" autoComplete="new-password" className={cls} value={form.password} onChange={setField('password')} />}
              </Field>
              <Field id="confirm" label="Confirm new password" required error={errors.confirm}>
                {(cls) => <PasswordInput id="confirm" autoComplete="new-password" className={cls} value={form.confirm} onChange={setField('confirm')} />}
              </Field>
              <Button type="submit" size="lg" className="w-full" loading={submitting}>
                <Save className="h-4 w-4" aria-hidden="true" /> Update password
              </Button>
            </form>
          )}

          <p className="text-center text-sm text-slate-600">
            Remembered it? <Link to="/login" className="font-semibold text-brand-700 hover:underline">Login</Link>
          </p>
        </div>
      </div>
    </div>
  )
}