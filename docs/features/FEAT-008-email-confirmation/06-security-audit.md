# Security Audit — FEAT-008: Email Confirmation on Registration

**Feature:** FEAT-008-email-confirmation
**Auditor:** sdlc-security (inline)
**Audit base:** main..HEAD (`feat/008-email-confirmation`)
**Audit scope:** Full feature diff
**Scope size:** 46 files, +1583 / -189 lines
**Date:** 2026-05-28

---

## Summary

No Critical or High findings. The most impactful issue is **M-2**: the confirmation token's `expiresIn: '86400'` (a bare numeric string) is parsed by the `ms` library as **86.4 seconds**, not 24 hours — this makes the confirmation link functionally unusable for most users and violates FR-1. **M-1** and **M-4** together enable low-friction enumeration of registered email addresses. **M-3** flags the confirmation JWT appearing in URL query parameters, exposing it to server access logs and browser history. Auth, input validation (server-side via `class-validator`), session management, CSRF posture (BFF pattern), and the Google Sign-In edge case were all audited at full depth. The `emailVerified` guard on login (`auth.service.ts:121`) and the `purpose` claim check in `confirmEmail` (`auth.service.ts:140`) are correctly implemented.

**Counts:** Critical: 0 · High: 0 · Medium: 4 · Low: 4 · Info: 2

---

## Threat model

### Trust boundaries
- Internet → Next.js BFF (port 3001)
- Next.js BFF → NestJS API (port 3000, server-side only)
- NestJS API → PostgreSQL (user entity, `emailVerified` column)
- NestJS API → Redis (`resend_limits:{email}` namespace)
- NestJS API → SMTP relay (nodemailer, `secure: false`)
- Email recipient → confirmation link (JWT in URL)

### Attack surface

| Surface | Type | Authenticated? | Rate-limited? | Input shape |
|---|---|---|---|---|
| `POST /api/v1/auth/register` | HTTP | No | Yes — ThrottlerGuard 30 req/min/IP | `{ email, password }` |
| `POST /api/v1/auth/login` | HTTP | No | Yes — ThrottlerGuard 30 req/min/IP | `{ email, password }` |
| `GET /api/v1/auth/confirm-email?token=` | HTTP | No | **None** (`@SkipThrottle()`) | `token` query param (JWT) |
| `POST /api/v1/auth/resend-confirmation` | HTTP | No | Yes — ThrottlerGuard + Redis per-email counter | `{ email }` |
| `GET /api/auth/confirm-email?token=` | HTTP (BFF) | No | None (Next.js route handler) | `token` query param |
| `POST /api/auth/resend-confirmation` | HTTP (BFF) | No | None (Next.js route handler) | `{ email }` (unvalidated) |
| `/confirm-email?token=` | Browser page | No | N/A | `token` query param rendered in URL |

### Sensitive data flows
- `password` (plaintext) → `bcrypt.hash(password, 10)` → PostgreSQL `user.password` (`select: false`)
- `emailVerified: boolean` → PostgreSQL `user.emailVerified` (included in default queries, checked on every login)
- Confirmation JWT → signed with `JWT_ACCESS_SECRET`, embedded in email link URL
- Email link URL (`/confirm-email?token=<jwt>`) → user inbox → browser URL bar → browser history → Next.js BFF access log → NestJS access log
- `accessToken` + `refreshToken` → returned from `confirmEmail` → stored in Redis session, surfaced as `session_id` HttpOnly cookie
- `resend_limits:{email}` counter → Redis (TTL 3600 s, sliding window)
- SMTP credentials (`EMAIL_USER`, `EMAIL_PASSWORD`) → `AppConfigService` env vars → nodemailer transporter

---

## Coverage

