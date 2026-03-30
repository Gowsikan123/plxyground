# PLXYGROUND Smoke Test Report

Date: 2026-03-30 (Europe/London)
Scope: frontend (Expo app), backend API, admin panel
Report Type: Runtime (backend + admin panel automation); frontend mobile manual pending

## Summary
- Overall status: PASS for automated backend/admin coverage
- Backend API smoke suite: PASS (17/17 automated checks)
- Admin panel Playwright smoke: PASS (1/1 automated check)
- Frontend (Expo mobile): Not executed (still requires interactive device/emulator)

## Environment & Entry Points
- Backend: `backend` (Express) on `http://localhost:3011`
- Frontend: `frontend` (Expo Router)
- Admin Panel: `admin-panel` (static HTML via `node server.js`) on `http://localhost:3012`

## Setup Notes
- Backend env: `backend/.env`
  - `PORT=3011`
  - `DATABASE_URL=./plxyground.db`
  - `JWT_SECRET=...`
  - `CORS_ORIGIN=http://localhost:19006,http://localhost:3012,http://localhost:8081`
- Frontend env: `frontend/.env`
  - `EXPO_PUBLIC_API_BASE_URL=http://192.168.1.162:3011`
- Seed script: `backend/src/db/seed.js`
  - Admin: `admin@plxyground.local` / `Internet2026@`
  - Creators/Businesses: `Password1!`

## Automated Coverage

Backend smoke runner
- Command: `cd backend && npm run smoke`
- File: `backend/scripts/smoke.js`
- Coverage:
  - health and root endpoints
  - creator signup and login
  - business signup and login
  - public feed read
  - creator content creation
  - business content creation
  - business "my content" endpoint
  - admin unauthorized access guard
  - admin login
  - moderation queue bulk approve
  - approved content public visibility
  - admin analytics
  - admin alerts
  - admin panel availability

Admin panel web smoke
- Command: `cd admin-panel && npm run test:e2e`
- File: `admin-panel/tests/admin-panel.spec.js`
- Coverage:
  - login screen render
  - admin login success
  - queue landing view
  - alerts navigation and render

## Smoke Test Matrix (Remaining / Manual)

Backend API (core)
- ST-API-001 Health check `GET /healthz` -> `200` with `{status: "ok"}`
- ST-API-002 Root `GET /` -> `200` with `{name: "PLXYGROUND API"}`
- ST-API-003 Creator login `POST /api/auth/login` -> token + user
- ST-API-004 Creator signup `POST /api/auth/signup` -> token + user
- ST-API-005 Business login `POST /api/business/auth/login` -> token + user
- ST-API-006 Business signup `POST /api/business/auth/signup` -> token + user
- ST-API-007 Feed list `GET /api/content` -> published items
- ST-API-008 Content create `POST /api/content` -> 401 without token, 201 with token
- ST-API-009 Moderation queue `GET /api/admin/queue` -> 401 without admin token
- ST-API-010 Admin login `POST /api/admin/auth/login` -> token + user
- ST-API-011 Admin analytics `GET /api/admin/analytics` -> kpis + trend
- ST-API-012 Admin alerts `GET /api/admin/alerts` -> alerts list

Frontend (creator)
- ST-FE-001 Launch app -> landing (`/index`) renders
- ST-FE-002 Creator login (`/login`) -> feed redirect
- ST-FE-003 Creator signup (`/signup`) -> account created, feed redirect
- ST-FE-004 Feed (`/feed`) -> list loads, search works
- ST-FE-005 Post detail (`/post/[id]`) -> content renders
- ST-FE-006 Create content (`/create`) -> draft created, appears in profile
- ST-FE-007 Profile (`/profile`) -> user data loads
- ST-FE-008 Settings (`/settings`) -> logout works

Frontend (business)
- ST-FE-101 Business login (`/business-login`) -> dashboard redirect
- ST-FE-102 Business signup (`/business-signup`) -> account created, dashboard redirect
- ST-FE-103 Business dashboard -> stats + feed preview
- ST-FE-104 Create business post -> content pending moderation
- ST-FE-105 Opportunities -> list loads

Admin Panel
- ST-ADM-001 Launch admin panel -> login screen shows
- ST-ADM-002 Admin login -> queue renders
- ST-ADM-003 Queue bulk approve -> moves content to published
- ST-ADM-004 Content tab -> publish/unpublish works
- ST-ADM-005 Users tab -> suspend/reactivate
- ST-ADM-006 Audit export -> JSON download
- ST-ADM-007 Alerts tab -> recent activity list

## Findings From Runtime + Review
- FE-BUS-001: `frontend/app/business/create-post.jsx` mirrored the business profile screen instead of a post-creation flow (fixed on 2026-03-30).
- FE-BUS-002: `frontend/app/business/edit-profile.jsx` contained JSX and logic typos that prevented rendering (fixed on 2026-03-30).
- AUT-001: Admin navigation relied on the browser-global `event`, which is brittle in automation (fixed on 2026-03-30).
- API-001: Business content needed a dedicated authenticated endpoint for pending/self-service content management (fixed on 2026-03-30).
- ENV-001: Backend startup previously accepted missing critical env vars until downstream failures occurred (fixed on 2026-03-30).

## Execution Status
Backend API
- ST-API-001 Health check `GET /healthz` -> PASS
- ST-API-002 Root `GET /` -> PASS
- ST-API-003 Creator login `POST /api/auth/login` -> PASS
- ST-API-004 Creator signup `POST /api/auth/signup` -> PASS
- ST-API-005 Business login `POST /api/business/auth/login` -> PASS
- ST-API-006 Business signup `POST /api/business/auth/signup` -> PASS
- ST-API-007 Feed list `GET /api/content` -> PASS
- ST-API-008 Content create `POST /api/content` -> PASS
- ST-API-009 Moderation queue `GET /api/admin/queue` -> PASS (401 without admin token)
- ST-API-010 Admin login `POST /api/admin/auth/login` -> PASS
- ST-API-011 Admin analytics `GET /api/admin/analytics` -> PASS
- ST-API-012 Admin alerts `GET /api/admin/alerts` -> PASS
- ST-API-013 Business content create `POST /api/business/content` -> PASS
- ST-API-014 Business content mine `GET /api/business/content/mine` -> PASS
- ST-API-015 Approved business content public visibility -> PASS

Admin Panel
- ST-ADM-001 Launch admin panel -> PASS (200)
- ST-ADM-002 Admin login -> PASS (Playwright)
- ST-ADM-003 Queue bulk approve -> PASS
- ST-ADM-004 Content tab -> Not run
- ST-ADM-005 Users tab -> Not run
- ST-ADM-006 Audit export -> Not run
- ST-ADM-007 Alerts tab -> PASS (Playwright)

Frontend (Expo)
- All test cases: Not run (requires interactive device/emulator)

## Recommendations
- Fix signup screens to call `/api/auth/signup` and `/api/business/auth/signup` and collect required fields.
- Align admin alerts route so `GET /api/admin/alerts` returns alerts (either change mount in `backend/src/index.js` or move the alerts handler).
- Update `frontend/.env` for local API base if testing on this machine.

