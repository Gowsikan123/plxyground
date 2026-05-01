# Security Audit

Date: 2026-04-08
Repository: `c:\plxyground`
Auditor: Codex

## Status Update

Follow-up remediation completed on 2026-04-08:

- Fixed the business opportunity moderation bypass so business-owned routes can no longer self-publish opportunities.
- Fixed missing moderation persistence for bulk actions by creating the `bulk_action_log` table.
- Fixed refresh-token collisions by issuing unique refresh tokens per session event.
- Fixed local admin smoke coverage by adding same-origin `/api/*` proxy behavior to the admin test server.

Still open and important:

- Hardcoded/demo credentials are still seeded at runtime.
- Public creator endpoints still need review for overexposed fields.
- Refresh tokens still fall back to `JWT_SECRET` if `JWT_REFRESH_SECRET` is unset.
- The 2FA implementation is still not a full authentication-grade second factor.

## Scope

This audit covered:

- `backend/` Node/Express API and SQLite schema
- `frontend/` Expo/React client
- `admin-panel/` static admin interface
- npm dependency audit results from `backend`, `frontend`, and `admin-panel`

## Method

This was a source-code review plus `npm audit --json` on each package. It was not a live penetration test, infrastructure review, or secrets scan across deployment systems.

## Executive Summary

The codebase has a few solid defaults in place, including `helmet`, parameterized SQL queries, basic rate limiting on auth routes, and role checks on admin endpoints. The main security risk is not classic injection; it is insecure operational behavior and authorization logic.

The most serious issues are:

1. Hardcoded default credentials and automatic demo-account seeding in runtime database setup.
2. Public exposure of user email addresses and suspension state through creator profile endpoints.
3. A moderation bypass that lets business users publish their own opportunities without admin approval.

## Findings

### Critical

#### 1. Hardcoded credentials and automatic seeding in application startup

Severity: Critical

Evidence:

- `backend/src/db/setup.js:147`
- `backend/src/db/setup.js:148`
- `backend/src/db/setup.js:149`
- `backend/src/db/setup.js:152`
- `backend/src/db/setup.js:178`
- `backend/src/db/seed.js:13`
- `backend/src/db/seed.js:14`
- `backend/src/db/seed.js:16`
- `backend/scripts/smoke.js:213`
- `backend/scripts/smoke.js:214`
- `admin-panel/tests/admin-panel.spec.js:7`
- `admin-panel/tests/admin-panel.spec.js:8`

What is happening:

- The runtime DB bootstrap auto-creates an admin account with the email `admin@plxyground.local` and password `Internet2026@`.
- It also creates multiple demo user accounts with the shared password `Password1!`.
- This behavior lives in `backend/src/db/setup.js`, which runs during app startup rather than in a separate dev-only seed command.
- The same credentials are repeated in seed scripts and tests, making accidental reuse more likely.

Impact:

- Any environment started with this code and a writable database can receive known credentials.
- If this code ever runs outside a tightly controlled local-only environment, account compromise is trivial.
- Reused credentials in tests and scripts increase the chance of accidental production leakage.

Recommendation:

- Remove all automatic account creation from `backend/src/db/setup.js`.
- Gate demo data behind an explicit dev-only seed command.
- Rotate any credentials already used in shared environments.
- Move demo/test credentials to local env files that are excluded from production workflows.

### High

#### 2. Public creator endpoints expose email addresses and suspension status

Severity: High

Evidence:

- `backend/src/routes/creators.js:14`
- `backend/src/routes/creators.js:31`
- `backend/src/routes/creators.js:37`
- `backend/src/routes/creators.js:50`
- `backend/src/routes/creators.js:56`
- `backend/src/routes/creators.js:69`

What is happening:

- Public creator listing and profile endpoints select and return `ca.email` and `ca.is_suspended`.
- This data is returned to unauthenticated callers through:
  - `GET /api/creators`
  - `GET /api/creators/:id`
  - `GET /api/creators/slug/:slug`

Impact:

- User email addresses can be harvested at scale.
- Suspension status leaks account moderation state and internal trust decisions.
- This materially increases spam, phishing, and privacy risk.

Recommendation:

- Remove `email` and `is_suspended` from all public creator responses.
- Create separate private/admin serializers for sensitive fields.
- Review other endpoints for overexposed account metadata.

#### 3. Business users can self-publish opportunities and mark moderation as approved

Severity: High

Evidence:

- `backend/src/routes/opportunities.js:102`
- `backend/src/routes/opportunities.js:103`
- `backend/src/routes/opportunities.js:112`
- `backend/src/routes/opportunities.js:120`
- `backend/src/routes/opportunities.js:126`
- `backend/src/routes/opportunities.js:128`
- `backend/src/routes/opportunities.js:131`

What is happening:

- The owner-edit route for opportunities accepts `is_published` from business users.
- The same route updates the moderation queue status to `approved` when `is_published` is truthy.
- That allows a business account to bypass admin review and publish directly.

Impact:

- Moderation workflow can be bypassed by any authenticated business account.
- Unsafe or noncompliant opportunities can be made public without review.
- Audit history becomes misleading because user-driven publication appears approved.

Recommendation:

- Remove `is_published` handling from user-owned opportunity update routes.
- Restrict publish/unpublish transitions to admin-only routes.
- Keep user edits in a pending state until explicitly approved by admins.

### Medium

#### 4. Refresh token design is weak and falls back to the access-token secret

Severity: Medium

Evidence:

