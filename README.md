# Plxyground

A platform connecting sports creators with businesses and opportunities.

## Architecture

| Layer | Tech |
|---|---|
| Backend API | Node.js 20 + Express 4 |
| Database | PostgreSQL 16 |
| Mobile App | Expo / React Native |
| Admin Panel | React (Vite) |

## Quick Start

### Backend

```bash
cd backend
npm install
cp .env.example .env   # fill in your DATABASE_URL and JWT_SECRET
node src/db/migrate.js # run migrations
npm run dev            # start dev server
```

### Tests

```bash
cd backend
npm test
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

GitHub Actions runs smoke tests on every push to `main` or `develop` that touches `backend/`. Tests run against a real PostgreSQL 16 instance.

## Environment Variables

See `backend/.env.example` for all required variables.
