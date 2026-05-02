# Changelog

All notable changes to PLXYGROUND will be documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- Full monorepo scaffold: `backend/`, `frontend/`, `admin-panel/`, `docs/`
- Backend Express app with PostgreSQL (`pg`) connection pooling
- JWT authentication for creators, businesses, and admins
- Route files: `auth`, `businessAuth`, `businessContent`, `content`, `creators`, `opportunities`, `applications`, `follows`, `messages`, `notifications`, `partners`, `business-plan`, `admin`
- Middleware: `auth`, `validate`, `rateLimiter`, `errorHandler`
- Utilities: `jwt`, `auditLogger`, `slugify`, `pagination`, `response`, `mailer`
- Database auto-setup via `db/setup.js` (9 tables, CREATE TABLE IF NOT EXISTS)
- Development seed data via `db/seed.js`
- Expo React Native frontend scaffold with Zustand stores, service layer, hooks, and component library
- Admin panel SPA (login, dashboard, moderation queue, content, users, audit log, settings)
- GitHub Actions CI pipeline
- `.github/` templates: issue templates, PR template
- `start-all.sh`, `start-all.ps1`, `start-all.bat` launchers
- `CONTRIBUTING.md`, `SECURITY.md`, `CHANGELOG.md`
- `.editorconfig` for consistent editor settings

### Changed
- N/A — initial scaffold release

### Fixed
- N/A — initial scaffold release

---

## Version Guide

| Bump | When |
|---|---|
| `MAJOR` (1.0.0) | Breaking API change or complete feature overhaul |
| `MINOR` (0.1.0) | New feature added in a backwards-compatible way |
| `PATCH` (0.0.1) | Bug fix, dependency update, or minor internal change |
