# Contributing to Plxyground

Thanks for helping build Plxyground! This guide covers everything you need to get started.

## Branching Strategy

| Branch | Purpose |
|---|---|
| `main` | Production-ready code only |
| `develop` | Integration branch — merge all feature branches here first |
| `feature/<name>` | New features, branched off `develop` |
| `fix/<name>` | Bug fixes, branched off `develop` |

**Never push directly to `main`.** Open a PR from `develop` → `main` when a release is ready.

## Getting Started

```bash
git clone https://github.com/Gowsikan123/plxyground.git
cd plxyground

# Backend
cd backend
npm install
cp .env.example .env   # then fill in your DATABASE_URL and JWT_SECRET
node src/db/migrate.js
npm run dev

# Admin panel (separate terminal)
cd ../admin-panel
npm install
npm run start

# Frontend / Expo (separate terminal)
cd ../frontend
npm install
npm run start
```

## Running Tests

```bash
cd backend
npm test
```

Tests require a running PostgreSQL instance. Set `DATABASE_URL` in your `.env` before running.

## Pull Request Checklist

- [ ] Branched off `develop`, not `main`
- [ ] `npm test` passes locally
- [ ] No `console.log` debug statements left in production code
- [ ] `.env` file is **not** committed (it is gitignored)
- [ ] PR title is descriptive (e.g. `feat: add creator search endpoint`)

## Commit Message Format

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add opportunity filtering by category
fix: correct JWT expiry calculation
chore: update dependencies
docs: improve README quickstart
ci: add backend test workflow
```
