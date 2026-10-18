/**
 * Small pure helpers shared across the app: formatting, validation,
 * image resizing and Tailwind class builders.
 */
import { CATEGORIES } from '../data/constants'

/* ---------- Formatting ---------- */

/** "2026-10-17T10:00:00Z" -> "17 Oct 2026" */
export const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }) : ''

/** Same, with the time: "17 Oct 2026, 10:30" */
export const formatDateTime = (iso) =>
  iso
    ? new Date(iso).toLocaleString('en-KE', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : ''

/** Finds a category by id (falls back to "Other"). */
export const categoryOf = (id) => CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1]

/** "jane.doe@mail.com" -> "Jane Doe" (sign-up only asks for an email). */
export function nameFromEmail(email) {
  const local = email.split('@')[0].replace(/[._-]+/g, ' ').trim()
  return local.replace(/\b\w/g, (c) => c.toUpperCase()).slice(0, 30) || 'Citizen'
}

/* ---------- Validation ---------- */

export const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

/* ---------- Images ---------- */

/**
 * Reads an image file and returns a resized JPEG data URL.
 * The mock backend uses localStorage (~5MB), so photos are shrunk first.
 * With Supabase Storage, upload the original File instead.
 */
export function fileToResizedDataUrl(file, maxSize = 900, quality = 0.75) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) return reject(new Error('Please choose an image file.'))
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read the image.'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('That image could not be opened.'))
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}

/* ---------- Tailwind class builders ---------- */

const BUTTON_BASE =
  'inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60'
const BUTTON_VARIANTS = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 shadow-sm',
  outline: 'border border-brand-600 text-brand-700 bg-white hover:bg-brand-50',
  ghost: 'text-slate-700 hover:bg-slate-100',
  light: 'bg-white text-brand-700 hover:bg-brand-50 shadow-sm',
}
const BUTTON_SIZES = { sm: 'px-3 py-1.5 text-sm', md: 'px-4 py-2.5 text-sm', lg: 'px-6 py-3 text-base' }

/** Gives <button> and <Link> the same look: className={buttonClasses({ variant: 'outline' })} */
export const buttonClasses = ({ variant = 'primary', size = 'md', className = '' } = {}) =>
  `${BUTTON_BASE} ${BUTTON_VARIANTS[variant]} ${BUTTON_SIZES[size]} ${className}`.trim()

/** Shared look for inputs, selects and textareas (red border when invalid). */
export const fieldClass = (error) =>
  `block w-full rounded-md border bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20 ${
    error ? 'border-red-400' : 'border-slate-300'
  }`