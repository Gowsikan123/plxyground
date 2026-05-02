# Security Policy

## Supported Versions

Security fixes are applied to the latest version on `main` only.

| Version | Supported |
|---|---|
| `main` (latest) | ✅ |
| Older branches | ❌ |

---

## Reporting a Vulnerability

**Please do not report security vulnerabilities via public GitHub Issues.**

Report security issues by emailing: **security@basketballnxtion.com**

Include:
- A description of the vulnerability
- Steps to reproduce
- Potential impact
- Any suggested fix (optional)

You will receive an acknowledgement within **48 hours** and a full response within **7 days**.

---

## Security Practices

### Authentication
- All passwords are hashed with **bcrypt** (minimum 12 rounds)
- JWTs are signed with a long random `JWT_SECRET` — rotate this immediately if compromised
- Tokens expire after `JWT_EXPIRES_IN` (default `7d`)
- Admin routes require a separate admin role check in addition to valid JWT

### Database
- All SQL uses **parameterised queries** — no string interpolation
- Database credentials are never logged
- `DATABASE_URL` is never exposed in API responses

### API
- Rate limiting is applied globally (100 req/15min) and on auth routes (10 req/15min)
- CORS is restricted to `CORS_ORIGIN` in production
- All request bodies are validated with `express-validator` before reaching route handlers
- Error responses never leak stack traces in production (`NODE_ENV=production`)

### Secrets
- All secrets are stored as environment variables — never hardcoded
- The `.env` file is in `.gitignore` and must never be committed
- `.env.example` contains only placeholder values, never real credentials

---

## Disclosure Policy

We follow responsible disclosure. Once a fix is deployed, we will:
1. Credit the reporter (unless they request anonymity)
2. Document the fix in [CHANGELOG.md](CHANGELOG.md)
3. Notify affected users if user data was at risk
