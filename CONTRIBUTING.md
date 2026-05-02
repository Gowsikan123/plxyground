# Contributing to PLXYGROUND

Thank you for helping build PLXYGROUND. This document covers everything you need to make a great contribution.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Branch Strategy](#branch-strategy)
3. [Commit Convention](#commit-convention)
4. [Code Rules](#code-rules)
5. [Pull Request Process](#pull-request-process)
6. [Testing Requirements](#testing-requirements)
7. [Style Guide](#style-guide)

---

## Getting Started

1. Fork the repo and clone your fork
2. Create a feature branch off `main` (see Branch Strategy)
3. Set up your local environment (see README Quick Start)
4. Make your changes following the Code Rules below
5. Open a Pull Request against `main`

---

## Branch Strategy

| Branch type | Pattern | Example |
|---|---|---|
| Feature | `feat/short-description` | `feat/follow-system` |
| Bug fix | `fix/short-description` | `fix/jwt-expiry-handling` |
| Chore | `chore/short-description` | `chore/update-dependencies` |
| Docs | `docs/short-description` | `docs/api-reference` |
| Hotfix | `hotfix/short-description` | `hotfix/auth-crash` |

Never commit directly to `main`.

---

## Commit Convention

All commits must follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short description>

[optional body]
[optional footer]
```

**Types:** `feat` · `fix` · `docs` · `style` · `refactor` · `test` · `chore` · `perf`

**Scopes:** `backend` · `frontend` · `admin` · `db` · `auth` · `ci`

**Examples:**
```
feat(backend): add follows route with follow/unfollow endpoints
fix(auth): handle expired JWT gracefully with 401 response
docs: update API reference in README
chore(deps): bump pg from 8.11 to 8.12
```

---

## Code Rules

These are **enforced in code review** — PRs that break these rules will not be merged.

### Universal
- No `TODO` comments in committed code — open a GitHub Issue instead
- No commented-out code blocks
- No magic numbers — use named constants

### Backend (Node.js / Express)
- No `console.log` anywhere — use `logger.info()`, `logger.warn()`, `logger.error()`
- Every SQL query must use **parameterised queries** — no string interpolation
  ```js
  // ✅ Good
  await pool.query('SELECT * FROM users WHERE id = $1', [userId]);

  // ❌ Bad — SQL injection risk
  await pool.query(`SELECT * FROM users WHERE id = ${userId}`);
  ```
- Every async Express handler must be wrapped in `try/catch`
  ```js
  // ✅ Good
  router.get('/:id', requireAuth, async (req, res) => {
    try {
      const result = await pool.query(...);
      return sendSuccess(res, result.rows[0]);
    } catch (err) {
      logger.error('Failed to fetch user', { err });
      return sendError(res, 500, 'Internal server error');
    }
  });
  ```
- All API responses must use the helpers from `utils/response.js` (`sendSuccess`, `sendError`, `sendPaginated`)
- No direct `res.json()` or `res.send()` calls
- Every new route must be mounted in `src/app.js`

### Frontend (React Native / Expo)
- No `any` TypeScript types
- All API calls go through `services/` — no raw `fetch()` or `axios` calls in screens
- All global state via Zustand stores in `store/`
- No inline styles — use `StyleSheet.create()`

---

## Pull Request Process

1. **Title** — use Conventional Commit format: `feat(backend): add notification delivery`
2. **Description** — fill in the PR template completely
3. **Tests** — every new endpoint or component needs a test (see Testing Requirements)
4. **Checklist** — all checkboxes in the PR template must be ticked before requesting review
5. **Review** — at least one approval required before merge
6. **Merge** — squash and merge only (keep `main` history clean)

---

## Testing Requirements

```bash
# Run all backend tests
cd backend && npm test

# Run with coverage (must stay above 70%)
cd backend && npm run test:coverage
```

- Every new backend route needs at least one integration test in `backend/src/__tests__/`
- Tests must cover the happy path and at least one error case
- Do not mock the database in integration tests — use a test database

---

## Style Guide

### JavaScript / Node.js
- 2-space indentation
- Single quotes for strings
- Semicolons required
- `const` by default; `let` only when reassignment is necessary; never `var`
- Arrow functions for callbacks
- Destructure objects when accessing 3+ properties

### File Naming
- Routes: `camelCase.js` (e.g. `businessAuth.js`)
- Components: `PascalCase.jsx` (e.g. `CreatorCard.jsx`)
- Utils/hooks: `camelCase.js` (e.g. `useAuth.js`)

---

For questions, open a [GitHub Discussion](../../discussions) or reach out via the Basketball Nxtion Slack.
