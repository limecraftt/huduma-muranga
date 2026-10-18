import { useState } from 'react'
import { ImagePlus, Send, Trash2 } from 'lucide-react'
import { Alert, Button, Field } from './ui'
import { useAuth } from '../context/auth'
import { CATEGORIES, SUB_COUNTIES } from '../data/constants'
import { fileToResizedDataUrl } from '../lib/helpers'
import { requestService } from '../services/mockApi'

const EMPTY = { category: '', subCounty: '', location: '', description: '' }

function validate(values) {
  const errors = {}
  if (!values.category) errors.category = 'Choose a category.'
  if (!values.subCounty) errors.subCounty = 'Choose a sub-county.'
  if (values.location.trim().length < 3) errors.location = 'Describe where the problem is.'
  if (values.description.trim().length < 15) errors.description = 'Please give at least 15 characters of detail.'
  return errors
}

/** Citizen form: category, location, description and an optional photo. */
export default function RequestForm({ onCreated, onCancel }) {
  const { user } = useAuth()
  const [values, setValues] = useState(EMPTY)
  const [image, setImage] = useState(null)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const set = (name) => (e) => setValues((v) => ({ ...v, [name]: e.target.value }))

  const handleImage = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
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
      const created = await requestService.create({ ...values, userId: user.id, image })
      onCreated(created)
    } catch (err) {
      setFormError(err.message)
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {formError && <Alert>{formError}</Alert>}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="category" label="Service category" required error={errors.category}>
          {(cls) => (
            <select id="category" className={cls} value={values.category} onChange={set('category')}>
              <option value="">Select a category…</option>
              {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          )}
        </Field>
        <Field id="subCounty" label="Sub-county" required error={errors.subCounty}>
          {(cls) => (
            <select id="subCounty" className={cls} value={values.subCounty} onChange={set('subCounty')}>
              <option value="">Select a sub-county…</option>
              {SUB_COUNTIES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          )}
        </Field>
      </div>

      <Field id="location" label="Exact location" required error={errors.location} hint="Landmark, road or estate name">
        {(cls) => <input id="location" className={cls} value={values.location} onChange={set('location')} placeholder="e.g. Next to Kenol bus stage" />}
      </Field>

      <Field id="description" label="Description" required error={errors.description}>
        {(cls) => (
          <textarea id="description" rows={4} className={cls} value={values.description} onChange={set('description')} placeholder="Tell us what is wrong and how long it has been happening." />
        )}
      </Field>

      <Field id="image" label="Photo (optional)" hint="A clear photo helps crews find and fix the problem faster.">
        {() =>
          image ? (
            <div className="relative inline-block">
              <img src={image} alt="Selected upload preview" className="h-40 rounded-lg border border-slate-200 object-cover" />
              <button type="button" onClick={() => setImage(null)} className="absolute right-2 top-2 rounded-full bg-white p-1.5 text-red-600 shadow hover:bg-red-50" aria-label="Remove photo">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <label htmlFor="image" className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 bg-white px-4 py-6 text-sm text-slate-600 hover:border-brand-600 hover:bg-brand-50">
              <ImagePlus className="h-5 w-5 text-brand-600" aria-hidden="true" /> Click to upload an image
              <input id="image" type="file" accept="image/*" className="sr-only" onChange={handleImage} />
            </label>
          )
        }
      </Field>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        {onCancel && <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>}
        <Button type="submit" loading={submitting}>
          <Send className="h-4 w-4" aria-hidden="true" /> Submit request
        </Button>
      </div>
    </form>
  )
}