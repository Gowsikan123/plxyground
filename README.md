# PLXYGROUND

PLXYGROUND is a monorepo for a sports creator platform with three runtime surfaces: an Express API, an Expo mobile app, and a static admin panel.

## Repository Layout

| Directory | Purpose |
|---|---|
| `backend` | Express API + PostgreSQL — auth, moderation, admin tooling |
| `frontend` | Expo mobile app (creator and business flows) |
| `admin-panel` | Static HTML/CSS/JS admin UI served by Node |
| `docs` | Project documentation |

## Tech Stack

- **Runtime:** Node.js 22
- **API:** Express 5, JWT auth, helmet, cors, express-rate-limit
- **Database:** PostgreSQL 16 (pg driver)
- **Mobile:** Expo 54, React Native 0.76, Expo Router v3
- **Admin UI:** Vanilla HTML/CSS/JS
- **CI:** GitHub Actions + Jest smoke tests

## Quick Start

### 1. Clone

```bash
git clone https://github.com/Gowsikan123/plxyground.git
cd plxyground
```

### 2. Environment setup

```bash
cp backend/.env.example backend/.env
```

Backend env vars (`backend/.env`):

| Key | Purpose | Example |
|---|---|---|
| `PORT` | API port | `3011` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/plxyground` |
| `JWT_SECRET` | JWT signing secret (32+ chars) | `replace_me_with_32+_chars` |
| `JWT_EXPIRES_IN` | Token TTL | `7d` |
| `CORS_ORIGIN` | Allowed origins (comma-separated) | `http://localhost:19006,http://localhost:3012` |
| `NODE_ENV` | Runtime mode | `development` |

Frontend env (`frontend/.env`):

| Key | Purpose | Example |
|---|---|---|
| `EXPO_PUBLIC_API_BASE_URL` | API base URL | `http://localhost:3011` |

### 3. Start services

**Windows (PowerShell):**
```powershell
./start-all.ps1
```

**Linux / macOS / WSL:**
```bash
./start-all.sh
```

Or start individually:

```bash
# API
cd backend && npm install && npm run start

# Admin panel
cd admin-panel && npm install && npm run start

# Expo app
cd frontend && npm install && npm run start
```

## Default Ports

| Service | URL |
|---|---|
| API | `http://localhost:3011` |
| Admin panel | `http://localhost:3012` |
| Expo dev server | `http://localhost:19006` |

## Seed Data

Run once to populate the database:

```bash
cd backend && npm run seed
```

Default credentials after seeding:

| Account | Email | Password |
|---|---|---|
| Admin | `admin@plxyground.local` | `Internet2026@` |
| Creator / Business | *(seeded accounts)* | `Password1!` |

## Scripts

### backend

| Script | Description |
|---|---|
| `npm run start` | Start API server |
| `npm run dev` | Start with --watch |
| `npm run seed` | Seed database with sample data |
| `npm run smoke` | Run smoke test suite |

### frontend

| Script | Description |
|---|---|
| `npm run start` | Expo dev server |
| `npm run android` | Android build |
| `npm run ios` | iOS build |
| `npm run web` | Web build |

### admin-panel

| Script | Description |
|---|---|
| `npm run start` | Serve admin UI on port 3012 |

## API Endpoints

### Health
- `GET /healthz` — health check
- `GET /` — API info

### Creator Auth (`/api/auth`)
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Business Auth (`/api/business`)
- `POST /api/business/auth/signup`
- `POST /api/business/auth/login`
- `GET /api/business/auth/me`

### Business Content (`/api/business/content`)
- `POST /api/business/content`
- `GET /api/business/content/mine`
- `PUT /api/business/content/:id`

### Public Content (`/api/content`)
- `GET /api/content`
- `GET /api/content/:id`
- `POST /api/content`
- `PUT /api/content/:id`
- `DELETE /api/content/:id`

### Creators (`/api/creators`)
- `GET /api/creators`
- `GET /api/creators/:id`
- `GET /api/creators/slug/:slug`
- `PUT /api/creators/:id`

### Opportunities (`/api/opportunities`)
- `GET /api/opportunities`
- `GET /api/opportunities/:id`
- `POST /api/opportunities`
- `PUT /api/opportunities/:id`
- `DELETE /api/opportunities/:id`

### Admin (`/api/admin`)
- `POST /api/admin/auth/login`
- `POST /api/admin/auth/change-password`
- `GET /api/admin/queue`
- `POST /api/admin/queue/bulk-action`
- `GET /api/admin/content`
- `PUT /api/admin/content/:id`
- `DELETE /api/admin/content/:id`
- `GET /api/admin/users`
- `POST /api/admin/users/:id/suspend`
- `POST /api/admin/users/:id/reactivate`
- `PUT /api/admin/users/:id/role`
- `GET /api/admin/analytics`
- `GET /api/admin/alerts`
- `GET /api/admin/audit`
- `GET /api/admin/audit/export`

## Architecture

- API boots in `backend/src/index.js`, mounts all route modules, applies security middleware
- PostgreSQL schema is defined and auto-created in `backend/src/db/setup.js`
- Expo app uses file-based routing via `expo-router` v3
- Admin panel is a single static page in `admin-panel/index.html` that calls the API via `fetch`
- JWT tokens issued on login/signup — clients send `Authorization: Bearer <token>`

## CI

Every push to `main` runs the backend smoke suite via `.github/workflows/smoke.yml` against a real Postgres 16 instance.

## Context

Built for: Basketball Nxtion (UK sports-tech startup)
Developer: Gowi (placement student, T Level Digital)
Platform target: iOS App Store + Google Play Store
Backend deploy target: Railway or Render
Database: PostgreSQL 16 (hosted on Railway/Supabase/Neon)
