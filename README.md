# PLXYGROUND

PLXYGROUND is a monorepo for a sports creator platform with three runtime surfaces: an Express API, an Expo mobile app, and a static admin panel.

**Repository Layout**
1. `backend` - Express API + PostgreSQL, auth, moderation, admin tooling.
2. `frontend` - Expo app (creator and business flows).
3. `admin-panel` - Static HTML/CSS/JS admin UI served by Node.
4. `docs` - Project documentation.

**Languages Used**
1. JavaScript (Node.js + React Native).
2. JSX (Expo Router screens, React components).
3. HTML (admin panel).
4. CSS (admin panel).
5. JSON (package manifests, Expo config).
6. Markdown (docs).

**Technology Stack**
1. Runtime: Node.js.
2. API: Express 5, JWT auth, helmet, cors, express-rate-limit.
3. Database: PostgreSQL (pg).
4. Mobile: Expo 54, React Native 0.76, Expo Router.
5. Admin UI: vanilla HTML/CSS/JS.

**Quick Start**
1. API
```
cd backend
npm install
npm run start
```
2. Admin panel
```
cd admin-panel
npm install
npm run start
```
3. Expo app
```
cd frontend
npm install
npm run start
```

4. Multi-service start scripts
- Bash (Linux/macOS, WSL): `./start-all.sh`
- PowerShell (Windows): `./start-all.ps1`


**Default Ports**
1. API: `http://localhost:3011`
2. Admin panel: `http://localhost:3012`
3. Expo dev server: typically `http://localhost:19006` (Expo-managed)

**Environment Variables**

Backend (`backend/.env`)

| Key | Purpose | Example |
| --- | --- | --- |
| `PORT` | API port | `3011` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/plxyground` |
| `JWT_SECRET` | JWT signing secret | `replace_me_with_32+_chars` |
| `JWT_EXPIRES_IN` | Token TTL | `7d` |
| `CORS_ORIGIN` | Allowed origins (comma-separated) | `http://localhost:19006,http://localhost:3012` |
| `NODE_ENV` | Runtime mode | `development` |

Backend startup validates required environment variables before the server boots and fails fast on missing or malformed values.

Frontend (`frontend/.env`)

| Key | Purpose | Example |
| --- | --- | --- |
| `EXPO_PUBLIC_API_BASE_URL` | API base URL | `http://localhost:3011` |

**Scripts**
1. `backend`
   - `npm run start` - start API.
   - `npm run seed` - seed database with sample data.
   - `npm run smoke` - run automated backend + admin smoke coverage.
2. `frontend`
   - `npm run start` - Expo dev server.
   - `npm run android` - Android dev.
   - `npm run ios` - iOS dev.
   - `npm run web` - Web dev.
3. `admin-panel`
   - `npm run start` - serve `index.html` on port 3012.
   - `npm run test:e2e` - run the Playwright admin smoke test.

**Seed Data**
1. Auto-seed runs when the DB is empty.
2. Admin login email: `admin@plxyground.local`.
3. Admin login password: `Internet2026@`.
4. Seeded creator and business accounts use password: `Password1!`.

**Architecture Overview**
1. API boots in `backend/src/index.js`, mounts route modules and applies security middleware.
2. PostgreSQL schema is defined and created in `backend/src/db/setup.js`.
3. Expo app uses `frontend/components/ApiClient.js` for API calls and `frontend/components/AuthContext.jsx` for auth state.
4. Admin panel is a single static page in `admin-panel/index.html` and calls the API directly via `fetch`.

**Authentication Model**
1. JWT tokens are issued on login and signup.
2. Clients send `Authorization: Bearer <token>` for protected routes.
3. Admin access is enforced by `requireAdmin` middleware.

**API Endpoints**

Public + Creator Auth
1. `GET /healthz` - health check.
2. `GET /` - API info.
3. `POST /api/auth/signup` - creator signup.
4. `POST /api/auth/login` - creator login.

