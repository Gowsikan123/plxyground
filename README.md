# PLXYGROUND

> A full-stack sports creator–business matchmaking platform. Athletes and creators build profiles, post content, and apply to sponsorship opportunities. Businesses publish campaigns and manage partnerships. Admins moderate everything through a purpose-built dashboard.

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://plxyground.vercel.app/)
[![Deployed on Vercel](https://img.shields.io/badge/deployed%20on-Vercel-black?logo=vercel)](https://vercel.com)
[![Node.js](https://img.shields.io/badge/Node.js-20-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-00e5bf?logo=postgresql&logoColor=white)](https://neon.tech)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue)](#license)

---

## What is Plxyground?

Plxyground bridges the gap between sports creators and the brands that want to work with them. Instead of cold DMs and spreadsheets, creators get a profile to showcase their work, brands get a structured portal to post opportunities, and every piece of content goes through an admin moderation queue before it reaches the feed.

**Three user types. One platform:**

| Role | What they do |
|---|---|
| 🏃 **Creator** | Build a profile, post content, follow others, apply to opportunities |
| 🏢 **Business** | Post sponsorship campaigns, review creator applications, manage partnerships |
| 🛡️ **Admin** | Moderate content queue, manage all users, view full audit log |

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| **Runtime** | Node.js 20 | LTS stability, native ESM support |
| **Framework** | Express 5 | Lightweight, async-first routing |
| **Database** | Neon (PostgreSQL) | Serverless-native Postgres, scales to zero |
| **ORM / Query** | `@neondatabase/serverless` | HTTP-based driver — no persistent connections needed in serverless |
| **Auth** | JWT + bcryptjs | Stateless auth, separate flows per role |
| **Deployment** | Vercel Serverless Functions | Zero-config deploys, edge network, preview URLs per PR |
| **Mobile** | Expo SDK 54 · React Native 0.76 | Cross-platform iOS/Android/Web from one codebase |
| **State** | Zustand | Minimal boilerplate, works well with Expo Router |

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│                  Vercel Edge Network             │
│                                                 │
│  ┌──────────────┐    ┌───────────────────────┐  │
│  │  Expo / RN   │───▶│  Express REST API     │  │
│  │  Mobile App  │    │  /api/*               │  │
│  └──────────────┘    │                       │  │
│                      │  Auth  ─── JWT        │  │
│  ┌──────────────┐    │  Routes ── role-based │  │
│  │  Admin Panel │───▶│  Queue  ── moderation │  │
│  │  Dashboard   │    └──────────┬────────────┘  │
│  └──────────────┘               │               │
└─────────────────────────────────┼───────────────┘
                                  ▼
                        ┌─────────────────┐
                        │  Neon Postgres  │
                        │  (serverless)   │
                        └─────────────────┘
```

**Key design decisions:**
- **HTTP-based DB driver** — `@neondatabase/serverless` uses HTTP instead of TCP, essential for Vercel's serverless functions which can't hold persistent connections
- **Content moderation queue** — every post is `pending` by default; admins approve or reject before it reaches the feed
- **Full audit log** — every admin action is recorded with actor, target, IP address, and metadata
- **Role-based JWT** — separate auth endpoints and middleware guards for creators, businesses, and admins

---

## Database Schema

13 tables covering the full platform:

```
creators          creator_accounts    businesses
admin_users       content             business_content
opportunities     applications        follows
message_threads   messages            notifications
moderation_queue  audit_logs
```

All migrations are idempotent (`CREATE TABLE IF NOT EXISTS`) and run via a single SQL file.

---

## Project Structure

```
plxyground/
├── backend/
│   ├── src/
│   │   ├── db/
│   │   │   └── schema.sql        # Full PostgreSQL schema (13 tables)
│   │   ├── routes/               # API route handlers per domain
│   │   └── middleware/           # JWT auth, rate limiting
│   ├── scripts/
│   │   ├── db-check.js           # List all tables in the live DB
│   │   ├── seed-admin.js         # Seed/update admin credentials
│   │   └── create-admin-table.js # Bootstrap admin table + seed
│   └── .env.local                # Local secrets (not committed)
├── frontend/                     # Expo / React Native app
└── admin-panel/                  # Moderation & analytics dashboard
```

---

## API Routes

| Group | Base path | Auth required |
|---|---|---|
| Creator auth | `POST /api/auth/register` `POST /api/auth/login` | None |
| Business auth | `POST /api/business/register` `POST /api/business/login` | None |
| Content feed | `GET /api/content` | Creator JWT |
| Opportunities | `GET /api/opportunities` `POST /api/opportunities` | Creator / Business JWT |
| Applications | `POST /api/applications` | Creator JWT |
| Admin auth | `POST /api/admin/auth/login` | None |
| Admin moderation | `GET/POST /api/admin/queue` | Admin JWT |
| Admin users | `GET /api/admin/users` | Admin JWT |
| Admin analytics | `GET /api/admin/analytics` | Admin JWT |
| Admin audit log | `GET /api/admin/audit` | Admin JWT |

Full spec: [`docs/openapi.yaml`](./docs/openapi.yaml)

---

## Getting Started

### Prerequisites

- Node.js 20+
- [Vercel CLI](https://vercel.com/docs/cli): `npm i -g vercel`
- A [Neon](https://neon.tech) database linked to the Vercel project

### Local Setup

```bash
# 1. Clone
git clone https://github.com/Gowsikan123/plxyground.git
cd plxyground/backend

# 2. Install
npm install

# 3. Pull env vars from Vercel (includes DATABASE_URL, JWT_SECRET)
vercel env pull .env.local

# 4. Apply schema
node -e "
require('dotenv').config({path:'.env.local'});
const{neon}=require('@neondatabase/serverless');
const fs=require('fs');
const sql=neon(process.env.DATABASE_URL_UNPOOLED);
(async()=>{ await sql.unsafe(fs.readFileSync('src/db/schema.sql','utf8')); console.log('Done'); })()
"

# 5. Seed admin user
node scripts/create-admin-table.js

# 6. Start dev server
npm run dev   # http://localhost:3011
```

### Mobile (Expo)

```bash
cd frontend
npm install
npx expo start   # press w for web, a for Android, i for iOS
```

> Testing on a physical device? Set `EXPO_PUBLIC_API_URL` in `frontend/.env` to your local IP — e.g. `http://192.168.1.x:3011`

---

## Utility Scripts

| Script | Purpose |
|---|---|
| `node scripts/db-check.js` | List all tables in the live database |
| `node scripts/create-admin-table.js` | Create `admin_users` + seed default admin |
| `node scripts/seed-admin.js` | Update admin credentials only |

---

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | Pooled Neon connection (serverless functions) |
| `DATABASE_URL_UNPOOLED` | Direct Neon connection (scripts & migrations) |
| `JWT_SECRET` | Secret for signing JWT tokens |
| `VERCEL_OIDC_TOKEN` | Auto-injected by Vercel |

Pull all vars locally: `vercel env pull .env.local`

---

## Seed Credentials

### Admin
| Email | Password |
|---|---|
| `admin@plxyground.local` | `Internet2026@` |

### Creators (password: `Password1!`)
| Email | Name | Sport |
|---|---|---|
| `jayden@example.com` | Jayden Carter | Basketball |
| `emma@example.com` | Emma Singh | Athletics |
| `kai@example.com` | Kai Thompson | Football |
| `sara@example.com` | Sara Okafor | Tennis |
| `leo@example.com` | Leo Martinez | Boxing |

### Businesses (password: `Password1!`)
| Email | Company |
|---|---|
| `contact@peakgear.com` | Peak Gear |
| `hello@fuelup.io` | FuelUp Nutrition |
| `partnerships@sportsmedia.co` | Sports Media Co |

---

## Running Tests

```bash
cd backend
npm test
```

Tests live in `backend/test/` and use Jest.

---

## License

MIT