| Area | Coverage | Notes |
|---|---|---|
| Authentication | ✅ Full | Login guard, emailVerified check, Google credential verification, purpose claim |
| Authorization | ✅ Full | No privileged resources introduced; logout uses AuthGuard |
| Input validation (server) | ✅ Full | `class-validator` DTOs on all new endpoints; `ValidationPipe({ whitelist: true })` global |
| Input validation (client) | ✅ Full | Zod schema on register/login forms; BFF routes do minimal validation (see L-4) |
| XSS | ✅ Full | React default escaping; no `dangerouslySetInnerHTML`; email display in `CheckEmailForm` is plain text |
| CSRF | N/A | BFF pattern: NestJS API is not reachable from the browser directly; no CSRF surface |
| SQL injection | ✅ Full | TypeORM parameterised queries throughout; `createQueryBuilder` uses `:email` param |
| NoSQL injection | N/A | Redis keys are constructed by the server (`resend_limits:${email}`) not derived from raw input |
| Command injection | N/A | No shell execution in the diff |
| Secrets handling | ✅ Full | All secrets via `AppConfigService` (env); no hard-coded credentials found |
| Dependency vulnerabilities | ⚠️ Partial | Static lockfile inspection only — recommend `npm audit` / Snyk in CI |
| CORS | N/A | `app.enableCors()` not called; NestJS defaults to no CORS — correct for a BFF-only API |
| Rate limiting | ⚠️ Partial | ThrottlerGuard on all auth endpoints; `@SkipThrottle()` on confirm-email (see L-3); per-email Redis counter on resend |
| Sensitive data exposure | ⚠️ Partial | Confirmation JWT in URL (see M-3); `already_verified` response (see M-1) |
| Session management | ✅ Full | Session cookie: `HttpOnly: true`, `SameSite: lax`, `secure` in production; stored in Redis |
| Cryptography | ⚠️ Partial | bcrypt rounds=10 (good); `expiresIn: '86400'` string bug (see M-2); shared secret concern (see L-1) |
| Security headers | ✅ Full | `helmet` applied in `main.ts`; CSP disabled intentionally (API-only, documented) |
| File uploads | N/A | No file upload surface in this feature |
| SSRF | N/A | No server-side HTTP requests to user-supplied URLs |
| Open redirect | N/A | All redirects are client-side hard-coded paths |
| Path traversal | N/A | No file-system operations in the diff |

---

## Findings

### Critical

None.

### High

None.

### Medium

#### M-1 — `resendConfirmation` distinguishes verified accounts from non-existent ones

**Where:** `server/src/modules/auth/auth.service.ts:169-171`
**Category:** Sensitive data exposure
**What:** `resendConfirmation` returns `{ status: 'already_verified' }` when the account exists and is verified, and `{ status: 'email_sent' }` for both non-existent and unverified accounts. This lets any caller probe whether a given email is (a) not registered, (b) registered-but-unverified, or (c) registered-and-verified — distinguishing case (c) from the other two. Combined with M-4, a full user-existence and verification-status oracle is available to unauthenticated callers.
**Attack vector:** `POST /api/v1/auth/resend-confirmation` with `{ "email": "target@example.com" }` → response body discriminates between states without authentication.
**Impact:** An attacker can build a list of verified accounts (confirmed active users) by iterating email addresses. Verified accounts are higher-value targets for credential-stuffing and phishing.
**Mitigation:** Always return `{ status: 'email_sent' }` regardless of verification state. The client already shows a generic "check your inbox" message; there is no UX reason to surface `already_verified` publicly. Optionally log the `already_verified` event server-side for monitoring.
```ts
// Always return email_sent; never distinguish verified from unverified
if (!user || user.emailVerified) {
  return { status: 'email_sent' };
}
```
**References:** OWASP A01:2021 · CWE-204 (Observable Response Discrepancy)

---

#### M-2 — Confirmation token expires in ~86 seconds, not 24 hours (numeric string passed to `ms`)

**Where:** `server/src/modules/auth/auth.service.ts:88`
**Category:** Crypto / Session
**What:** `signConfirmationToken` passes `expiresIn: '86400'` as a string. The `@nestjs/jwt` library delegates to `jsonwebtoken`, which uses the `ms` package for string-typed expiry values. `ms('86400')` = **86,400 ms = 86.4 seconds**, not 86,400 seconds. The spec (FR-1) and the ADR require a 24-hour TTL. A numeric value (`86400`) is treated as seconds; a string requires an explicit unit (`'86400s'` or `'24h'`).
**Attack vector:** No active exploitation needed — this is a functional misconfiguration that breaks the feature for all users who do not click within ~86 seconds. Confirmed via `node -e "require('ms')('86400')"` → `86400 ms`.
**Impact:** Confirmation links are effectively unusable. Users clicking 2 minutes after registration receive "invalid or expired link." Operators expecting 24-hour window for support have an incorrect mental model of the system. The resend flow partially mitigates this (each resend issues a fresh 86-second token), but the user must click almost immediately — defeating the purpose of email confirmation.
**Mitigation:** Change the string to a number or add a unit suffix:
```ts
// Option A — number (seconds)
{ secret: this.appConfig.jwt.JWT_ACCESS_SECRET, expiresIn: 86400 }

// Option B — explicit string unit
{ secret: this.appConfig.jwt.JWT_ACCESS_SECRET, expiresIn: '86400s' }

// Option C — human-readable
{ secret: this.appConfig.jwt.JWT_ACCESS_SECRET, expiresIn: '24h' }
```
**References:** FR-1 (TTL 24 h) · CWE-1188 (Insecure Default Value) · `ms` package v2.x docs
**Severity rationale:** Classified Medium rather than Low because it violates the spec's stated security contract (24 h TTL) and degrades user-observable security properties. Classified Medium rather than High because the effect is more restrictive (shorter TTL), not less, so no attack surface is expanded — the feature is broken, not weakened.

