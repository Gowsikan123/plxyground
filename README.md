# PLXYGROUND

> A sports creator platform connecting athletes, creators and businesses in one unified mobile-first ecosystem.

---

## Project Structure

```
plxyground/
├── backend/          Node.js + Express 5 API (port 3011)
├── frontend/         Expo / React Native mobile app (port 19006)
└── admin-panel/      Vanilla HTML/CSS/JS moderation dashboard (port 3012)
```

## Tech Stack

| Service | Stack | Port |
|---|---|---|
| `backend/` | Node.js 20 · Express 5 · SQLite (better-sqlite3) · JWT | 3011 |
| `frontend/` | Expo SDK 54 · React Native 0.76 · Expo Router v4 | 19006 |
| `admin-panel/` | Vanilla HTML + CSS + JS · Node http-server | 3012 |

---

## Quick Start

### Prerequisites

- Node.js 20+ (LTS)
- npm 10+
- Expo CLI: `npm install -g expo-cli`

### One-command start

**macOS / Linux**
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
bash start-all.sh
```

**Windows (PowerShell)**
```powershell
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env
.\start-all.ps1
```

---

## Services

### Backend (Terminal 1)

```bash
cd backend
npm install
cp .env.example .env   # fill in JWT_SECRET at minimum
npm run dev
```

- API: `http://localhost:3011`
- Health check: `GET /healthz`

### Frontend (Terminal 2)

```bash
cd frontend
npm install
cp .env.example .env
npx expo start
```

Scan the QR code with **Expo Go** on your phone, or press `w` for browser, `a` for Android emulator, `i` for iOS simulator.

### Admin Panel (Terminal 3)

```bash
cd admin-panel
npm install
node server.js
```

- Dashboard: `http://localhost:3012`
- Log in with the admin seed credentials below.

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

## API Routes

| Group | Base path |
|---|---|
| Creator auth | `/api/auth` |
| Business auth + content | `/api/business` |
| Content feed | `/api/content` |
| Creators | `/api/creators` |
| Opportunities | `/api/opportunities` |
| Admin auth | `/api/admin/auth` |
| Admin moderation queue | `/api/admin/queue` |
| Admin content | `/api/admin/content` |
| Admin users | `/api/admin/users` |
| Admin analytics | `/api/admin/analytics` |
| Admin audit log | `/api/admin/audit` |

Full OpenAPI spec: [`docs/openapi.yaml`](./docs/openapi.yaml)

---

## Architecture

- **Auth:** JWT tokens stored in `expo-secure-store` on mobile — never `AsyncStorage`
- **Database:** SQLite via `better-sqlite3` — single `.db` file, WAL mode, foreign keys enabled
- **Moderation:** All creator and business content enters a moderation queue before publishing
- **Audit log:** Every admin action is recorded with actor, target, IP and metadata

---

## Environment Variables

Copy the example files and fill in your secrets before starting:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

See each `.env.example` for all required variables (JWT_SECRET, API_URL, etc.).

---

## Known Issues (as of May 2026)

> These were identified during a full repository audit.

### 🔴 High Priority
- **`AuthContext.jsx` uses `AsyncStorage` for token storage** — the README and architecture notes specify `expo-secure-store`, but the implementation uses `AsyncStorage`. This is a security regression; tokens should be migrated to `expo-secure-store`.

### 🟡 Medium Priority
- **No `.env` validation on startup** — if `JWT_SECRET` is missing, the backend will silently use `undefined` as the secret. Add a startup guard (e.g. with `envalid` or a simple throw).
- **`frontend/.env.example` API URL points to `localhost`** — this breaks on a physical device. Document that `EXPO_PUBLIC_API_URL` must be set to the machine's local IP (e.g. `http://192.168.x.x:3011`) when testing on a real phone.
- **`admin-panel/` has no authentication guard on static file routes** — the `server.js` serves all files without checking a session. Ensure admin login is enforced before any page renders.

### 🟢 Low Priority
- **`package-lock.json` committed for `backend/` but not `admin-panel/`** — add `admin-panel/package-lock.json` to version control for reproducible installs.
- **Empty `catch (e) {}` in `AuthContext.jsx`** — swallows storage errors silently; at minimum log to console in dev.

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
