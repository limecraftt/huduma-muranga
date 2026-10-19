# Huduma Murang'a: Public Service Request System

A web application that lets residents of **Murang'a County** report public service problems (broken street lights, water leaks, uncollected garbage, damaged roads and more), track them until they are fixed, and report crime **anonymously**. County administrators get a live dashboard to triage, update and analyse everything that comes in.

> **Live demo:** https://huduma-muranga.vercel.app
> **Source code:** https://github.com/limecraftt/huduma-muranga

---

## For assessors: try it in 2 minutes

| Role | How to get in |
| --- | --- |
| **Administrator** | Open the [login page](https://huduma-muranga.vercel.app/login). The demo admin credentials are shown at the top of the page (email `hudumaadmin@gmail.com`, password `Township2030`). Press **Fill in admin login**, then **Login**. |
| **Citizen** | Click **Sign up**, create an account, then use **New request**. |
| **Anonymous reporter** | No account needed. Open **Report Crime** from the menu. You receive a tracking code such as `TIP-K7QM-4XZA`. |

Suggested walkthrough:

1. Sign up as a citizen and submit a request with a photo.
2. Open the site in another browser or on your phone, log in as the admin and find the request under **Live**.
3. Change its status (Pending, In Progress, Resolved) and add a note.
4. Return to the citizen account. The status and the note appear on the request timeline within 30 seconds, with no refresh needed.
5. Submit an anonymous tip, then look it up with its code on the Report Crime page. As admin, review it in **Anonymous crime tips**.

---

## Features

### Citizens
- Registration and login with full name, email, ward and password (hashed and managed by Supabase Auth).
- **Forgot password** with a 6-digit code sent by email, then a new password. No reset links to click.
- Show/hide password toggle on every password field.
- Submit a service request with category, sub-county, location, description and an optional photo.
- Personal dashboard with live counts (total, open, resolved), a status timeline for every request and **filters**: status pills with counts, category, free-text search and "Show more" paging.

### Administrators
- Role-protected dashboard that only admin accounts can open.
- **Live / History tabs.** Live holds pending and in-progress work. History holds resolved items, newest first. Long lists are paged with "Show more".
- Filter by status and sub-county, view photos and the full history, change status with an optional note.
- **Analytics:** totals, open work, resolution rate, requests by category and by status.
- **Anonymous crime tips** have their own counts, Live / History tabs and review panel. Pending tips are included in the "awaiting action" banner.
- Data refreshes automatically every 30 seconds and when the browser tab regains focus, so two people can work at once.

### Anonymous crime reporting
- No login, no user column in the database. A tip cannot be traced back to a person.
- Each tip returns a random tracking code. Entering the code shows only the status and the admin's notes, never the report details.

### General
- Fully responsive. Tables turn into cards on phones, and there is no sideways scrolling.
- Accessible markup: labelled form fields, `aria` attributes on tabs and toggles, keyboard focus styles, reduced-motion support.
- White and green theme with a footer modelled on the official county website.

---

## Tech stack

| Area | Choice |
| --- | --- |
| Front end | React 19, Vite, JavaScript (ES modules) |
| Styling | Tailwind CSS v4 with brand colour tokens |
| Routing | React Router v7 |
| Icons | lucide-react |
| Back end | Supabase: PostgreSQL, Auth, Storage, Row Level Security, RPC functions |
| Hosting | Vercel (front end), Supabase cloud (back end) |
| Quality | ESLint (flat config with `react-hooks` rules) |

---

## Architecture

The code is layered so that each part has one job:

```
Pages / Components  ->  Hooks  ->  Services  ->  Supabase
 (what you see)      (loading,    (all database   (data, auth,
                      refreshing)  and storage     security)
                                   calls)
```

- **Pages and components never talk to Supabase directly.** They call a service or a hook. Swapping the back end means changing only `src/services`.
- **Hooks** (`useRequests`, `useTips`, built on `useLiveList`) hold loading, error and auto-refresh logic once, instead of repeating it on each page.
- **Shared UI** (`ui.jsx`, `StatusPills`, `LiveHistoryTabs`, `PasswordInput`) keeps the interface consistent.
- **Pure helpers** (`lib/stats.js`) compute analytics from plain arrays, so the same function serves both the citizen and admin dashboards.

### Project structure

```
huduma-muranga/
├── public/                  Logo and hero images
├── supabase/
│   └── schema.sql           Complete database setup (tables, security, storage)
├── src/
│   ├── components/          Reusable UI: Header, Footer, Layout, forms, modals, tabs, pills
│   ├── context/             AuthProvider and the auth context
│   ├── data/constants.js    Categories, sub-counties, statuses, crime types
│   ├── hooks/               useLiveList, useRequests, useTips
│   ├── lib/                 supabase client, error helper, stats, formatting helpers
│   ├── pages/               Landing, Login, SignUp, ForgotPassword, dashboards, ReportCrime
│   ├── services/            authService, requestService, tipService, storage
│   ├── App.jsx              Route table
│   └── main.jsx             Entry point
├── vercel.json              Single-page-app rewrites
└── package.json
```

---

## Security design

Security is enforced **in the database**, not only in the interface:

- **Row Level Security** is enabled on every table.
  - A citizen can read only their own requests and history.
  - Admins can read everything.
  - `tips` and `tip_history` can be read by admins only.
- **Status changes go through database functions** (`update_request_status`, `update_tip_status`). They check `is_admin()` and write the history entry in the same transaction. A citizen cannot change a status, even by calling the API by hand.
- **Roles cannot be self-assigned.** The `role` column is not updatable by users. New sign-ups are always citizens, and admins are promoted in the database.
- **Anonymous tips** are created through `submit_tip` and looked up through `track_tip`. These are the only things the public can do with tips, and the lookup returns status and notes only.
- **Photos** live in private storage buckets and are shown through short-lived signed URLs. Citizens can read only their own folder, and tip photos are readable by admins only.
- Passwords are never stored by the app. Supabase Auth handles hashing and sessions.
- Only the public `anon` key is used in the browser. No secret key is in the repository.

---

## Run it locally

**Prerequisites:** Node.js 20 or newer, npm, and a free [Supabase](https://supabase.com) account.

```bash
# 1. Get the code
git clone https://github.com/limecraftt/huduma-muranga.git
cd huduma-muranga
npm install

# 2. Create your environment file
cp .env.example .env.local
#    then fill in the two values from Supabase > Project Settings > API:
#    VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
#    VITE_SUPABASE_ANON_KEY=your-anon-public-key

# 3. Start the dev server
npm run dev
```

### Set up the database (once per Supabase project)

1. In Supabase, open **SQL Editor > New query**.
2. Paste the whole of [`supabase/schema.sql`](supabase/schema.sql) and press **Run**. This creates the tables, security rules, functions and storage buckets.
3. Open **Authentication > Emails > Reset Password** and make the template show the code:
   ```html
   <h2>Reset your password</h2>
   <p>Your 6-digit code is: <strong>{{ .Token }}</strong></p>
   ```
4. (Optional, for testing) Under **Authentication > Providers > Email**, turn **Confirm email** off so new accounts can log in straight away.

### Create an administrator

1. Sign up normally in the app with the email you want to use for the admin.
2. In the Supabase SQL Editor run:
   ```sql
   update public.profiles set role = 'admin' where email = 'YOUR-ADMIN-EMAIL';
   ```
3. Log in with that account. You are taken to `/admin`.

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run ESLint (the project passes with no errors) |

---

## Deployment

1. Push the repository to GitHub.
2. Import it into [Vercel](https://vercel.com). The Vite settings are detected automatically.
3. Add the environment variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` under **Project Settings > Environment Variables**.
4. Deploy. Vite bakes these values in at build time, so **redeploy after changing them**.

`vercel.json` rewrites all routes to `index.html` so that refreshing a deep link such as `/dashboard` works.

---

## Testing

The project was tested manually against the live deployment:

- [ ] Sign up, login, logout and the forgot-password flow with a real email code
- [ ] Citizen submits a request with a photo, and the admin sees it on another device
- [ ] Admin changes the status and the citizen sees the update and note
- [ ] A citizen cannot open `/admin`, and an admin is redirected away from citizen-only pages
- [ ] Anonymous tip submission and lookup by tracking code
- [ ] Filters, Live / History tabs and "Show more" on both dashboards
- [ ] Layout checked at phone, tablet and desktop widths
- [ ] `npm run lint` and `npm run build` pass

---

## Design decisions

- **Supabase over a custom server.** Auth, storage and Row Level Security give real security with less code to maintain, and the data is shared across devices.
- **Rules in the database.** Even a modified client cannot read other people's data or change a status.
- **Live / History split.** An admin's working list stays short and focused, and resolved items stay searchable.
- **Polling every 30 seconds** instead of websockets. It is simple, robust and fast enough for this workload.
- **Anonymous by construction.** The tips table has no user column, so there is nothing to leak.

## Known limitations and future work

- Email delivery uses Supabase's default sender, which is rate-limited. A production system would use its own SMTP provider.
- Notifications are in-app only. Email or SMS alerts to citizens are a natural next step.
- Real-time updates could replace polling with Supabase Realtime.
- A map view of requests by location, and assigning requests to named officers, would help administrators.
- Automated tests (unit tests for `lib/stats.js` and end-to-end tests with Playwright) are not yet included.

---

## Author

**CJ**, Murang'a County, Kenya. Built as a coursework project for the Public Service Request System assignment.