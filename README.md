# 🏀 PLXYGROUND

> **The sports creator platform.** Connect athletes, creators & businesses in one unified mobile-first ecosystem.
>
> Built for [Basketball Nxtion](https://basketballnxtion.com) — production monorepo.

[![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express)](https://expressjs.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15%2B-4169E1?logo=postgresql&logoColor=white)](https://postgresql.org)
[![Expo](https://img.shields.io/badge/Expo-SDK%2051-000020?logo=expo)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React%20Native-0.74-61DAFB?logo=react)](https://reactnative.dev)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## Architecture

| Service | Stack | Port | Purpose |
|---|---|---|---|
| `backend/` | Node.js · Express · PostgreSQL | `3011` | REST API, auth, business logic |
| `frontend/` | Expo · React Native · Zustand | `8081` | iOS & Android mobile app |
| `admin-panel/` | Vanilla HTML · CSS · JS | `3012` | Internal moderation & analytics SPA |

---

## Monorepo Structure

```
plxyground/
├── backend/
│   ├── src/
│   │   ├── app.js                  # Express app factory (middleware stack)
│   │   ├── index.js                # Server entry — binds port, runs DB setup
│   │   ├── config.js               # Env var validation — throws on missing required vars
│   │   ├── logger.js               # Structured timestamped logger (info/warn/error)
│   │   ├── db/
│   │   │   ├── client.js           # Singleton pg.Pool from DATABASE_URL
│   │   │   ├── setup.js            # CREATE TABLE IF NOT EXISTS for all 9 tables
│   │   │   └── seed.js             # Dev seed: 1 admin, 5 creators, 3 businesses…
│   │   ├── middleware/
│   │   │   ├── auth.js             # requireAuth + requireAdmin JWT guards
│   │   │   ├── validate.js         # express-validator error interceptor
│   │   │   ├── rateLimiter.js      # Global 100/15min + auth 10/15min limiters
│   │   │   └── errorHandler.js     # Centralised 4-arg error middleware
│   │   ├── routes/
│   │   │   ├── auth.js             # POST /signup /login GET /me (creators)
│   │   │   ├── businessAuth.js     # POST /signup /login GET /me (businesses)
│   │   │   ├── businessContent.js  # Business-scoped content management
│   │   │   ├── content.js          # Public feed + creator CRUD
│   │   │   ├── creators.js         # Creator profiles — list, slug, update
│   │   │   ├── opportunities.js    # Full CRUD — post & apply for opportunities
│   │   │   ├── applications.js     # Application lifecycle management
│   │   │   ├── follows.js          # Follow/unfollow + follower counts
│   │   │   ├── messages.js         # Creator↔business direct messaging
│   │   │   ├── notifications.js    # In-app notification delivery
│   │   │   ├── partners.js         # Featured partner management
│   │   │   ├── business-plan.js    # Business subscription plan endpoints
│   │   │   └── admin.js            # Admin mega-router (all /admin/* routes)
│   │   └── utils/
│   │       ├── jwt.js              # signToken + verifyToken
│   │       ├── auditLogger.js      # Fire-and-forget DB audit writer
│   │       ├── slugify.js          # URL-safe slug with collision suffix
│   │       ├── pagination.js       # Cursor/offset pagination helpers
│   │       ├── response.js         # Standardised success/error response shapes
│   │       └── mailer.js           # Nodemailer transactional email wrapper
│   ├── test/                       # Integration & smoke tests
│   ├── scripts/                    # DB migration & maintenance scripts
│   ├── .env.example                # All required env vars documented
│   ├── jest.config.js
│   ├── package.json
│   └── vercel.json
│
├── frontend/
│   ├── app/                        # Expo Router file-based screens
│   ├── components/                 # Shared UI components
│   ├── constants/                  # Colors, typography, spacing tokens
│   ├── hooks/                      # useAuth, useFeed, useOpportunities…
│   ├── lib/                        # Third-party client config (axios, etc.)
│   ├── services/                   # API service layer (one file per domain)
│   ├── store/                      # Zustand global stores
│   ├── utils/                      # Formatting, validation, date helpers
│   ├── assets/                     # Images, fonts, icons
│   ├── app.json                    # Expo config
│   ├── babel.config.js
│   ├── package.json
│   └── tsconfig.json
│
├── admin-panel/
│   ├── index.html                  # Full SPA — login, dashboard, moderation, audit
│   ├── server.js                   # Tiny Node.js static server on :3012
│   └── package.json
│
├── docs/                           # Architecture diagrams & API docs
├── .github/
│   ├── workflows/                  # CI/CD pipelines
│   ├── ISSUE_TEMPLATE/             # Bug report & feature request templates
│   └── pull_request_template.md
├── .editorconfig
├── .gitignore
├── CHANGELOG.md
├── CONTRIBUTING.md
├── SECURITY.md
├── start-all.sh                    # macOS/Linux: starts all 3 services
├── start-all.ps1                   # Windows PowerShell launcher
└── start-all.bat                   # Windows CMD launcher
```

---

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 15+ running locally (or a connection string to a hosted instance)
- Expo CLI: `npm install -g expo-cli`

### Option A — Start Everything at Once

**macOS / Linux**
```bash
chmod +x start-all.sh && ./start-all.sh
```

**Windows PowerShell**
```powershell
.\start-all.ps1
```

**Windows CMD**
```bat
start-all.bat
```

### Option B — Manual (per service)

**1. Backend**
```bash
cd backend
cp .env.example .env          # Fill in your values
npm install
npm run dev                   # Starts on :3011 with nodemon
```

**2. Admin Panel**
```bash
cd admin-panel
npm install
npm start                     # Starts on :3012
```

**3. Frontend (Expo)**
```bash
cd frontend
cp .env.example .env          # Set EXPO_PUBLIC_API_BASE_URL
npm install
npx expo start                # Scan QR with Expo Go
```

---

## Environment Variables

### `backend/.env`

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | Long random string for signing tokens |
| `JWT_EXPIRES_IN` | ✅ | e.g. `7d` |
| `PORT` | ✅ | Backend port (default `3011`) |
| `NODE_ENV` | ✅ | `development` or `production` |
| `ADMIN_EMAIL` | ✅ | Seed admin account email |
| `ADMIN_PASSWORD` | ✅ | Seed admin account password |
| `SMTP_HOST` | ☑️ | Mailer SMTP host |
| `SMTP_PORT` | ☑️ | Mailer SMTP port |
| `SMTP_USER` | ☑️ | Mailer SMTP user |
| `SMTP_PASS` | ☑️ | Mailer SMTP password |
| `SMTP_FROM` | ☑️ | From address e.g. `noreply@plxyground.com` |
| `CORS_ORIGIN` | ☑️ | Allowed origin(s) for CORS |
| `RATE_LIMIT_WINDOW_MS` | ☑️ | Rate limit window in ms (default `900000`) |
| `RATE_LIMIT_MAX` | ☑️ | Max requests per window (default `100`) |

> ⚠️ The server **throws and exits** on startup if any `Required` variable is missing.

### `frontend/.env`

| Variable | Required | Description |
|---|---|---|
| `EXPO_PUBLIC_API_BASE_URL` | ✅ | Full backend URL e.g. `http://localhost:3011` |
| `EXPO_PUBLIC_APP_NAME` | ☑️ | App display name override |
| `EXPO_PUBLIC_SENTRY_DSN` | ☑️ | Sentry DSN for crash reporting |

---

## Database Schema

All tables are created automatically on startup via `db/setup.js`.

| Table | Purpose |
|---|---|
| `users` | Creator accounts — email, password hash, bio, sport, avatar, slug |
| `businesses` | Business accounts — name, email, password hash, industry, plan |
| `content` | Creator posts — type (video/image/text), body, media URL, likes, status |
| `opportunities` | Job/collab listings posted by businesses |
| `applications` | Creator applications to opportunities |
| `follows` | Creator→creator follow graph |
| `messages` | Direct message threads between creators & businesses |
| `notifications` | In-app notification queue per user |
| `audit_log` | Admin action audit trail — actor, action, target, IP, timestamp |

---

## API Reference

Base URL: `http://localhost:3011`

### 🔓 Public

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/healthz` | Service health check |
| `POST` | `/api/auth/signup` | Creator registration |
| `POST` | `/api/auth/login` | Creator login → JWT |
| `POST` | `/api/business/auth/signup` | Business registration |
| `POST` | `/api/business/auth/login` | Business login → JWT |
| `GET` | `/api/content` | Public content feed (paginated) |
| `GET` | `/api/content/:id` | Single content post |
| `GET` | `/api/creators` | Creator directory (paginated) |
| `GET` | `/api/creators/:slug` | Creator public profile by slug |
| `GET` | `/api/opportunities` | Browse open opportunities |

### 🔐 Creator (JWT required)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/auth/me` | Current creator profile |
| `PUT` | `/api/auth/me` | Update profile |
| `POST` | `/api/content` | Create content post |
| `PUT` | `/api/content/:id` | Update own content |
| `DELETE` | `/api/content/:id` | Delete own content |
| `POST` | `/api/opportunities/:id/apply` | Apply to opportunity |
| `GET` | `/api/applications` | My applications |
| `POST` | `/api/follows/:creatorId` | Follow a creator |
| `DELETE` | `/api/follows/:creatorId` | Unfollow a creator |
| `GET` | `/api/messages` | Message threads |
| `POST` | `/api/messages/:threadId` | Send message |
| `GET` | `/api/notifications` | My notifications |
| `PUT` | `/api/notifications/:id/read` | Mark notification read |

### 🏢 Business (JWT required)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/business/auth/me` | Current business profile |
| `PUT` | `/api/business/auth/me` | Update business profile |
| `POST` | `/api/opportunities` | Create opportunity listing |
| `PUT` | `/api/opportunities/:id` | Update own opportunity |
| `DELETE` | `/api/opportunities/:id` | Delete own opportunity |
| `GET` | `/api/opportunities/:id/applications` | Applications for listing |
| `PUT` | `/api/applications/:id/status` | Accept / reject application |
| `GET` | `/api/business/content` | My content library |
| `POST` | `/api/business/content` | Upload business content |
| `GET` | `/api/partners` | Featured partners list |
| `GET` | `/api/business-plan` | Current subscription plan |

### 🛡️ Admin (Admin JWT required)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/admin/auth/login` | Admin login |
| `GET` | `/api/admin/dashboard` | KPI stats |
| `GET` | `/api/admin/queue` | Moderation queue |
| `PUT` | `/api/admin/queue/:id/approve` | Approve content |
| `PUT` | `/api/admin/queue/:id/reject` | Reject content |
| `GET` | `/api/admin/users` | All users paginated |
| `PUT` | `/api/admin/users/:id/suspend` | Suspend user |
| `PUT` | `/api/admin/users/:id/reactivate` | Reactivate user |
| `GET` | `/api/admin/content` | All content with filters |
| `DELETE` | `/api/admin/content/:id` | Hard delete content |
| `GET` | `/api/admin/analytics` | Engagement analytics |
| `GET` | `/api/admin/audit` | Audit log (paginated) |

---

## Admin Panel

Access at `http://localhost:3012`. Login with your `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

| Section | Description |
|---|---|
| **Dashboard** | Live KPIs — total users, content, revenue, pending moderation count |
| **Moderation Queue** | Review, approve, or reject flagged content with bulk actions |
| **Content** | Browse all content with search, filter by type/status, hard delete |
| **Users** | View all creators & businesses, suspend or reactivate accounts |
| **Audit Log** | Full action history with actor, IP, timestamp — exportable as JSON |
| **Settings** | Change admin password |

---

## Frontend Design System

All tokens live in `frontend/constants/`.

| Token | Value | Usage |
|---|---|---|
| `--orange` | `#FF6B00` | Primary brand accent |
| `--black` | `#0A0A0A` | Background / surfaces |
| `--white` | `#FFFFFF` | Primary text |
| `--grey-dark` | `#1A1A1A` | Card backgrounds |
| `--grey-mid` | `#2A2A2A` | Input backgrounds |
| `--grey-light` | `#888888` | Muted / placeholder text |
| `--font-display` | `Bebas Neue` | Display headings |
| `--font-body` | `Inter` | Body copy & UI |

---

## Testing

```bash
# Backend unit tests
cd backend && npm test

# Backend tests with coverage
cd backend && npm run test:coverage

# Smoke test (check all 3 services are up)
curl http://localhost:3011/healthz
curl http://localhost:3012
```

Tests live in `backend/src/__tests__/` and `backend/test/`.

---

## Deployment

### Backend (Railway / Render)

```bash
# Set all env vars in your platform dashboard, then:
npm start
```

The `backend/vercel.json` is provided for Vercel serverless deployments.

### Frontend (EAS Build)

```bash
npm install -g eas-cli
eas build --platform ios     # or android / all
eas submit                   # Push to App Store / Play Store
```

> 🔑 Set `EXPO_PUBLIC_API_BASE_URL` to your production backend URL before building.

### Admin Panel

Deploy `admin-panel/` as a static site on Netlify, Vercel, or Render. No build step required.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full guide.

**Absolute rules (enforced in review):**
- ❌ No `TODO` comments in committed code — open a GitHub Issue instead
- ❌ No `console.log` — use the `logger` utility
- ❌ No string interpolation in SQL — parameterised queries only
- ❌ No async Express handler without `try/catch`
- ❌ No `any` TypeScript type in frontend code
- ✅ Every new endpoint needs a unit test
- ✅ All API responses use the `response.js` helper shape

---

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for the full version history.

---

## Security

See [SECURITY.md](SECURITY.md) for the vulnerability disclosure policy.

---

## License

MIT — see [LICENSE](LICENSE) for details.

---

<p align="center">Built with 🏀 by <a href="https://basketballnxtion.com">Basketball Nxtion</a></p>