---

#### M-3 — Confirmation JWT appears in URL query parameter, exposed to access logs and browser history

**Where:** `client/app/confirm-email/page.tsx:13`, `client/app/api/auth/confirm-email/route.ts:8`, `server/src/modules/email/email.service.ts:26`
**Category:** Sensitive data exposure
**What:** The confirmation link is constructed as `{CLIENT_URL}/confirm-email?token=<jwt>` and sent in the email body. When the user clicks the link, the JWT is visible in the browser address bar, stored in browser history, recorded in Next.js and NestJS server access logs, and potentially forwarded via `Referer` headers if the page includes any third-party resources (analytics, fonts). Single-use invalidation is explicitly deferred (spec §7), meaning a token captured from any of these sources remains valid until expiry.
**Attack vector:** (1) An attacker with access to server access logs harvests confirmation JWTs. (2) A user whose browser history is compromised has confirmation tokens exposed. (3) A Referer header leak to a third-party script reveals the token if the `/confirm-email` page loads external resources.
**Impact:** A captured token can be used to confirm the victim's account and receive a fresh session (access + refresh tokens) — effectively stealing the session at the moment of account activation. Risk is bounded by the token TTL (nominally 24 h; currently ~86 s due to M-2).
**Mitigation:** Use a short-lived opaque code (a UUID stored in Redis with a pointer to the JWT, TTL-matched) in the email link instead of the raw JWT. The `confirm-email` endpoint exchanges the opaque code for the stored token server-side — the JWT never appears in a URL. Alternatively, accept the current posture as a v1 tradeoff and document it, then prioritise single-use invalidation (the ADR already identifies this as a future optimization using `getDel`).
```
Email link: /confirm-email?code=<uuid>         (opaque, short-lived)
BFF GET /api/auth/confirm-email?code=<uuid>    (exchanges code for JWT server-side)
NestJS GET /auth/confirm-email?token=<jwt>     (JWT stays server-to-server)
```
**References:** OWASP A02:2021 · CWE-598 (Use of GET Request Method with Sensitive Query Strings) · ASVS V3.4.3

---

#### M-4 — Email enumeration via `POST /auth/register` distinct error response

**Where:** `server/src/modules/auth/auth.service.ts:97-99`
**Category:** Sensitive data exposure
**What:** `register` throws `BadRequestException('User already exists')` when the provided email is already in the database. An unauthenticated caller can determine whether any email address is registered by submitting registration requests and observing the response: `400 Bad Request` with `"User already exists"` vs `201 Created` with `{ status: 'pending_confirmation' }`.
**Attack vector:** `POST /api/v1/auth/register` with `{ "email": "target@example.com", "password": "anypass" }` → `400` with the specific message confirms account existence.
**Impact:** Enables harvesting of registered email addresses. Combined with M-1, all three account states (not registered / registered-unverified / registered-verified) are distinguishable without authentication.
**Mitigation:** Return the same success-shaped response regardless of whether the email is new or already registered. Send the confirmation email only for new accounts; for existing accounts, optionally send a "someone tried to re-register your account" notification to the registered address. The client shows "check your inbox" in both cases.
```ts
// Always return pending_confirmation; send email only for new account
if (existedUser) {
  // Optionally: fire a "re-registration attempt" notification to existedUser.email
  return { status: 'pending_confirmation' };
}
```
**References:** OWASP A01:2021 · CWE-204 · ASVS V2.7.1

---

### Low

#### L-1 — Confirmation token signed with `JWT_ACCESS_SECRET` (shared with access tokens)

