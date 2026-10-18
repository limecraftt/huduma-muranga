import { Link } from 'react-router-dom'
import { buttonClasses } from '../lib/helpers'

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="text-6xl font-extrabold text-brand-600">404</p>
      <h1 className="mt-4 text-2xl font-bold text-slate-900">Page not found</h1>
      <p className="mt-2 text-slate-600">The page you are looking for does not exist or has moved.</p>
      <Link to="/" className={buttonClasses({ className: 'mt-6' })}>Back to home</Link>
    </div>
  )
}