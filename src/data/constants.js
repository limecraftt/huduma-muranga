/**
 * Static reference data and site configuration used across the app.
 * Edit contact details and site text here.
 */
import { Construction, Droplets, HeartPulse, Lightbulb, MoreHorizontal, Trash2 } from 'lucide-react'

export const SITE = {
  name: "Huduma Murang'a",
  tagline: 'Public Service Request System',
  county: "Murang'a County",
  description:
    "We are dedicated to transforming the livelihood of the people of Murang'a County on a foundation of integrity through accountable, efficient and effective leadership.",
  copyrightYears: '2026 - 2027',
}

export const CONTACT = {
  address: "P.O Box 52 - 10200 Murang'a",
  phone: '+254 757 562 988',
  email: 'info@muranga.go.ke',
  complaintsEmail: 'complain@muranga.go.ke',
}

export const QUICK_CONTACTS = [
  { label: 'Ambulance', phone: '0716 017 296' },
  { label: 'Call Center', phone: '0757 562 988' },
  { label: 'Fire Hotline', phone: '080 072 1800' },
]

export const SOCIAL_LINKS = [
  { name: 'Facebook', href: '#', icon: 'facebook' },
  { name: 'X (Twitter)', href: '#', icon: 'twitter' },
  { name: 'Instagram', href: '#', icon: 'instagram' },
]

/** Service categories a citizen can report against. */
export const CATEGORIES = [
  { id: 'street-lights', label: 'Street Lights', icon: Lightbulb, description: 'Broken or missing street lighting' },
  { id: 'water', label: 'Water & Sewer', icon: Droplets, description: 'Leaks, shortages, burst pipes, sewer blockages' },
  { id: 'garbage', label: 'Garbage Collection', icon: Trash2, description: 'Missed collection, illegal dumping' },
  { id: 'roads', label: 'Roads & Drainage', icon: Construction, description: 'Potholes, blocked drains, damaged culverts' },
  { id: 'health', label: 'Public Health', icon: HeartPulse, description: 'Sanitation and public health concerns' },
  { id: 'other', label: 'Other Services', icon: MoreHorizontal, description: 'Anything else the county should know about' },
]

export const SUB_COUNTIES = ['Kangema', 'Mathioya', 'Kiharu', 'Kigumo', 'Maragwa', 'Kandara', 'Gatanga']

export const STATUS = { PENDING: 'pending', IN_PROGRESS: 'in_progress', RESOLVED: 'resolved' }

/** Ordered, so the progress timeline and dropdowns follow the same flow. */
export const STATUS_FLOW = [STATUS.PENDING, STATUS.IN_PROGRESS, STATUS.RESOLVED]

export const STATUS_META = {
  pending: { label: 'Pending', classes: 'bg-amber-50 text-amber-800 ring-amber-200', dot: 'bg-amber-500' },
  in_progress: { label: 'In Progress', classes: 'bg-sky-50 text-sky-800 ring-sky-200', dot: 'bg-sky-500' },
  resolved: { label: 'Resolved', classes: 'bg-brand-50 text-brand-800 ring-brand-200', dot: 'bg-brand-600' },
}

export const ROLES = { CITIZEN: 'citizen', ADMIN: 'admin' }
/** Types of crime/incident that can be reported anonymously. */
export const CRIME_TYPES = [
  { id: 'theft', label: 'Theft / Robbery' },
  { id: 'drugs', label: 'Illegal drugs / Illicit brew' },
  { id: 'violence', label: 'Violence / Gender-based violence' },
  { id: 'corruption', label: 'Corruption / Bribery' },
  { id: 'vandalism', label: 'Vandalism of county property' },
  { id: 'child-safety', label: 'Child abuse / Safety' },
  { id: 'other', label: 'Other crime' },
]

export const EMERGENCY_NUMBERS = 'Police emergency: 999 or 112'
