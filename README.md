# PLXYGROUND

> A cross-platform mobile marketplace connecting brands with content creators — built solo as part of an industry placement at Basketball Nxtion.

![Status](https://img.shields.io/badge/status-in%20development-orange)
![Platform](https://img.shields.io/badge/platform-iOS%20%7C%20Android-blue)
![Stack](https://img.shields.io/badge/stack-Expo%20%7C%20Node.js%20%7C%20SQLite-informational)
![Auth](https://img.shields.io/badge/auth-JWT%20%2B%20RBAC-green)
![CI](https://img.shields.io/badge/CI-GitHub%20Actions-yellow)

---

## What It Does

PLXYGROUND is a sports-tech platform that bridges the gap between brands and content creators. Brands post sponsorship opportunities; creators browse, apply, and manage collaborations — all through a unified mobile app with role-specific flows.

I am the **sole developer** on this project, responsible for the full stack: API design, database schema, authentication system, admin tooling, and React Native frontend.

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Mobile Frontend | Expo React Native | Cross-platform iOS & Android from a single codebase |
| Backend API | Node.js + Express | Lightweight, fast REST API with full control |
| Database | SQLite | Zero-config relational store, ideal for early-stage product |
| Auth | JWT + RBAC | Stateless tokens with role-based access (Brand / Creator / Admin) |
| Admin Panel | HTML + Vanilla JS | Lightweight web dashboard on a dedicated port |
| Testing | Playwright | End-to-end test automation |
| CI/CD | GitHub Actions | Automated test runs on every push |
| Deployment | Vercel | Backend hosting |

---

## Architecture Overview

```
┌─────────────────────────────────────────┐
│           Expo React Native App          │
│     (Brand flow  |  Creator flow)        │
└────────────────────┬────────────────────┘
                     │ REST (JWT)
┌────────────────────▼────────────────────┐
│         Node.js / Express API           │
│              Port 3011                  │
│  Auth · Opportunities · Applications   │
└──────────┬─────────────────┬────────────┘
           │                 │
    ┌──────▼──────┐   ┌──────▼──────┐
    │   SQLite DB  │   │ Admin Panel │
    │              │   │  Port 3012  │
    └─────────────┘   └─────────────┘
```

---

## Key Features

- **Dual role system** — separate Brand and Creator onboarding, dashboards, and navigation flows
- **JWT authentication** — secure stateless auth with role-based middleware protecting all routes
- **Opportunities management** — brands create/edit sponsorship listings; creators browse and apply
- **Admin panel** — standalone web dashboard for platform management and seed data
- **Playwright E2E tests** — automated test suite covering critical user journeys
- **GitHub Actions CI** — tests run automatically on every push to main

---

## Local Setup

### Prerequisites
- Node.js 18+
- Expo CLI (`npm install -g expo`)
- Expo Go app on your phone (for mobile testing)

### Backend
```bash
cd backend
npm install
npm run dev        # API on http://localhost:3011
```

### Admin Panel
```bash
cd admin
npm install
npm start          # Dashboard on http://localhost:3012
```

### Mobile App
```bash
cd mobile
npm install
npx expo start
# Scan QR code with Expo Go on your iPhone/Android
```

### Environment Variables
Create a `.env` file in `/backend`:
```env
JWT_SECRET=your_secret_here
PORT=3011
```

---

## Project Context

This app is being built during my **industry placement year** as part of a T Level in Digital Production, Design and Development. Basketball Nxtion brought me on as their sole developer to take PLXYGROUND from concept to working product.

The project has involved making real architectural decisions under real constraints — no senior developer to defer to, no existing codebase to extend.

---

## Roadmap

- [ ] Push notifications (Expo Notifications)
- [ ] In-app messaging between brands and creators
- [ ] Analytics dashboard for brands
- [ ] App Store / Google Play deployment

---

## Author

**Gowsikan** — T Level student & placement developer at Basketball Nxtion  
[GitHub](https://github.com/Gowsikan123)