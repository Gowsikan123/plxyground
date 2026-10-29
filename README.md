# PLXYGROUND

> A cross-platform mobile marketplace connecting sports brands with athletes and content creators. Built solo during an 18-month industry placement at Basketball Nxtion (Dec 2024 – Jun 2026).

![Status](https://img.shields.io/badge/status-in%20development-orange)
![Platform](https://img.shields.io/badge/platform-iOS%20%7C%20Android-blue)
![Stack](https://img.shields.io/badge/stack-Expo%20%7C%20Express%205%20%7C%20PostgreSQL-informational)
![Auth](https://img.shields.io/badge/auth-JWT%20%2B%20RBAC-green)
![CI](https://img.shields.io/badge/CI-GitHub%20Actions-yellow)

**Live API:** [plxyground.vercel.app](https://plxyground.vercel.app)

---

## What It Does

Brands post sponsorship opportunities; creators browse, apply and manage collaborations through one mobile app with separate brand and creator flows. Admins moderate submissions through a web dashboard.

I was the **sole developer**: API design, database schema, authentication, admin tooling, the React Native app, CI and deployment.

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Mobile app | Expo (React Native) | One codebase for iOS and Android |
| Backend API | Node.js + Express 5 | REST API with full control over middleware |
| Database | PostgreSQL on Neon (serverless) | Works with Vercel's serverless functions; migrated from SQLite |
| Auth | JWT + role-based access control | Creator, business and admin roles |
| Security | Helmet, CORS allow-list, rate limiting | Hardened public API |
| Admin panel | HTML + vanilla JavaScript | Lightweight moderation dashboard |
| Testing | Supertest (API), Playwright (admin E2E) | Auth, content, opportunities and admin login journeys |
| CI | GitHub Actions | Lint, migration and test workflows across backend, app and admin panel |
| Hosting | Vercel | API and admin panel |

---

## Architecture

```
┌──────────────────────────────┐
│   Expo React Native app      │
│  (Brand flow | Creator flow) │
└──────────────┬───────────────┘
               │ REST + JWT
┌──────────────▼───────────────┐      ┌──────────────────┐
│   Node.js / Express 5 API    │◄─────┤   Admin panel    │
│   (Vercel serverless)        │      │   (Vercel)       │
└──────────────┬───────────────┘      └──────────────────┘
               │
┌──────────────▼───────────────┐
│  PostgreSQL (Neon) — 14 tables│
└──────────────────────────────┘
```

API reference: [`docs/openapi.yaml`](docs/openapi.yaml) · Design notes: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)

---

## Key Features

- **Dual role system**: separate brand and creator onboarding, dashboards and navigation
- **JWT auth + RBAC**: role middleware on every protected route
- **Opportunities and applications**: brands create listings; creators browse and apply
- **Moderation pipeline**: submission → admin review queue → bulk approve / reject / delete, with a timestamped audit log
- **Automated tests**: Supertest API tests and Playwright end-to-end tests for the admin panel

---

## Local Setup

**Prerequisites:** Node.js 20+, a Postgres database (a free [Neon](https://neon.tech) project works), Expo Go on your phone.

### 1. Backend
```bash
cd backend
npm install
cp .env.example .env        # then fill in the values
npm run migrate
npm run dev                 # API on http://localhost:3011
```

### 2. Admin panel
```bash
cd admin-panel
npm install
npm start                   # dashboard on http://localhost:3012
```

### 3. Mobile app
```bash
cd frontend
npm install
cp .env.example .env        # set EXPO_PUBLIC_API_URL to your machine's LAN IP
npx expo start              # scan the QR code with Expo Go
```

### Creating an admin account
Admin credentials are never stored in code. Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` (12+ characters) in `backend/.env.local`, then run:
```bash
node scripts/seed-admin.js
```

---

## Project Context

PLXYGROUND was built during my T Level industry placement in Digital Production, Design and Development. Basketball Nxtion brought me on as their only developer to take it from concept to a working product. There was no senior developer or existing codebase, so every architectural decision was mine, including the move from SQLite to serverless Postgres for deployment.

---

## Roadmap

- [ ] Push notifications (Expo Notifications)
- [ ] In-app messaging between brands and creators
- [ ] Analytics dashboard for brands
- [ ] App Store / Google Play release