**Where:** `server/src/modules/auth/auth.service.ts:87`
**Category:** Crypto
**What:** `signConfirmationToken` uses `this.appConfig.jwt.JWT_ACCESS_SECRET` — the same secret used for user access tokens. A `purpose: 'email_confirmation'` claim and a check in `confirmEmail` (line 140) prevent cross-use in normal operation. However, sharing a single secret means that any future code path that verifies a JWT with `JWT_ACCESS_SECRET` without checking `purpose` would silently accept a confirmation token as an access token, or vice versa.
**Attack vector:** No current exploitation path — the `purpose` check is in place. Risk materialises if a future code path (e.g., a new guard or middleware) verifies JWTs with the same secret without checking `purpose`.
**Impact:** Accidental cross-accept of token types if the `purpose` check is omitted in a future code path. Defense-in-depth gap.
**Mitigation:** Introduce a dedicated `JWT_CONFIRMATION_SECRET` env var and a separate `AppConfigService` getter. Token types that differ in their trust model should use different signing keys — the cost is one env var and a config getter.
```ts
private signConfirmationToken(userId: string): string {
  return this.jwtService.sign(
    { sub: userId, purpose: 'email_confirmation' },
    { secret: this.appConfig.jwt.JWT_CONFIRMATION_SECRET, expiresIn: 86400 },
  );
}
```
**References:** CWE-321 (Use of Hard-coded Cryptographic Key) · ASVS V2.10.1

---

#### L-2 — Nodemailer `secure: false` — SMTP connection does not use implicit TLS

**Where:** `server/src/modules/email/email.service.ts:14`
**Category:** Crypto
**What:** `secure: false` in the nodemailer transport configuration means the connection starts without TLS. If `EMAIL_PORT` is set to 465 (the standard implicit-TLS SMTP port), nodemailer overrides this and upgrades automatically; however, if `EMAIL_PORT` is 587 (STARTTLS) or 25, the connection is initially plaintext and upgrades only if the SMTP server offers `STARTTLS`. A misconfigured or downgrade-capable SMTP relay can result in the confirmation email (containing the JWT link) being transmitted in cleartext over the network.
**Attack vector:** A network attacker between the NestJS host and the SMTP relay performing a STARTTLS-stripping attack receives the plaintext email body, including the confirmation link with its JWT.
**Impact:** Confirmation JWT captured from the SMTP channel can be used to confirm and hijack an account session (compounded by M-3).
**Mitigation:** Set `secure: true` and use port 465 for production SMTP (implicit TLS). If the relay requires STARTTLS on port 587, keep `secure: false` but add `requireTLS: true` to refuse connections that do not offer STARTTLS.
```ts
this.transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: EMAIL_PORT,
  secure: true,         // implicit TLS (port 465)
  // OR: secure: false, requireTLS: true  (port 587, STARTTLS required)
  auth: { user: EMAIL_USER, pass: EMAIL_PASSWORD },
});
```
**References:** CWE-319 (Cleartext Transmission of Sensitive Information) · OWASP A02:2021

---

#### L-3 — `@SkipThrottle()` on `GET /auth/confirm-email` removes all rate protection

**Where:** `server/src/modules/auth/auth.controller.ts:97`
**Category:** Rate limiting
**What:** The `confirmEmail` handler is decorated with `@SkipThrottle()`, bypassing the controller-level `ThrottlerGuard` entirely. The intent is to prevent throttler false-positives from blocking users who click their confirmation link — a reasonable UX concern. However, the endpoint accepts a `token` query parameter and performs a JWT verification, a database write (`setEmailVerified`), and a database read (`findById`) on every call. With no rate limit, the endpoint is susceptible to unlimited requests.
**Attack vector:** An attacker with a valid confirmation token (e.g., captured via M-3) could replay it at unlimited rate. Additionally, flooding the endpoint with junk tokens causes amplified database lookups and JWT verification work with no per-IP cost signal.
**Impact:** Amplified load on PostgreSQL and JWT verification under flood. Replay of captured tokens not gated by rate limits. Risk is bounded because: (a) JWTs cannot be brute-forced, (b) the server rejects invalid tokens early (JWT verify before DB call).
**Mitigation:** Apply a moderate per-IP rate limit specific to this endpoint rather than removing all rate limiting. `@Throttle({ default: { limit: 10, ttl: 60_000 } })` is sufficient — a real user clicking a link needs at most one request; even retrying up to ten times per minute is generous.
```ts
@Throttle({ default: { limit: 10, ttl: 60_000 } })
@HttpCode(200)
@Get('confirm-email')
confirmEmail(...) { ... }
```
**References:** OWASP A04:2021 (Insecure Design) · CWE-770 (Allocation of Resources Without Limits)

