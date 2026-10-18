/**
 * Demo data loaded on first run so both dashboards have something to show.
 * Passwords are stored in plain text ONLY because this is a mock backend.
 * Supabase Auth hashes passwords for you, so none of this carries over.
 */
import { ROLES, STATUS } from './constants'

export const DEMO_ADMIN = {
  id: 'admin-1',
  fullName: 'Service Admin',
  email: 'admin@huduma.test',
  ward: "Murang'a Town",
  password: 'Admin@123',
  role: ROLES.ADMIN,
}

export const DEMO_CITIZEN = {
  id: 'citizen-1',
  fullName: 'Wanjiku Kamau',
  email: 'citizen@huduma.test',
  ward: 'Township',
  password: 'Citizen@123',
  role: ROLES.CITIZEN,
}

export const SEED_USERS = [DEMO_ADMIN, DEMO_CITIZEN]

const daysAgo = (n) => new Date(Date.now() - n * 86_400_000).toISOString()
const received = (n) => ({ status: STATUS.PENDING, at: daysAgo(n), note: 'Request received' })

export const SEED_REQUESTS = [
  {
    id: 'seed-1', ref: 'HM-2026-0001', userId: 'citizen-1', category: 'street-lights', subCounty: 'Kiharu',
    location: "Murang'a Town, near Kenol junction",
    description: 'The street light outside the bus stage has been out for two weeks. It is very dark at night.',
    image: null, status: STATUS.RESOLVED, createdAt: daysAgo(21), updatedAt: daysAgo(14),
    history: [
      received(21),
      { status: STATUS.IN_PROGRESS, at: daysAgo(18), note: 'Technician assigned' },
      { status: STATUS.RESOLVED, at: daysAgo(14), note: 'Bulb and wiring replaced' },
    ],
  },
  {
    id: 'seed-2', ref: 'HM-2026-0002', userId: 'citizen-1', category: 'water', subCounty: 'Kangema', location: 'Kangema Market',
    description: 'A main pipe is leaking near the market and water is flowing onto the road.',
    image: null, status: STATUS.IN_PROGRESS, createdAt: daysAgo(6), updatedAt: daysAgo(3),
    history: [received(6), { status: STATUS.IN_PROGRESS, at: daysAgo(3), note: 'Water team dispatched' }],
  },
  {
    id: 'seed-3', ref: 'HM-2026-0003', userId: 'citizen-1', category: 'garbage', subCounty: 'Maragwa', location: 'Kenol, behind the main stage',
    description: 'Garbage has not been collected for over a week and the pile is attracting dogs.',
    image: null, status: STATUS.PENDING, createdAt: daysAgo(2), updatedAt: daysAgo(2), history: [received(2)],
  },
  {
    id: 'seed-4', ref: 'HM-2026-0004', userId: 'citizen-2', category: 'roads', subCounty: 'Kandara', location: 'Kandara-Gatanga road, 2km from the town',
    description: 'Large potholes have formed after the rains, making the road dangerous for motorbikes.',
    image: null, status: STATUS.RESOLVED, createdAt: daysAgo(30), updatedAt: daysAgo(20),
    history: [
      received(30),
      { status: STATUS.IN_PROGRESS, at: daysAgo(26), note: 'Road crew scheduled' },
      { status: STATUS.RESOLVED, at: daysAgo(20), note: 'Potholes patched' },
    ],
  },
  {
    id: 'seed-5', ref: 'HM-2026-0005', userId: 'citizen-3', category: 'street-lights', subCounty: 'Gatanga', location: 'Ngorongo shopping centre',
    description: 'Three street lights are not working along the main shopping strip.',
    image: null, status: STATUS.PENDING, createdAt: daysAgo(1), updatedAt: daysAgo(1), history: [received(1)],
  },
  {
    id: 'seed-6', ref: 'HM-2026-0006', userId: 'citizen-4', category: 'water', subCounty: 'Mathioya', location: 'Kiru village',
    description: 'No water supply for five days. Residents are walking far to fetch water.',
    image: null, status: STATUS.IN_PROGRESS, createdAt: daysAgo(5), updatedAt: daysAgo(4),
    history: [received(5), { status: STATUS.IN_PROGRESS, at: daysAgo(4), note: 'Investigating the intake' }],
  },
]
export const SEED_TIPS = [
  {
    id: 'tip-1', code: 'TIP-DEMO-2345', crimeType: 'drugs', subCounty: 'Kiharu',
    location: 'Behind the market, near the river footbridge',
    description: 'Illicit brew is sold from a shack every evening and attracts rowdy groups.',
    image: null, status: STATUS.IN_PROGRESS, createdAt: daysAgo(4), updatedAt: daysAgo(2),
    history: [received(4), { status: STATUS.IN_PROGRESS, at: daysAgo(2), note: 'Forwarded to the area security committee' }],
  },
  {
    id: 'tip-2', code: 'TIP-DEMO-6789', crimeType: 'vandalism', subCounty: 'Maragwa',
    location: 'Kenol stage, public toilets',
    description: 'Taps and pipes are being stolen from the public toilets at night.',
    image: null, status: STATUS.PENDING, createdAt: daysAgo(1), updatedAt: daysAgo(1), history: [received(1)],
  },
]
