import { useState } from 'react'
import { Check, Copy, EyeOff, ImagePlus, Search, Send, ShieldAlert, Trash2 } from 'lucide-react'
import { Alert, Button, Field, StatusBadge } from '../components/ui'
import { CRIME_TYPES, EMERGENCY_NUMBERS, STATUS_META, SUB_COUNTIES } from '../data/constants'
import { fieldClass, fileToResizedDataUrl, formatDateTime } from '../lib/helpers'
import { tipService } from '../services/tipService'

const EMPTY = { crimeType: '', subCounty: '', location: '', description: '' }

function validate(v) {
  const errors = {}
  if (!v.crimeType) errors.crimeType = 'Choose the type of crime.'
  if (!v.subCounty) errors.subCounty = 'Choose a sub-county.'
  if (v.location.trim().length < 3) errors.location = 'Say where it happened or is happening.'
  if (v.description.trim().length < 20) errors.description = 'Please give at least 20 characters of detail.'
  return errors
}

/** Shown after submitting: the tracking code is the reporter's only receipt. */
function SuccessCard({ code, onAnother }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
    } catch {
      /* clipboard blocked: the code is visible, they can write it down */
    }
  }

  return (
    <div className="space-y-5 text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-600"><Check className="h-7 w-7" aria-hidden="true" /></span>
      <h2 className="text-xl font-bold text-slate-900">Thank you. Your tip was sent.</h2>
      <p className="text-sm text-slate-600">Save this code. It is the <strong>only way</strong> to check on your report, and we cannot recover it for you.</p>
      <div className="mx-auto flex max-w-xs items-center justify-between gap-3 rounded-lg border-2 border-dashed border-brand-600 bg-brand-50 px-4 py-3">
        <span className="font-mono text-lg font-bold tracking-wider text-brand-800" data-testid="tip-code">{code}</span>
        <button onClick={copy} className="rounded-md p-1.5 text-brand-700 hover:bg-brand-100" aria-label="Copy code"><Copy className="h-4 w-4" /></button>
      </div>
      {copied && <p className="text-xs font-medium text-brand-700">Copied</p>}
      <Button variant="outline" onClick={onAnother}>Submit another report</Button>
    </div>
  )
}