---

#### L-4 — BFF `resend-confirmation` route forwards unvalidated `email` from request body

**Where:** `client/app/api/auth/resend-confirmation/route.ts:6`
**Category:** Input validation (client)
**What:** The BFF route does `const { email } = await req.json()` and forwards the value directly to the backend without schema validation. If `email` is not a string, is missing, or is an oversized payload, the error surfaces from the backend (`class-validator` on `ResendConfirmationDto`). The server-side guard prevents any harm, but the BFF represents a proxy layer that should validate its own inputs rather than relying on downstream rejection.
**Attack vector:** Sending `{ "email": null }` or a 10 MB string to the BFF route — the BFF forwards it to NestJS which rejects it, but the BFF's own error-handling path (`withNextErrorResponse`) runs with the unvalidated input before the backend responds.
**Impact:** Low — backend validation is the effective control; BFF merely passes through invalid input without a first-line check. No security bypass exists in the current code. Principally a defense-in-depth gap.
**Mitigation:** Add a minimal Zod parse before forwarding:
```ts
import { z } from 'zod';
const schema = z.object({ email: z.string().email().max(254) });

const resendConfirmation = async (req: Request) => {
  const { email } = schema.parse(await req.json());
  const result = await resendConfirmationServer(email);
  return NextResponse.json(result);
};
```
**References:** OWASP A03:2021 · CWE-20 (Improper Input Validation)

---

### Info

#### I-1 — `EmailService.sendEmail` writes message metadata to stdout with `console.log`

**Where:** `server/src/modules/email/email.service.ts:43`
**Category:** Sensitive data exposure
**What:** `console.log('Message sent: %s', info.messageId)` logs the SMTP message ID to stdout after every email send. The message ID includes the relay domain (e.g., `<abc123@smtp.mailtrap.io>`), which leaks the SMTP relay identity. In structured-logging environments, stdout lines are often ingested into log aggregators (Datadog, CloudWatch, ELK) where this information is persisted and potentially searchable. The `to` address is not in this particular log line, so direct PII exposure is limited.
**Attack vector:** No current vector — the log does not contain the JWT or the recipient address. An attacker with log-read access gains SMTP relay identity only.
**Impact:** Minor — SMTP relay identity is low-sensitivity. Nonetheless, prod logging should route through the application's structured logger, not `console.log`, to allow log-level control and redaction.
**Mitigation:** Replace with the NestJS logger: `this.logger.debug(`Confirmation email dispatched: ${info.messageId}`)` with `@nestjs/common Logger`. Set log level to `debug` so it can be suppressed in production.

---

#### I-2 — Single-use confirmation token invalidation deferred (known spec tradeoff)

**Where:** Spec §7 Product Tradeoffs, ADR-FEAT-008-02 §7
**Category:** Session
**What:** The spec and ADR explicitly defer single-use invalidation. A confirmation link remains valid for its full TTL (nominally 24 h; currently ~86 s due to M-2) regardless of whether it has already been clicked. A second click on the same link after the account is already verified is a no-op (the `setEmailVerified` update is idempotent), but the server still issues a fresh session (access + refresh tokens) on every successful `confirmEmail` call — even after the account is already verified.
**Attack vector:** An attacker who captures the confirmation link (via M-3) can use it after the legitimate user has already confirmed — receiving a fresh session for the account.
**Impact:** Session token issuance on re-confirmation of an already-verified account. Combined with M-3 (link captured from logs), this allows post-confirmation account hijacking within the TTL window.
**Mitigation:** The ADR already identifies the fix: store a `confirmationTokenId` UUID in Redis with a short TTL; the confirmation endpoint checks and burns it atomically via `getDel`. No schema migration needed. This should be prioritised, especially once M-2 is fixed and the TTL is actually 24 hours.

---

## Dependency review

Static lockfile inspection. **Not** a live CVE scan. Recommend running `npm audit` / Snyk / GitHub Dependabot in CI.

