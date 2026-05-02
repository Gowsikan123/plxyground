<div align="center">

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
│       │   └── seed.js           # Dev seed: 1 admin, 5 creators, 3 businesses
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
│   │   ├── _layout.jsx
│   │   ├── index.jsx
│   │   ├── auth/                 # login, signup, business-login, business-signup
│   │   ├── creator/              # feed, create, opportunities, profile, settings
│   │   ├── business/             # dashboard, my-content, search-creators, opportunities
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
│   │   ├── authStore.js
│   │   └── feedStore.js
│   ├── services/
│   │   ├── api.js
│   │   ├── authService.js
│   │   ├── contentService.js
│   │   ├── creatorService.js
│   │   └── opportunityService.js
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useFeed.js
│   │   └── useOpportunities.js
│   ├── constants/
│   │   ├── colors.js
│   │   ├── typography.js
│   │   └── spacing.js
│   ├── app.json
│   ├── .env.example
│   └── package.json
│
├── admin-panel/
│   ├── index.html
│   ├── server.js
│   └── package.json
│
├── docs/
│   └── openapi.yaml
│
├── .github/
│   └── workflows/
│       └── smoke.yml
│
├── start-all.sh
├── start-all.ps1
└── .gitignore
```

---

## Quick Start

### Option A — Start Everything at Once

**Windows (PowerShell):**
```powershell
.\start-all.ps1
```

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
npm run dev                 # starts on http://localhost:3011
```

On first run the server auto-creates all tables and seeds the database.

#### 2. Admin Panel
```bash
cd admin-panel
npm install
npm start                   # starts on http://localhost:3012
```

Log in with the seeded admin credentials — see `backend/src/db/seed.js`.

#### 3. Frontend (Expo)
```bash
cd frontend
npm install
npx expo start              # opens Expo DevTools → http://localhost:19006
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

> The server throws at startup if any variable is missing or if `JWT_SECRET` is under 32 characters.

### `frontend/.env.example`

```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:3011
```

---

## Database Schema

All 9 tables are created automatically on first startup via `backend/src/db/setup.js`.

| Table | Purpose |
|---|---|
| `admins` | Admin accounts |
| `creators` | Creator profiles (slug, sport, follower count) |
| `creator_accounts` | Creator auth (email, passwordHash, role, isSuspended) |
| `businesses` | Business profiles and auth |
| `content` | Creator posts — status: `pending → published / rejected` |
| `business_content` | Business posts with budget range and target sport |
| `opportunities` | Job/collab listings posted by creators or businesses |
| `moderation_queue` | Review queue linked to content and business_content |
| `audit_log` | Immutable action log for all admin operations |

---

## API Reference

### Public

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `GET` | `/api/content` | Public feed (`?search=&sport=&limit=&offset=`) |
| `GET` | `/api/content/:id` | Single post |
| `GET` | `/api/creators` | List creators |
| `GET` | `/api/creators/:id` | Creator by ID |
| `GET` | `/api/creators/slug/:slug` | Creator by slug |
| `GET` | `/api/opportunities` | List opportunities |
| `GET` | `/api/opportunities/:id` | Single opportunity |

### Creator (JWT)

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/auth/signup` | Register creator |
| `POST` | `/api/auth/login` | Login — returns `{ token, creator }` |
| `GET` | `/api/auth/me` | Current creator profile |
| `POST` | `/api/content` | Create post (enters moderation queue) |
| `PATCH` | `/api/content/:id` | Update own post |
| `DELETE` | `/api/content/:id` | Delete own post |
| `PATCH` | `/api/creators/:id` | Update own profile |
| `POST` | `/api/opportunities` | Create opportunity |
| `PATCH` | `/api/opportunities/:id` | Update own opportunity |
| `DELETE` | `/api/opportunities/:id` | Delete own opportunity |

### Business (JWT)

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/business/auth/signup` | Register business |
| `POST` | `/api/business/auth/login` | Login — returns `{ token, business }` |
| `GET` | `/api/business/auth/me` | Current business profile |
| `GET` | `/api/business/content` | Own business content |
| `POST` | `/api/business/content` | Create business post |
| `PATCH` | `/api/business/content/:id` | Update own post |
| `DELETE` | `/api/business/content/:id` | Delete own post |
| `POST` | `/api/opportunities` | Create opportunity |

### Admin (Admin JWT)

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/admin/auth/login` | Admin login |
| `POST` | `/api/admin/auth/change-password` | Change password |
| `GET` | `/api/admin/analytics` | KPIs + weekly signup data |
| `GET` | `/api/admin/queue` | Moderation queue (`?status=pending`) |
| `POST` | `/api/admin/queue/bulk-action` | Bulk approve/reject/delete |
| `GET` | `/api/admin/content` | All content with filters |
| `PATCH` | `/api/admin/content/:id` | Publish or delete content |
| `GET` | `/api/admin/users` | All users |
| `PATCH` | `/api/admin/users/:id/suspend` | Suspend user |
| `PATCH` | `/api/admin/users/:id/reactivate` | Reactivate user |
| `PATCH` | `/api/admin/users/:id/role` | Change role |
| `PATCH` | `/api/admin/users/:id/verify-email` | Mark email verified |
| `GET` | `/api/admin/audit` | Audit log (`?actorType=` filter) |
| `GET` | `/api/admin/audit/export` | Download audit log as JSON |

---

## Admin Panel

Access at **http://localhost:3012**. Six sections:

- **Dashboard** — KPI cards, weekly signups bar chart, alert feed
- **Moderation Queue** — pending items, multi-select, bulk approve/reject/delete with notes
- **Content** — all platform content, status filter, search, publish/delete
- **Users** — suspend/reactivate, change role, verify email
- **Audit Log** — full log, actor-type filter, one-click JSON export
- **Settings** — change admin password

---

## Testing

```bash
# Smoke tests (requires backend running)
cd backend && npm run smoke

# Unit tests
cd backend && npm test
```

---

## Deployment

| Service | Target |
|---|---|
| Backend + DB | Railway or Render |
| Mobile | Expo EAS → App Store + Google Play (`com.basketballnxtion.plxyground`) |

Set `EXPO_PUBLIC_API_BASE_URL` to your deployed backend URL before building for production.

---

<div align="center">

Built with 🏀 by [Basketball Nxtion](https://github.com/Gowsikan123)

</div>