/** Public tracker: enter a code, see the status. No account needed. */
function TrackTip() {
  const [code, setCode] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!code.trim()) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      setResult(await tipService.track(code))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="flex items-center gap-2 font-bold text-slate-900"><Search className="h-4 w-4 text-brand-600" aria-hidden="true" /> Check a report</h2>
      <p className="mt-1 text-sm text-slate-600">Enter the code you were given. We show the status only, never the details.</p>
      <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
        <input aria-label="Tracking code" className={`${fieldClass()} font-mono uppercase`} value={code} onChange={(e) => setCode(e.target.value)} placeholder="TIP-XXXX-XXXX" />
        <Button type="submit" loading={loading}>Check</Button>
      </form>
      {error && <div className="mt-3"><Alert>{error}</Alert></div>}
      {result && (
        <div className="mt-4 space-y-3" aria-live="polite">
          <div className="flex items-center justify-between"><span className="font-mono text-sm font-semibold">{result.code}</span><StatusBadge status={result.status} /></div>
          <ul className="space-y-2 border-l-2 border-brand-100 pl-4 text-sm">
            {[...result.history].reverse().map((h, i) => (
              <li key={i}><span className="font-medium text-slate-800">{STATUS_META[h.status].label}</span> <span className="text-slate-500">· {formatDateTime(h.at)}</span><p className="text-slate-600">{h.note}</p></li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}

export default function ReportCrime() {
  const [values, setValues] = useState(EMPTY)
  const [image, setImage] = useState(null)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [code, setCode] = useState('')

  const set = (name) => (e) => setValues((v) => ({ ...v, [name]: e.target.value }))

  const handleImage = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      // Re-drawing on a canvas also strips hidden photo data (GPS, camera model)
      setImage(await fileToResizedDataUrl(file))
      setFormError('')
    } catch (err) {
      setFormError(err.message)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const found = validate(values)
    setErrors(found)
    if (Object.keys(found).length) return

    setSubmitting(true)
    setFormError('')
    try {
      const result = await tipService.create({ ...values, image })
      setCode(result.code)
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const reset = () => {
    setValues(EMPTY)
    setImage(null)
    setErrors({})
    setCode('')
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="max-w-3xl">
        <h1 className="text-3xl font-extrabold text-slate-900">Report a crime anonymously</h1>
        <p className="mt-2 text-slate-600">No account, no name, no phone number. Tell us what you know and the county will pass it on to the right authority.</p>
      </div>

      <div className="mt-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <p><strong>In danger or a crime in progress?</strong> Do not use this form. Call <strong>{EMERGENCY_NUMBERS}</strong> immediately.</p>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            {code ? (
              <SuccessCard code={code} onAnother={reset} />
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                {formError && <Alert>{formError}</Alert>}
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field id="crimeType" label="Type of crime" required error={errors.crimeType}>
                    {(cls) => (
                      <select id="crimeType" className={cls} value={values.crimeType} onChange={set('crimeType')}>
                        <option value="">Select…</option>
                        {CRIME_TYPES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                      </select>
                    )}
                  </Field>
                  <Field id="subCounty" label="Sub-county" required error={errors.subCounty}>
                    {(cls) => (
                      <select id="subCounty" className={cls} value={values.subCounty} onChange={set('subCounty')}>
                        <option value="">Select…</option>
                        {SUB_COUNTIES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    )}
                  </Field>
                </div>

                <Field id="location" label="Where" required error={errors.location} hint="Landmark, road, estate or business name">
                  {(cls) => <input id="location" className={cls} value={values.location} onChange={set('location')} placeholder="e.g. Behind the main market" />}
                </Field>

                <Field id="description" label="What happened" required error={errors.description} hint="Include when, who or what (descriptions, vehicles), but nothing that identifies you.">
                  {(cls) => <textarea id="description" rows={5} className={cls} value={values.description} onChange={set('description')} />}
                </Field>

                <Field id="image" label="Photo (optional)" hint="Only if it is safe to take one.">
                  {() =>
                    image ? (
                      <div className="relative inline-block">
                        <img src={image} alt="Selected upload preview" className="h-36 rounded-lg border border-slate-200 object-cover" />
                        <button type="button" onClick={() => setImage(null)} className="absolute right-2 top-2 rounded-full bg-white p-1.5 text-red-600 shadow" aria-label="Remove photo"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    ) : (
                      <label htmlFor="image" className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 px-4 py-5 text-sm text-slate-600 hover:border-brand-600 hover:bg-brand-50">
                        <ImagePlus className="h-5 w-5 text-brand-600" aria-hidden="true" /> Click to add an image
                        <input id="image" type="file" accept="image/*" className="sr-only" onChange={handleImage} />
                      </label>
                    )
                  }
                </Field>

                <Button type="submit" size="lg" className="w-full sm:w-auto" loading={submitting}>
                  <Send className="h-4 w-4" aria-hidden="true" /> Send anonymous report
                </Button>
              </form>
            )}
          </div>
        </div>

        <aside className="space-y-6">
          <section className="rounded-xl border border-brand-200 bg-brand-50/60 p-6">
            <h2 className="flex items-center gap-2 font-bold text-brand-800"><EyeOff className="h-4 w-4" aria-hidden="true" /> How we protect you</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700">
              <li>You do not need to log in or register.</li>
              <li>We never ask for your name, phone or email.</li>
              <li>Your report is not linked to any account.</li>
              <li>Photos are re-saved without hidden location data.</li>
              <li>You get a random code to check progress later.</li>
            </ul>
          </section>
          <TrackTip />
        </aside>
      </div>
    </div>
  )
}