- `backend/src/routes/auth.js:84`
- `backend/src/routes/auth.js:86`
- `backend/src/routes/auth.js:91`
- `backend/src/routes/auth.js:160`
- `backend/src/routes/auth.js:168`
- `backend/src/db/setup.js:103`

What is happening:

- Refresh tokens are stored in plaintext in the database.
- Verification falls back to `JWT_SECRET` when `JWT_REFRESH_SECRET` is absent.
- `JWT_REFRESH_SECRET` is not required in `backend/src/config/env.js`.
- There is no token rotation on refresh.

Impact:

- A DB leak exposes live refresh tokens directly.
- Secret separation between access and refresh tokens is not guaranteed.
- Stolen refresh tokens remain valuable until expiry or explicit revocation.

Recommendation:

- Require `JWT_REFRESH_SECRET` at startup.
- Store only a hash of refresh tokens.
- Rotate refresh tokens on every refresh.
- Consider tracking device/session metadata and last use.

#### 5. 2FA flow is only a bearer-token-protected code check and leaks codes to logs

Severity: Medium

Evidence:

- `backend/src/routes/auth.js:181`
- `backend/src/routes/auth.js:189`
- `backend/src/routes/auth.js:195`

What is happening:

- The 2FA request and verify endpoints require an already valid bearer token.
- Generated codes are written to server logs.
- Successful verification is not bound to a session elevation, sensitive action, or login completion step.

Impact:

- This does not provide meaningful second-factor protection for login.
- Anyone with log access can read 2FA codes.
- The feature may create a false sense of stronger authentication than actually exists.

Recommendation:

- Do not log OTP codes.
- Bind 2FA to a real authentication or step-up flow.
- Store hashed codes and rate-limit verification attempts.
- Mark sessions as 2FA-verified only after successful completion.

#### 6. Mobile/web client stores bearer tokens in AsyncStorage

Severity: Medium

Evidence:

- `frontend/components/AuthContext.jsx:14`
- `frontend/components/AuthContext.jsx:27`
- `frontend/components/AuthContext.jsx:34`
- `frontend/components/ApiClient.js:5`

What is happening:

- The client persists access tokens in `AsyncStorage` and reuses them as bearer tokens.

Impact:

- On compromised devices, rooted phones, or weakly protected local environments, token extraction is easier.
- Long-lived bearer tokens in general-purpose storage increase account takeover blast radius.

Recommendation:

- Prefer platform-secure storage for mobile secrets.
- Shorten access-token lifetime and rely on rotated refresh tokens.
- Consider separate browser/mobile strategies if this app is used on web.

#### 7. Dependency vulnerabilities found by `npm audit`

Severity: Medium

Evidence:

- `backend/package-lock.json:4180` includes `path-to-regexp@8.3.0`
- `frontend/package-lock.json:2972` includes `@xmldom/xmldom@0.8.11`
- `frontend/package-lock.json:8639` includes `brace-expansion@1.1.12`

Audit results:

- `backend`: 1 high vulnerability
  - `path-to-regexp` DoS advisory
- `frontend`: 1 high and 1 moderate vulnerability
  - `@xmldom/xmldom` XML injection advisory
  - `brace-expansion` process hang / memory exhaustion advisory
- `admin-panel`: 0 known vulnerabilities from `npm audit`

Recommendation:

- Update lockfiles to versions that resolve the advisories.
- Re-run `npm audit` after upgrades.
- Add dependency auditing to CI so regressions are caught automatically.

### Low

#### 8. Admin password-change UI does not send the admin bearer token

Severity: Low

Evidence:

- `backend/src/routes/admin/adminAuth.js:48`
- `admin-panel/index.html:341`
- `admin-panel/index.html:673`
- `admin-panel/index.html:675`

What is happening:

- The backend correctly protects `POST /api/admin/auth/change-password` with `verifyToken` and `requireAdmin`.
- The admin UI submits `currentPassword` and `newPassword`, but does not include the bearer token in the request headers.

Impact:

- This is primarily a functionality defect, not a direct vulnerability.
- It may encourage insecure workarounds or cause operators to believe password rotation is available when it is not.

Recommendation:

- Send the admin token via the existing `authHeaders()` helper.
- Remove the unused email field from the UI, since the backend derives the admin from the token.

## Positive Controls Observed

- `helmet` is enabled in `backend/src/app.js`.
- SQL queries are parameterized through `better-sqlite3` prepared statements.
- Auth endpoints have rate limiting in `backend/src/app.js`.
- Admin routes consistently use `verifyToken` and `requireAdmin`.

## Remediation Priority

### Immediate

- Remove auto-seeding and hardcoded credentials from runtime code.
- Rotate any seeded or shared credentials.
- Stop exposing email and suspension status from public creator endpoints.
- Prevent business-owned routes from changing `is_published`.

### Next

- Separate and require `JWT_REFRESH_SECRET`.
- Redesign refresh token storage and rotation.
- Remove OTP logging and redesign 2FA into a real auth control.
- Upgrade vulnerable dependencies.

### Later

- Move client token storage to a more secure mechanism where supported.
- Add CI checks for dependency audit, secret scanning, and route-level regression tests around authorization.

## Suggested Validation After Fixes

- Add tests proving public creator endpoints never return private account fields.
- Add tests proving business users cannot publish opportunities directly.
- Add tests proving startup does not create default users in non-development environments.
- Add tests for refresh-token rotation and revoked-token rejection.

## Audit Limitations

- No production deployment configuration was reviewed.
- No reverse proxy, TLS, CDN, or WAF settings were inspected.
- No manual exploitation against a running environment was performed.
