<![CDATA[<div align="center">

# PLXYGROUND

**The sports creator platform — connecting athletes and creators with businesses and opportunities.**

Built by [Basketball Nxtion](https://github.com/Gowsikan123) · Developed by Gowi (T-Level Placement Student)

[![Node.js](https://img.shields.io/badge/Node.js-22_LTS-339933?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-5.0-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://postgresql.org)
[![Expo](https://img.shields.io/badge/Expo-SDK_54-000020?style=flat-square&logo=expo&logoColor=white)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React_Native-0.76-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactnative.dev)

</div>

---

## What is PLXYGROUND?

PLXYGROUND is a monorepo sports creator platform with three services running in parallel:

| Service | Tech | Port | Description |
|---|---|---|---|
| **Backend API** | Node.js 22 · Express 5 · PostgreSQL 16 | `3011` | REST API with JWT auth, moderation queue, audit logging |
| **Mobile App** | Expo SDK 54 · React Native 0.76 | `19006` | iOS & Android app for creators and businesses |
| **Admin Panel** | Vanilla HTML/CSS/JS · Node.js http-server | `3012` | Full moderation and management dashboard |

Target deployment: **Railway / Render** (backend + DB) · **Expo EAS** (mobile — App Store & Google Play)

---

## Monorepo Structure

```
plxyground/
├── backend/
│   └── src/
│       ├── index.js              # App entry — mounts all routes
│       ├── config.js             # Env var validation (throws on missing)
│       ├── logger.js             # Timestamped logger (info/warn/error)
│       ├── db/
│       │   ├── client.js         # Singleton pg.Pool
│       │   ├── setup.js          # CREATE TABLE IF NOT EXISTS + autoSeed
│       │   └── seed.js           # Dev seed: 1 admin, 5 creators, 3 businesses…
│       ├── middleware/
│       │   ├── auth.js           # requireAuth, requireAdmin
│       │   ├── validate.js       # express-validator error handler
│       │   └── rateLimiter.js    # Global (100/15min) + auth (10/15min)
│       ├── routes/
│       │   ├── auth.js           # Creator signup/login/me
│       │   ├── businessAuth.js   # Business signup/login/me + content CRUD
│       │   ├── content.js        # Public feed + creator post CRUD
│       │   ├── creators.js       # List, by slug/id, update profile
│       │   ├── opportunities.js  # Full CRUD, both user types
│       │   └── admin/
│       │       ├── auth.js       # Admin login, change-password
│       │       ├── queue.js      # Moderation queue + bulk actions
│       │       ├── content.js    # Admin content management
│       │       ├── users.js      # Suspend/reactivate, change role
│       │       ├── analytics.js  # Platform KPIs + weekly signups
│       │       └── audit.js      # Audit log viewer + JSON export
│       └── utils/
│           ├── jwt.js            # signToken / verifyToken
│           ├── auditLogger.js    # Fire-and-forget audit DB writer
│           └── slugify.js        # URL-safe slug with collision suffix
│   ├── scripts/
│   │   └── smoke.js              # End-to-end smoke test suite
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── app/
│   │   ├── _layout.jsx           # Root: fonts, hydration, auth redirect
│   │   ├── index.jsx             # Splash/redirect screen
│   │   ├── auth/                 # login, signup, business-login, business-signup
│   │   ├── creator/              # feed, create, opportunities, profile, settings
│   │   ├── business/             # dashboard, my-content, search-creators, opportunities…
│   │   ├── post/[id].jsx
│   │   ├── creator/[id].jsx
│   │   ├── terms.jsx
│   │   └── privacy.jsx
│   ├── components/
│   │   ├── ui/                   # Button, Input, Card, Avatar, Badge, Skeleton, Toast, EmptyState
│   │   ├── feed/                 # PostCard, FeedList
│   │   ├── opportunities/        # OpportunityCard
│   │   └── layout/               # Header, TabBar
│   ├── store/
│   │   ├── authStore.js          # Zustand: user, userType, token, hydrate, login, logout
│   │   └── feedStore.js          # Zustand: posts, search, sport filter, pagination
│   ├── services/
│   │   ├── api.js                # Axios instance + auth interceptors
│   │   ├── authService.js
│   │   ├── contentService.js
│   │   ├── creatorService.js
│   │   └── opportunityService.js
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useFeed.js
│   │   └── useOpportunities.js
│   ├── constants/
│   │   ├── colors.js             # Dark palette — primary #FF3C3C, bg #0A0A0A
│   │   ├── typography.js         # Syne (headings) + DM Sans (body), full scale
│   │   └── spacing.js            # 4-base spacing scale + border radii
│   ├── app.json                  # bundle ID: com.basketballnxtion.plxyground
│   ├── .env.example
│   └── package.json
│
├── admin-panel/
│   ├── index.html                # Full dark-theme SPA — all 6 sections
│   ├── server.js                 # Tiny Node.js http-server on port 3012
│   └── package.json
│
├── docs/
│   └── openapi.yaml              # Full OpenAPI 3.0 spec
│
├── .github/
│   └── workflows/
│       └── smoke.yml             # CI: runs smoke.js on push
│
├── start-all.sh                  # Linux/macOS/WSL — all 3 services
├── start-all.ps1                 # Windows PowerShell — all 3 services
└── .gitignore
```

---

## Quick Start

### Option A — Start Everything at Once

**Windows (PowerShell):**
```powershell
.\start-all.ps1
```
Opens three separate PowerShell windows for backend, admin panel, and frontend simultaneously.

**Linux / macOS / WSL:**
```bash
chmod +x start-all.sh && ./start-all.sh
```

---

### Option B — Start Each Service Manually

#### 1. Backend
```bash
cd backend
npm install
cp .env.example .env        # fill in DATABASE_URL and JWT_SECRET (32+ chars)
node src/db/setup.js        # creates tables + auto-seeds on first run
npm run dev                 # → http://localhost:3011
```

#### 2. Admin Panel
```bash
cd admin-panel
npm install
npm start                   # → http://localhost:3012
```
Log in with the seeded admin credentials — see `backend/src/db/seed.js`.

#### 3. Frontend (Expo)
```bash
cd frontend
npm install
npx expo start              # → Expo DevTools http://localhost:19006
```
Scan the QR code with Expo Go, or press `i` / `a` for iOS/Android simulators.

---

## Environment Variables

### `backend/.env.example`
```env
PORT=3011
DATABASE_URL=postgresql://postgres:password@localhost:5432/plxyground
JWT_SECRET=replace-this-with-a-32-plus-character-secret-key
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:19006,http://localhost:3012
NODE_ENV=development
```
> ⚠️ The server **throws at startup** if any required variable is missing or if `JWT_SECRET` is under 32 characters.

### `frontend/.env.example`
```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:3011
```

---

## Database Schema

9 tables — all created automatically on first startup via `backend/src/db/setup.js`.

| Table | Purpose |
|---|---|
| `admins` | Admin accounts |
| `creators` | Creator profiles (slug, sport, followerCount…) |
| `creator_accounts` | Creator auth (email, passwordHash, role, isSuspended) |
| `businesses` | Business profiles + auth |
| `content` | Creator posts — status: `pending → published / rejected` |
| `business_content` | Business posts with budget range + target sport |
| `opportunities` | Job/collab listings posted by creators or businesses |
| `moderation_queue` | Review queue linking to content/business_content |
| `audit_log` | Immutable action log for all admin operations |

---

## API Reference

### Public

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Health check — returns `{ status: "ok", uptime }` |
| `GET` | `/api/content` | Public feed with `?search=&sport=&limit=&offset=` |
| `GET` | `/api/content/:id` | Single post |
| `GET` | `/api/creators` | List creators with filters |
| `GET` | `/api/creators/:id` | Creator by ID |
| `GET` | `/api/creators/slug/:slug` | Creator by slug |
| `GET` | `/api/opportunities` | List opportunities |
| `GET` | `/api/opportunities/:id` | Single opportunity |

### Creator Auth (JWT)

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/auth/signup` | Register creator |
| `POST` | `/api/auth/login` | Creator login → returns `{ token, creator }` |
| `GET` | `/api/auth/me` | Current creator profile |
| `POST` | `/api/content` | Create post (goes to moderation queue) |
| `PATCH` | `/api/content/:id` | Update own post |
| `DELETE` | `/api/content/:id` | Delete own post |
| `PATCH` | `/api/creators/:id` | Update own creator profile |
| `POST` | `/api/opportunities` | Create opportunity |
| `PATCH` | `/api/opportunities/:id` | Update own opportunity |
| `DELETE` | `/api/opportunities/:id` | Delete own opportunity |

### Business Auth (JWT)

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/business/auth/signup` | Register business |
| `POST` | `/api/business/auth/login` | Business login → returns `{ token, business }` |
| `GET` | `/api/business/auth/me` | Current business profile |
| `GET` | `/api/business/content` | Own business content |
| `POST` | `/api/business/content` | Create business post |
| `PATCH` | `/api/business/content/:id` | Update own business post |
| `DELETE` | `/api/business/content/:id` | Delete own business post |
| `POST` | `/api/opportunities` | Create opportunity |

### Admin (Admin JWT)

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/admin/auth/login` | Admin login |
| `POST` | `/api/admin/auth/change-password` | Change admin password |
| `GET` | `/api/admin/analytics` | KPIs + weekly signup chart data |
| `GET` | `/api/admin/queue` | Moderation queue with `?status=pending` |
| `POST` | `/api/admin/queue/bulk-action` | Approve / reject / delete multiple items |
| `GET` | `/api/admin/content` | All content with search + status filter |
| `PATCH` | `/api/admin/content/:id` | Publish or delete content |
| `GET` | `/api/admin/users` | All creators and businesses |
| `PATCH` | `/api/admin/users/:id/suspend` | Suspend user |
| `PATCH` | `/api/admin/users/:id/reactivate` | Reactivate user |
| `PATCH` | `/api/admin/users/:id/role` | Change role |
| `PATCH` | `/api/admin/users/:id/verify-email` | Mark email verified |
| `GET` | `/api/admin/audit` | Audit log with `?actorType=` filter |
| `GET` | `/api/admin/audit/export` | Download audit log as JSON |

---

## Admin Panel

Access at **http://localhost:3012** — log in with seeded admin credentials.

Six sections, all fully functional:

- **Dashboard** — KPI cards (creators, businesses, content, pending queue), pure-CSS weekly signups bar chart, alert feed
- **Moderation Queue** — pending items table, checkbox multi-select, bulk approve/reject/delete with review notes
- **Content** — all platform content with status filter, search, publish/delete actions
- **Users** — creators and businesses table, suspend/reactivate, change role, verify email
- **Audit Log** — full log with actor-type filter, pagination, one-click JSON export
- **Settings** — change admin password (current → new → confirm)

---

## Frontend Design System

| Token | Value |
|---|---|
| Primary red | `#FF3C3C` |
| Background | `#0A0A0A` |
| Surface | `#141414` |
| Text primary | `#FFFFFF` |
| Text muted | `#999999` |
| Heading font | Syne 700 Bold (Google Fonts) |
| Body font | DM Sans 400/500 (Google Fonts) |
| Tab bar inactive | `#555555` |

All lists use **FlashList** (Shopify) — never FlatList. Tokens are in `frontend/constants/`.

---

## Testing

**Smoke tests** (requires backend running on port 3011):
```bash
cd backend
npm run smoke
```
Covers: health check, creator signup/login/me, business signup/login/me, content CRUD, admin login, queue, analytics.

**Unit tests:**
```bash
cd backend
npm test
```

---

## CI

GitHub Actions runs the smoke suite on every push to `main`. See `.github/workflows/smoke.yml`.

---

## Deployment

| Service | Target |
|---|---|
| Backend + DB | Railway or Render — set all env vars from `.env.example` |
| Admin Panel | Railway static service or same Render app on port 3012 |
| Mobile | Expo EAS Build → App Store (`com.basketballnxtion.plxyground`) + Google Play |

Update `EXPO_PUBLIC_API_BASE_URL` in frontend `.env` to your deployed backend URL before building for production. No hardcoded `localhost` in any production file.

---

## Contributing

1. Branch off `main`
2. Write every function in full — no TODOs, no stubs, no empty bodies
3. All SQL must use parameterised queries (zero string interpolation)
4. No `console.log` anywhere — use `logger` from `backend/src/logger.js`
5. All async Express handlers wrapped in `try/catch`
6. Run smoke tests before opening a PR

---

<div align="center">

Built with 🏀 by [Basketball Nxtion](https://github.com/Gowsikan123)

</div>
]]>