| Package | Version (lockfile) | Issue | Severity | Notes |
|---|---|---|---|---|
| `@nestjs/throttler` | 6.5.0 | No widely-known CVEs | I | New dependency added by this feature. Well-maintained. |
| `nodemailer` | 7.0.1 | Possible lockfile/manifest mismatch | I | `server/package.json` declares `^7.0.6`; lockfile records `7.0.1`. Since `7.0.1 < 7.0.6`, this version does not satisfy the declared range — `npm ci` may install a different version or error. Run `npm install` and commit the updated lockfile. |
| `bcrypt` | 6.0.0 | No widely-known CVEs | I | Major version; timing-safe; rounds=10 is current best practice. |
| `jsonwebtoken` | 9.0.7 | No widely-known CVEs | I | Wrapped by `@nestjs/jwt`. Recent v9 minor. |
| `helmet` | 8.2.0 | No widely-known CVEs | I | Recent. |
| `ioredis` | 5.7.0 | No widely-known CVEs | I | Recent. |

---

## Compliance touchpoints

- **PII detected:** Yes — email addresses (in registration, confirmation flow, resend flow, Redis key namespace `resend_limits:{email}`, SMTP `To:` header)
- **Sensitive categories (GDPR Art. 9 / HIPAA / PCI-DSS / COPPA):** None — email-only; no financial, health, biometric, or minor-specific data
- **Cross-border data transfer:** Depends on deployment SMTP relay — not determinable from static analysis. If `EMAIL_HOST` routes through a US or EU relay, GDPR data transfer rules may apply.
- **Audit logging of sensitive operations:** Partial — email sends log message IDs (see I-1). Account verification state changes (`setEmailVerified`) and failed login attempts (`EMAIL_NOT_VERIFIED`) are not explicitly audit-logged.
- **Data retention / deletion:** `resend_limits:{email}` keys expire after 3600 s (Redis TTL). Confirmation JWTs have no server-side record — they are stateless. No explicit data deletion path is introduced by this feature.

### OWASP Top 10 (2021) coverage map
- A01 Broken Access Control: ✅ Full — `emailVerified` guard on login verified; no IDOR introduced
- A02 Cryptographic Failures: ⚠️ Partial — bcrypt correct; shared JWT secret (L-1); SMTP `secure: false` (L-2); `expiresIn` bug (M-2)
- A03 Injection: ✅ Full — parameterised queries; `whitelist: true` validation pipe; no shell/template injection
- A04 Insecure Design: ⚠️ Partial — `@SkipThrottle()` on confirm-email (L-3); deferred single-use invalidation (I-2)
- A05 Security Misconfiguration: ⚠️ Partial — `secure: false` SMTP (L-2); `expiresIn: '86400'` string (M-2)
- A06 Vulnerable & Outdated Components: ⚠️ Partial — static inspection only; nodemailer lockfile mismatch (I — dep review)
- A07 Identification & Authentication Failures: ⚠️ Partial — email enumeration via register and resend (M-1, M-4); confirmation JWT TTL bug (M-2)
- A08 Software & Data Integrity Failures: ✅ Full — no unsigned data, no deserialization of untrusted objects introduced
- A09 Security Logging & Monitoring Failures: ⚠️ Partial — `console.log` in EmailService (I-1); no audit log for account verification events
- A10 Server-Side Request Forgery (SSRF): N/A — no server-side HTTP to user-supplied URLs

---

## Open questions for the user

1. **SMTP TLS policy**: Is `EMAIL_PORT` set to 465 (implicit TLS) or 587 (STARTTLS) in production? If 587, should `requireTLS: true` be added to refuse cleartext connections? The answer changes the severity of L-2.
2. **Email enumeration tradeoff for register**: The spec does not address anti-enumeration on `POST /auth/register`. Is the UX benefit of an explicit "email already exists" message worth the enumeration risk, given this is an admin CRM tool with a limited user base?
3. **Existing user backfill**: The ADR (§7 Known Limitations) notes that all accounts at migration time will be `emailVerified = false`. Is there a backfill plan before production deployment?
4. **Confirmation token secret**: Is introducing `JWT_CONFIRMATION_SECRET` as a separate env var feasible for the current deployment pipeline, or is a shared-secret with strict purpose-check sufficient for v1?

---

## Out of scope for this audit

- Penetration testing — static analysis only.
- Infrastructure / deployment hardening (firewalls, WAF, IAM policies, TLS termination at ingress).
- Compliance certification — touchpoints flagged, not certified.
- Code-quality issues unrelated to security → `sdlc-review`.
- Test coverage of security paths → `sdlc-tests` (noted where a defense lacks test coverage).
- Threat modeling beyond FEAT-008 scope — system-wide threat model lives with `sdlc-adr` and `sdlc-docs`.
