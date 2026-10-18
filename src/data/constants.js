/**
 * Static reference data and site configuration used across the app.
 * Contact details are placeholders for the academic demo: edit them here.
 */
import { Construction, Droplets, HeartPulse, Lightbulb, MoreHorizontal, Trash2 } from 'lucide-react'

export const SITE = {
  name: "Huduma Murang'a",
  tagline: 'Public Service Request System',
  county: "Murang'a County",
  description:
    "We are dedicated to transforming the livelihood of the people of Murang'a County on a foundation of integrity through accountable, efficient and effective leadership.",
  copyrightYears: '2026 - 2027',
  disclaimer: 'Academic project. Not an official government service.',
}

export const CONTACT = {
  address: "P.O Box 00000 - 10200 Murang'a",
  phone: '+254 700 000 000',
  email: 'info@example.go.ke',
  complaintsEmail: 'complaints@example.go.ke',
}

export const QUICK_CONTACTS = [
  { label: 'Ambulance', phone: '0700 000 001' },
  { label: 'Call Center', phone: '0700 000 002' },
  { label: 'Fire Hotline', phone: '0700 000 003' },
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