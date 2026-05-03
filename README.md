# PLXYGROUND

A sports creator platform connecting athletes, creators and businesses in one unified mobile-first ecosystem.

## Services

| Service | Tech | Port |
|---|---|---|
| `backend/` | Node.js + Express 5 + SQLite (better-sqlite3) + JWT | 3011 |
| `frontend/` | Expo SDK 54 + React Native 0.76 + Expo Router v4 | 19006 |
| `admin-panel/` | Vanilla HTML + CSS + JS, served by Node http-server | 3012 |

## Quick Start

### Prerequisites
- Node.js 20+ (LTS)
- npm 10+
- Expo CLI: `npm install -g expo-cli`

### macOS / Linux
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
bash start-all.sh
```

### Windows (PowerShell)
```powershell
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env
.\start-all.ps1
```

## Backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

API available at `http://localhost:3011`
Health check: `GET /healthz`

### Default seed credentials

**Admin:** `admin@plxyground.local` / `Internet2026@`

**Creators (all):** password `Password1!`
- `jayden@example.com` — Jayden Carter (Basketball)
- `emma@example.com` — Emma Singh (Athletics)
- `kai@example.com` — Kai Thompson (Football)
- `sara@example.com` — Sara Okafor (Tennis)
- `leo@example.com` — Leo Martinez (Boxing)

**Businesses (all):** password `Password1!`
- `contact@peakgear.com` — Peak Gear
- `hello@fuelup.io` — FuelUp Nutrition
- `partnerships@sportsmedia.co` — Sports Media Co

## Frontend

```bash
cd frontend
npm install
cp .env.example .env
npx expo start
```

## Admin Panel

```bash
cd admin-panel
npm install
node server.js
```

Admin panel at `http://localhost:3012`

## Environment Variables

See `backend/.env.example` and `frontend/.env.example` for all required variables.

## Architecture

- **Auth:** JWT tokens stored in `expo-secure-store` (mobile) — never AsyncStorage
- **Database:** SQLite via `better-sqlite3` — single file, WAL mode, foreign keys enabled
- **Moderation:** All creator and business content enters a moderation queue before publishing
- **Audit log:** Every admin action is recorded with actor, target, IP and metadata

## API Routes

| Group | Base path |
|---|---|
| Creator auth | `/api/auth` |
| Business auth + content | `/api/business` |
| Content feed | `/api/content` |
| Creators | `/api/creators` |
| Opportunities | `/api/opportunities` |
| Admin auth | `/api/admin/auth` |
| Admin queue | `/api/admin/queue` |
| Admin content | `/api/admin/content` |
| Admin users | `/api/admin/users` |
| Admin analytics | `/api/admin/analytics` |
| Admin audit | `/api/admin/audit` |

Full OpenAPI spec: `docs/openapi.yaml`

## License

MIT
