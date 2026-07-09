# RentalFOC — Rental Management System

A serverless rental management SPA built with React + TypeScript, deployed on **GitHub Pages**, backed by **Supabase** (PostgreSQL + Auth + Storage).

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Auth | Supabase Auth (email/password) |
| Database | Supabase PostgreSQL (with Row Level Security) |
| File Storage | Supabase Storage (`payment-proofs` bucket) |
| Hosting | GitHub Pages (via GitHub Actions) |

---

## Local Development

### 1. Clone

```bash
git clone https://github.com/<your-username>/<repo-name>.git
cd <repo-name>
npm install
```

### 2. Environment variables

Copy `.env.development` and fill in your Supabase credentials:

```bash
cp .env.development .env.local
```

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
VITE_BASE_PATH=/
```

> **Never commit real credentials.** `.env.local` is git-ignored.

### 3. Run

```bash
npm run dev
```

---

## Database Setup (Supabase)

### Step 1 — Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → New project
2. Note your **Project URL** and **anon public key** (Settings → API)

### Step 2 — Run the schema

In the Supabase dashboard → **SQL Editor** → paste and run `supabase-schema.sql`.

This creates:

| Table | Purpose |
|---|---|
| `users` | Owner/Renter profiles (mirrors `auth.users`) |
| `properties` | Rental properties |
| `units` | Rooms/units within a property |
| `renters` | Renter records |
| `renter_unit_assignments` | Links renters to units with rent amount |
| `invoices` | Monthly invoices |
| `invoice_line_items` | Line items per invoice |
| `payments` | Payment records with proof file path |

Row Level Security (RLS) is enabled on all tables — owners only see their own data, renters only see their own invoices/payments.

### Step 3 — Create Storage bucket

In Supabase dashboard → **Storage** → **New bucket**:

- Name: `payment-proofs`
- Public: ✅ (so proof images are viewable via URL)

Or the schema SQL already includes the bucket creation statement.

---

## GitHub Pages Deployment

### Step 1 — Enable GitHub Pages

In your repo → **Settings** → **Pages** → Source: **GitHub Actions**

### Step 2 — Add Secrets

In your repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**:

| Secret name | Value |
|---|---|
| `VITE_SUPABASE_URL` | `https://your-project-ref.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `your-anon-public-key` |

> Secrets are injected at build time by GitHub Actions. They are **never** stored in the repository or exposed in the built output.

### Step 3 — Push to main

```bash
git add .
git commit -m "deploy"
git push origin main
```

The workflow in `.github/workflows/deploy.yml` will:
1. Install dependencies
2. Build with secrets injected as env vars
3. Copy `index.html` → `404.html` for SPA routing
4. Deploy to GitHub Pages

Your app will be live at: `https://<username>.github.io/<repo-name>/`

---

## Architecture — Credential Routing

All Supabase credentials and bucket names are **centralised in `src/lib/client.ts`**.

```
src/lib/client.ts          ← only file that knows the URL, key, and bucket name
    ├── auth.*             ← wraps supabase.auth.*
    ├── db.from(table)     ← wraps supabase.from(table)
    └── storage.*          ← wraps supabase.storage.* (bucket hidden)

src/services/*.ts          ← import { auth, db, storage } from '../lib/client'
src/context/AuthContext.tsx
src/pages/*.tsx
src/components/**/*.tsx
```

Service files and components **never** import from `@supabase/supabase-js` directly. This means:
- Rotating credentials only requires changing `.env` / GitHub Secrets
- The bucket name is never visible in service code
- A single place to add request logging, error handling, or swap backends

---

## User Roles

| Role | Access |
|---|---|
| **Owner** | Full CRUD on properties, units, renters, invoices, payments |
| **Renter** | Read own invoices, submit payment proofs |

Owners register via `/register`. Renters are created by owners and linked by email.

---

## Project Structure

```
src/
├── lib/
│   ├── client.ts          # Supabase proxy (auth, db, storage)
│   └── supabase.ts        # Re-export shim
├── services/              # Business logic — use client.ts only
├── context/               # Auth state
├── pages/                 # Route pages
├── components/            # UI components
└── types/                 # Shared TypeScript types
```
