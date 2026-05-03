# PLXYGROUND

> A sports creator platform connecting athletes, creators and businesses in one unified mobile-first ecosystem.

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://plxyground.vercel.app/)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue)](#license)

---

## What is Plxyground?

Plxyground is a full-stack mobile-first platform where sports creators can build an audience, post content and connect with businesses for sponsorship opportunities. Businesses get a dedicated portal to publish opportunities and manage partnerships. Admins have a moderation dashboard to review content before it goes live.

---

## Project Structure

```
plxyground/
├── backend/          Node.js 20 + Express 5 REST API
├── frontend/         Expo / React Native mobile app
└── admin-panel/      Moderation & analytics dashboard
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| **API** | Node.js 20 · Express 5 · SQLite (`better-sqlite3`) · JWT |
| **Mobile** | Expo SDK 54 · React Native 0.76 · Expo Router v4 · Zustand |
| **Admin** | Vanilla HTML · CSS · JavaScript |
| **Auth** | JWT · `expo-secure-store` (native) · `localStorage` (web) |
| **Moderation** | Content queue — all posts reviewed before publishing |

---

## Getting Started

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

### Manual setup

**Terminal 1 — Backend**
```bash
cd backend
npm install
cp .env.example .env   # set JWT_SECRET
npm run dev            # http://localhost:3011
```

**Terminal 2 — Frontend**
```bash
cd frontend
npm install
cp .env.example .env
npx expo start         # press w for web, a for Android, i for iOS
```

**Terminal 3 — Admin Panel**
```bash
cd admin-panel
npm install
node server.js         # http://localhost:3012
```

> **Testing on a physical device?** Set `EXPO_PUBLIC_API_URL` in `frontend/.env` to your machine's local IP — e.g. `http://192.168.1.x:3011` — instead of `localhost`.

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

## API Reference

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

## Architecture Highlights

- **Secure auth** — JWT tokens stored in `expo-secure-store` on native, with a `localStorage` shim on web. Never `AsyncStorage`.
- **SQLite with WAL mode** — single `.db` file via `better-sqlite3`, foreign keys enforced, optimised for low-latency reads.
- **Content moderation queue** — every creator and business post goes through admin review before it is published to the feed.
- **Full audit log** — every admin action is recorded with actor, target, IP address and action metadata.
- **Role-based access** — separate auth flows and protected routes for creators, businesses and admins.

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
