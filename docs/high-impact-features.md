# High Impact Features (PLXYGROUND)

This is a dedicated scope list tracking the highest-impact product improvements for next phase.

## 2) App store polish & compliance
- [ ] Add app icons + adaptive splash assets for iOS + Android
- [ ] Add in-app `Privacy Policy` and `Terms` links in settings and onboarding
- [ ] Maintain App Store Connect + Play Store metadata (screenshots, video, copy)
- [ ] Add data-privacy docs and Data Safety declarations (Google Play)
- [ ] Confirm permissions usage (camera, microphone, photo library, notifications)
- [ ] Set release build `expo` config, remove debug flags, optimize privacy terms

## 3) Security & reliability
- [ ] Add MFA with email/SMS + authenticator app support
- [ ] Add account data controls: export and delete on-profile
- [ ] Implement strong JWT refresh & revocation flow (done in backend, validate tests)
- [ ] Harden CORS, secure cookie flags, use HTTPS, add cert pinning in app
- [ ] Enable API rate limits, bot detection, abuse thresholds
- [ ] Add audit logs, health checks (`/healthz`), and backup/restore scripts

## 4) Scale & architecture
- [ ] Plan migration from SQLite to PostgreSQL (or managed DB) and run migrations
- [ ] Add queue worker for heavy jobs (notifications, email, analytics ingest)
- [ ] Add application observability (logs + metrics) with Prometheus/Grafana or hosted APM
- [ ] Add horizontal scaling readiness (stateless API, session store, BLoC caching)
- [ ] Add CDN caching for static assets + image optimization

## 5) Testing & quality
- [ ] Add frontend unit/integration tests (Jest + React Native Testing Library)
- [ ] Add E2E tests (Detox/Playwright) for auth, feed, opportunities, admin
- [ ] Add a11y checks (axe/lighthouse), voiceover support, contrast validation
- [ ] Add CI pipeline for lint/test on PR and nightly runs
- [ ] Add performance regression monitoring (Bundle size, render times)
- [ ] Add security scans (npm audit, dependency-check, SAST)
