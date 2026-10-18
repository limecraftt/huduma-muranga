import { Mail, MapPin, Phone } from 'lucide-react'
import Logo from './Logo'
import { CONTACT, QUICK_CONTACTS, SITE, SOCIAL_LINKS } from '../data/constants'

/** lucide-react has no brand icons, so the social icons are inline SVGs. */
const SOCIAL_ICONS = {
  facebook: <path d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.6-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H8v3h2.5V21h3z" />,
  twitter: <path d="M17.8 3h3l-6.6 7.5L22 21h-6l-4.7-6.1L5.9 21H3l7-8L2.5 3h6.2l4.2 5.6L17.8 3zm-1 16.2h1.7L7.3 4.7H5.5l11.3 14.5z" />,
  instagram: (
    <path d="M7.5 3h9A4.5 4.5 0 0 1 21 7.5v9a4.5 4.5 0 0 1-4.5 4.5h-9A4.5 4.5 0 0 1 3 16.5v-9A4.5 4.5 0 0 1 7.5 3zm0 1.8A2.7 2.7 0 0 0 4.8 7.5v9a2.7 2.7 0 0 0 2.7 2.7h9a2.7 2.7 0 0 0 2.7-2.7v-9a2.7 2.7 0 0 0-2.7-2.7h-9zM12 7.8a4.2 4.2 0 1 1 0 8.4 4.2 4.2 0 0 1 0-8.4zm0 1.8a2.4 2.4 0 1 0 0 4.8 2.4 2.4 0 0 0 0-4.8zm4.7-3.3a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" />
  ),
}

export default function Footer() {
  return (
    <footer className="bg-brand-900 text-brand-100">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div>
          <Logo light />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-brand-100/90">{SITE.description}</p>
          <div className="mt-5 flex gap-3">
            {SOCIAL_LINKS.map((s) => (
              <a
                key={s.name}
                href={s.href}
                aria-label={s.name}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-accent hover:text-brand-900"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                  {SOCIAL_ICONS[s.icon]}
                </svg>
              </a>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">Contact Us</h3>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex gap-3"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />{CONTACT.address}</li>
            <li className="flex gap-3"><Phone className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />{CONTACT.phone}</li>
            <li className="flex gap-3"><Mail className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />{CONTACT.email}</li>
            <li className="flex gap-3"><Mail className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />Complaints: {CONTACT.complaintsEmail}</li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">Emergency Numbers</h3>
          <ul className="mt-4 space-y-3 text-sm">
            {QUICK_CONTACTS.map((c) => (
              <li key={c.label} className="flex items-center justify-between border-b border-white/10 pb-2">
                <span>{c.label}</span>
                <span className="font-semibold text-white">{c.phone}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-4 text-center text-xs text-brand-100/80 sm:px-6 sm:text-left">
          <p>© {SITE.copyrightYears} {SITE.county}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}