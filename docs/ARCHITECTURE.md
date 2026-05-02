# PLXYGROUND — Architecture Overview

## System Map

```
┌─────────────────────────────────────────────────────────────┐
│                        PLXYGROUND                           │
├──────────────┬──────────────────────┬───────────────────────┤
│  Mobile App  │    REST API Backend  │     Admin Panel       │
│  (Expo/RN)   │  (Node/Express/PG)   │  (Vanilla HTML/JS)    │
│  :8081       │        :3001         │        :3012          │
└──────┬───────┴──────────┬───────────┴───────────┬───────────┘
       │                  │                       │
       └──────────────────┼───────────────────────┘
                          │
                   PostgreSQL :5432
```

## Services

| Service | Stack | Port | Purpose |
|---------|-------|------|---------|
| `backend` | Node 20, Express 4, pg, bcrypt, JWT | 3001 | REST API — all business logic |
| `frontend` | Expo SDK 52, React Native, Zustand, Axios | 8081 | Creator & business mobile app |
| `admin-panel` | Vanilla HTML/CSS/JS, Node http-server | 3012 | Internal moderation SPA |

## Request Flow

```
Mobile App
  → axios (services/api.js)
  → JWT Bearer header
  → Express router
  → middleware: helmet → cors → rateLimit → requireAuth → validate
  → route handler
  → pg.Pool (parameterised query)
  → PostgreSQL
  → JSON response { success, data, meta? }
```

## Auth Flow

```
POST /api/auth/signup  →  bcrypt.hash(password, 12)  →  INSERT user
POST /api/auth/login   →  bcrypt.compare  →  jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })

Protected request:
  Authorization: Bearer <token>
  → jwt.verify(token, JWT_SECRET)
  → req.user = { id, role }
  → handler

Admin request:
  Authorization: Bearer <adminToken>
  → jwt.verify(token, ADMIN_JWT_SECRET)
  → req.admin = { id, role }
```

## Database Schema (ERD summary)

```
users ──────────< content
users ──────────< applications >──────── opportunities <──── businesses
users ──────────< follows >──────────── users
users ──────────< notifications
users/businesses < messages >──────────  users/businesses
admins ──────────< audit_log
```

## Directory Structure

```
plxyground/
├── backend/
│   └── src/
│       ├── config.js          # env validation with startup throw
│       ├── logger.js          # timestamped structured logger
│       ├── app.js             # Express app setup (no listen)
│       ├── index.js           # Server entry (listen + startup)
│       ├── config/env.js
│       ├── db/
│       │   ├── client.js      # singleton pg.Pool
│       │   ├── setup.js       # CREATE TABLE IF NOT EXISTS
│       │   ├── seed.js        # dev seed data
│       │   ├── migrate.js     # sequential migration runner
│       │   ├── schema.sql     # canonical schema reference
│       │   └── migrations/    # numbered SQL migration files
│       ├── middleware/
│       │   ├── auth.js        # requireAuth + requireAdmin
│       │   ├── validate.js    # express-validator error handler
│       │   ├── rateLimiter.js # global + auth rate limiters
│       │   └── errorHandler.js # global Express error handler
│       ├── routes/            # all API route files
│       └── utils/
│           ├── jwt.js
│           ├── slugify.js
│           ├── auditLogger.js
│           ├── response.js    # standardised { success, data } helpers
│           └── pagination.js  # parsePagination + buildMeta
├── frontend/
│   ├── app/                   # Expo Router screens
│   ├── components/
│   │   ├── ui/                # Button, Input, Card, Avatar, Badge…
│   │   ├── feed/              # FeedHeader, FeedFilter, PostCard
│   │   ├── layout/            # ScreenWrapper, SectionHeader, Divider
│   │   └── opportunities/     # OpportunityDetailCard, ApplyModal…
│   ├── constants/             # colors, typography, spacing
│   ├── hooks/                 # useAuth, useFeed, useOpportunities, useNotifications, useProfile
│   ├── services/              # api.js + service files per domain
│   └── store/                 # Zustand stores (auth, feed)
├── admin-panel/
│   ├── index.html             # full dark-theme SPA
│   ├── server.js              # tiny Node http-server
│   └── package.json
└── docs/
    ├── ARCHITECTURE.md        # this file
    ├── openapi.yaml           # OpenAPI 3.0 spec
    ├── security-audit.md
    ├── high-impact-features.md
    ├── release-checklist.md
    └── BLOCKERS.md
```

## Security Controls

| Control | Implementation |
|---------|---------------|
| Password hashing | bcrypt, rounds: 12 |
| Auth tokens | JWT, 7d expiry, HS256 |
| Admin tokens | Separate `ADMIN_JWT_SECRET` |
| SQL injection | Parameterised queries only — zero string interpolation |
| Rate limiting | 100 req/15min global; 10 req/15min on auth endpoints |
| Security headers | Helmet.js |
| CORS | Restricted to `CORS_ALLOWED_ORIGINS` |
| Audit trail | All admin actions logged to `audit_log` table |
| Automated scanning | Weekly `npm audit` via GitHub Actions |

## Adding a New Route

1. Create `backend/src/routes/myFeature.js`
2. Add validation rules using `express-validator`
3. Wrap all async logic in `try/catch` — no unhandled rejections
4. Use `response.js` helpers (`ok`, `created`, `notFound`, etc.)
5. Mount in `app.js`: `app.use('/api/my-feature', require('./routes/myFeature'))`
6. Add endpoint to `docs/openapi.yaml`
7. Write a test in `src/__tests__/`
