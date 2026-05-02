# Security Policy

## Supported Versions

| Version | Supported |
|---------|----------|
| `main` branch | ✅ Active development |

## Reporting a Vulnerability

**Please do NOT open a public GitHub issue for security vulnerabilities.**

Instead, report them privately:

1. Go to the **Security** tab → **Private vulnerability reporting** on this repo, OR
2. Email the maintainer directly (see profile).

Please include:
- A description of the vulnerability
- Steps to reproduce
- Potential impact
- Any suggested fix

You will receive an acknowledgement within **48 hours** and a resolution timeline within **7 days**.

## Security Measures in Place

- All passwords hashed with **bcrypt (rounds: 12)**
- JWT tokens signed with strong secrets, short expiry
- SQL injection prevention via **parameterised queries only** — zero string interpolation
- Rate limiting on all auth endpoints (10 requests / 15 min)
- Global rate limiting (100 requests / 15 min)
- CORS restricted to allowed origins
- Helmet.js security headers on all responses
- Admin routes protected by separate `ADMIN_JWT_SECRET`
- Audit log for all sensitive admin actions
- Weekly automated `npm audit` via GitHub Actions