Business Auth
1. `POST /api/business/auth/signup` - business signup.
2. `POST /api/business/auth/login` - business login.
3. `POST /api/business/content` - create business campaign content.
4. `GET /api/business/content/mine` - list all business-owned content, including pending moderation items.

Content
1. `GET /api/content` - public feed with search, limit, offset.
2. `GET /api/content/:id` - single published post.
3. `POST /api/content` - create post (auth required).
4. `PUT /api/content/:id` - update own post.
5. `DELETE /api/content/:id` - delete own post.

Creators
1. `GET /api/creators` - list creators with search, limit, offset.
2. `GET /api/creators/:id` - creator profile + posts.
3. `GET /api/creators/slug/:slug` - profile by slug.
4. `PUT /api/creators/:id` - update own profile.

Opportunities
1. `GET /api/opportunities` - list published opportunities.
2. `GET /api/opportunities/:id` - single opportunity.
3. `POST /api/opportunities` - create opportunity (auth required).
4. `PUT /api/opportunities/:id` - update own opportunity.
5. `DELETE /api/opportunities/:id` - delete own opportunity.

Admin
1. `POST /api/admin/auth/login` - admin login.
2. `POST /api/admin/auth/change-password` - admin password change.
3. `GET /api/admin/queue` - moderation queue.
4. `POST /api/admin/queue/bulk-action` - approve/reject/delete in bulk.
5. `GET /api/admin/content` - content management.
6. `PUT /api/admin/content/:id` - publish or update content.
7. `DELETE /api/admin/content/:id` - delete content.
8. `GET /api/admin/users` - list users.
9. `POST /api/admin/users/:userId/suspend` - suspend.
10. `POST /api/admin/users/:userId/reactivate` - reactivate.
11. `PUT /api/admin/users/:userId/role` - change role.
12. `PUT /api/admin/users/:userId/email-verify` - mark verified.
13. `POST /api/admin/users/reset-password` - reset (dev stub).
14. `GET /api/admin/audit` - audit log.
15. `GET /api/admin/audit/export` - JSON export.
16. `GET /api/admin/analytics` - KPIs + weekly trend.
17. `GET /api/admin/alerts` - recent activity.

**Expo Routes (Expo Router)**
1. Creator flow: `/`, `/login`, `/signup`, `/feed`, `/create`, `/post/[id]`, `/profile`, `/settings`.
2. Business flow: `/business-login`, `/business-signup`, `/business/dashboard`, `/business/profile`, `/business/edit-profile`, `/business/my-content`, `/business/search-creators`, `/business/opportunities`, `/business/settings`.
3. Legal: `/terms`, `/privacy`.

**Admin Panel**
1. Served from `admin-panel/server.js` on `http://localhost:3012`.
2. API base URL is hardcoded in `admin-panel/index.html` to `http://localhost:3011`.
3. Features: queue moderation, content publishing, user management, audit export, analytics, alerts, admin password change.

**Automation**
1. CI workflow: `.github/workflows/smoke.yml`
2. Backend smoke runner: `backend/scripts/smoke.js`
3. Admin panel Playwright smoke: `admin-panel/tests/admin-panel.spec.js`
4. OpenAPI spec: `docs/openapi.yaml`

**Database Schema**
1. Tables: `admins`, `creators`, `creator_accounts`, `content`, `opportunities`, `moderation_queue`, `audit_log`.
2. The schema is created automatically at startup.
3. Seed data is inserted by `backend/src/db/seed.js` and by the auto-seed block in `backend/src/db/setup.js`.

**Smoke Test Report**
1. See `docs/smoke-test-report.md` for the latest runtime results and remaining gaps.

**Known Issues**
1. Expo mobile smoke coverage is still manual; automated repo coverage currently targets backend and admin-panel web flows.

**Troubleshooting**
1. CORS errors: update `CORS_ORIGIN` in `backend/.env` to include your Expo and admin panel URLs.
2. API not reachable on device: set `EXPO_PUBLIC_API_BASE_URL` to your LAN IP.
3. Empty feed: run `npm run seed` in `backend` to generate sample content.
