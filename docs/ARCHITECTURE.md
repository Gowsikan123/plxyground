# PLXYGROUND — Architecture Overview

## System Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTS                              │
│                                                             │
│   📱 Mobile App          🖥️  Admin Panel                    │
│   (Expo / React Native)  (Vanilla HTML SPA)                 │
│   :8081                  :3012                              │
└─────────────┬───────────────────────┬───────────────────────┘
              │ HTTPS / REST          │ HTTPS / REST
              ▼                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND API                              │
│              Node.js · Express · :3011                      │
│                                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  │
│  │  /auth   │ │/business │ │/content  │ │  /admin/*    │  │
│  │/creators │ │  /auth   │ │  /opps   │ │  (protected) │  │
│  │/follows  │ │/content  │ │  /apps   │ │              │  │
│  │/messages │ │ /plan    │ │/partners │ │              │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘  │
│                                                             │
│  Middleware: JWT auth · Rate limiter · Validator · CORS     │
└─────────────────────────────┬───────────────────────────────┘
                              │ pg (node-postgres)
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    PostgreSQL 15+                           │
│                                                             │
│  users · businesses · content · opportunities · applications│
│  follows · messages · notifications · audit_log             │
└─────────────────────────────────────────────────────────────┘
```

## Service Responsibilities

### Backend (`backend/`)
- Owns all business logic and data access
- Stateless — all state lives in PostgreSQL
- JWT authentication with role-based access (creator / business / admin)
- Rate limited at gateway level
- Audit logging for all admin actions

### Frontend (`frontend/`)
- Expo Router for file-based screen navigation
- Zustand for global auth and feed state
- Service layer (`services/`) isolates all API calls
- No direct database access — all data via backend REST API

### Admin Panel (`admin-panel/`)
- Standalone SPA — no framework, no build step
- Communicates with backend `/api/admin/*` endpoints
- Protected by admin JWT — served on a separate port

## Data Flow — Creator Posting Content

```
Creator (App)
  → POST /api/content
  → requireAuth middleware validates JWT
  → validate middleware checks body schema
  → content route handler
  → INSERT INTO content (status = 'pending')
  → auditLogger.log({ action: 'content.create', ... })
  → sendSuccess(res, newPost)
  → Admin Queue shows pending post
  → Admin approves → PUT /api/admin/queue/:id/approve
  → UPDATE content SET status = 'approved'
  → Post appears in public feed
```

## Authentication Flow

```
Client sends: POST /api/auth/login { email, password }
  → bcrypt.compare(password, hash)
  → signToken({ id, role: 'creator' })
  → { token, user } returned
  → Client stores token in memory / SecureStore
  → Subsequent requests: Authorization: Bearer <token>
  → requireAuth decodes token → req.user = { id, role }
```

## Environment Separation

| Concern | Development | Production |
|---|---|---|
| Database | Local PostgreSQL | Railway / Supabase / RDS |
| API base URL | `http://localhost:3011` | `https://api.plxyground.com` |
| JWT expiry | `7d` | `1d` (tighter) |
| Rate limits | Relaxed | Strict |
| Error details | Full stack trace | Generic message only |
| Seed data | Auto-seeded on startup | Never seeded |
