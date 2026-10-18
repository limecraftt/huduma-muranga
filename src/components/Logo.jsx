import { Link } from 'react-router-dom'
import { SITE } from '../data/constants'

/** County crest (public/logo.png) + wordmark. Set `light` on dark backgrounds. */
export default function Logo({ light = false, to = '/' }) {
  return (
    <Link to={to} className="inline-flex items-center gap-3" aria-label={`${SITE.name} home`}>
      <img
        src="/logo.png"
        alt={`${SITE.county} crest`}
        className={`h-12 w-auto ${light ? 'rounded-md bg-white p-1.5' : ''}`}
      />
      <span className="leading-tight">
        <span className={`block text-lg font-extrabold tracking-tight ${light ? 'text-white' : 'text-brand-800'}`}>
          {SITE.name}
        </span>
        <span className={`block text-[11px] font-medium uppercase tracking-wider ${light ? 'text-brand-100' : 'text-slate-500'}`}>
          {SITE.tagline}
        </span>
      </span>
    </Link>
  )
}