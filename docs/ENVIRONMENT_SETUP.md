# Environment Setup Guide

Step-by-step guide to get PLXYGROUND running locally from scratch.

## Prerequisites

| Tool | Version | Install |
|------|---------|--------|
| Node.js | 20+ | [nodejs.org](https://nodejs.org) |
| npm | 10+ | Bundled with Node |
| PostgreSQL | 14+ | [postgresql.org](https://postgresql.org) |
| Expo CLI | latest | `npm install -g expo-cli` |
| Git | any | [git-scm.com](https://git-scm.com) |

## 1. Clone the repo

```bash
git clone https://github.com/Gowsikan123/plxyground.git
cd plxyground
```

## 2. Set up PostgreSQL

```bash
# macOS (Homebrew)
brew install postgresql@16
brew services start postgresql@16

# Ubuntu/Debian
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql

# Windows — download installer from postgresql.org
```

Create the database:
```bash
psql -U postgres
CREATE USER plxyground WITH PASSWORD 'plxyground';
CREATE DATABASE plxyground OWNER plxyground;
\q
```

## 3. Configure environment variables

```bash
# Backend
cd backend
cp .env.example .env
# Edit .env with your DATABASE_URL and JWT secrets

# Frontend
cd ../frontend
cp .env.example .env
# Edit .env with EXPO_PUBLIC_API_BASE_URL
```

## 4. Install dependencies

```bash
# From repo root
cd backend && npm install
cd ../frontend && npm install
cd ../admin-panel && npm install
```

## 5. Run migrations and seed

```bash
cd backend
node src/db/migrate.js
node src/db/seed.js
```

## 6. Start all services

**Windows (PowerShell):**
```powershell
.\start-all.ps1
```

**macOS/Linux:**
```bash
bash start-all.sh
```

**Or manually in separate terminals:**
```bash
# Terminal 1 — Backend API
cd backend && npm run dev

# Terminal 2 — Admin Panel
cd admin-panel && npm start

# Terminal 3 — Mobile Frontend
cd frontend && npx expo start
```

## 7. Verify everything is running

| Service | URL | Expected |
|---------|-----|----------|
| Backend health | http://localhost:3001/healthz | `{ ok: true }` |
| Admin panel | http://localhost:3012 | Login page |
| Expo DevTools | http://localhost:8081 | QR code |

## Default seed credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@plxyground.com | `Admin123!` |
| Creator | creator1@plxyground.com | `Creator123!` |
| Business | business1@plxyground.com | `Business123!` |

> **⚠️ Change all seed passwords before deploying to production.**

## Troubleshooting

**`ECONNREFUSED` on port 5432** — PostgreSQL is not running. Start it with the commands above.

**`JWT_SECRET must be at least 32 characters`** — your `.env` has a placeholder. Set a real secret.

**Expo: `Network request failed`** — ensure `EXPO_PUBLIC_API_BASE_URL` points to your machine's local IP, not `localhost`, when testing on a physical device.

**Port already in use** — check for existing processes: `lsof -i :3001` (Mac/Linux) or `netstat -ano | findstr :3001` (Windows).
