# Plxyground

A platform connecting sports creators with businesses and opportunities.

## Architecture

| Layer | Tech |
|---|---|
| Backend API | Node.js 20 + Express 4 |
| Database | PostgreSQL 16 |
| Mobile App | Expo / React Native |
| Admin Panel | HTML + Node.js serve |

## Quick Start

### Option A — Start Everything at Once (Windows)

Open PowerShell and run:

```powershell
.\start-all.ps1
```

This opens three separate terminal windows for the backend, admin panel, and frontend.

Or use the batch file alternative:

```bat
start-all.bat
```

### Option B — Start Each Service Manually

#### Backend

```bash
cd backend
npm install
cp .env.example .env   # fill in your DATABASE_URL and JWT_SECRET
node src/db/migrate.js # run migrations
npm run dev            # starts on http://localhost:3011
```

#### Admin Panel

```bash
cd admin-panel
npm install
npm run start          # starts on http://localhost:3012
```

#### Frontend (Expo)

```bash
cd frontend
npm install
npm run start          # opens Expo DevTools → http://localhost:19006
```

### Tests

```bash
cd backend
npm test
```

To run the full integration smoke suite (requires the backend to be running):

```bash
node backend/scripts/smoke.js
```

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | /health | — | Health check |
| POST | /api/auth/signup | — | Creator signup |
| POST | /api/auth/login | — | Creator login |
| GET | /api/auth/me | Creator | Current user |
| POST | /api/business/auth/signup | — | Business signup |
| POST | /api/business/auth/login | — | Business login |
| GET | /api/creators | — | List creators |
| GET | /api/creators/:id | — | Get creator |
| GET | /api/content | — | List content |
| POST | /api/content | Creator | Create post |
| GET | /api/opportunities | — | List opportunities |
| POST | /api/opportunities | Auth | Create opportunity |
| POST | /api/applications | Creator | Apply to opportunity |
| POST | /api/follows/:id | Creator | Follow creator |
| GET | /api/messages/threads | Auth | Message threads |
| GET | /api/notifications | Auth | Notifications |
| GET | /api/admin/stats | Admin | Platform stats |

## CI

GitHub Actions CI is not yet configured. The smoke suite in `backend/scripts/smoke.js` can be run manually against a local environment (see Tests above).

## Environment Variables

See `backend/.env.example` for all required variables.
