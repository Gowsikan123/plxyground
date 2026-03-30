# PLXYGROUND Release Checklist

## 1) App store readiness
- [x] App icons and splash screens (iOS/Android)
- [x] In-app `Terms` and `Privacy` pages and links
- [ ] App Store Connect metadata (screenshots/video/description)
- [ ] Permissions and data privacy documentation

## 2) Security & compliance
- [x] MFA endpoints (`/api/auth/2fa/request`, `/api/auth/2fa/verify`)
- [x] GDPR/CCPA export/delete endpoints (`/api/auth/me/export`, `/api/auth/me`)
- [x] Refresh/revoke token flow (`/api/auth/refresh-token`, `/api/auth/logout`)
- [x] CORS + helmet + rate limiting in `backend/src/app.js`
- [x] Audit log and health endpoints (`/healthz`)
- [x] Backup scripts (`backend/scripts/backup-db.sh`, `backend/scripts/backup-db.ps1`)

## 3) Functional flows
- [x] Creator/business onboarding + profile edit
- [x] Opportunity apply/booking endpoint (`/api/opportunities/:id/apply`)
- [x] Feed recommendation engine (`/api/content/recommend`)

## 4) Testing
- [x] Backend unit/API tests (Jest/Supertest)
- [ ] Frontend unit/integration (Jest + RN Testing Library)
- [ ] E2E tests (Detox/Playwright)
- [ ] Accessibility checks (a11y labels, contrast)
- [ ] CI pipeline for lint/test on PR

## 5) Observability
- [ ] Sentry/Crashlytics + analytics instrumentation
- [ ] Production metrics/log collection

## 6) Release workflow
- [ ] Beta build (TestFlight/Play internal)
- [ ] Bug triage and bugfix cycles
- [ ] Store compliance checks (Apple 3.1, Google Data Safety)
- [ ] Rollback strategy and release notes
