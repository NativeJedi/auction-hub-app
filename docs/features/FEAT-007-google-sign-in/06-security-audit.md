# Security Audit — FEAT-007: Google Sign-In for CRM

**Feature:** FEAT-007-google-sign-in
**Auditor:** sdlc-security (inline — subagent available; ran inline to keep the cross-cutting findings (account-linking + auth-surface rate limiting + JWT defaults) in one cognitive pass)
**Audit base:** `main..feat/FEAT-007-google-sign-in` (working tree clean)
**Audit scope:** full feature diff
**Scope size:** 53 files, +3320 / −65 lines (production code ~30 files; rest are docs + tests + lockfile)
**Date:** 2026-05-26

---

## Summary

The Google Sign-In flow itself is implemented soundly on the happy path: ID-token verification is delegated to `google-auth-library` (`OAuth2Client.verifyIdToken` — signature + `aud` + `iss` + `exp`), the server-generated nonce uses 256 bits of CSPRNG entropy and is bound to the ID token's `nonce` claim, `email_verified` is asserted before user resolution, no `GOOGLE_CLIENT_SECRET` is required or stored, and no Google-token material is persisted server-side. ADR-FEAT-007-02's chosen Option A is matched line-for-line.

The audit's one production-blocking finding is **C-1 — automatic account linking without proof of ownership**: the spec (§12) acknowledges that "email verification for the email+password signup flow must ship before this feature reaches production, so that FR-5 cannot bind a Google account to an unverified existing record"; that dependency is not implemented, which makes the `findByEmail → linkGoogleId` path at `google-auth.service.ts:111-115` a viable pre-emption-based account-takeover surface. This is not a flaw in the FEAT-007 code — it is the unmet prerequisite the spec called out, and the audit surfaces it as a Critical because the prerequisite is now functionally on the critical path for going to prod.

The high-impact gaps below the takeover finding are operational rather than design-level: no rate limiting anywhere on auth surface (H-1), and pre-existing fallback JWT secrets that became reachable through the new public Google entry point (H-2). The medium findings are textbook: a TOCTOU window in the Redis nonce consume (M-1), no security headers on the Nest app (M-2), and an unbounded `credential` length on the DTO (M-3).

The two narrowly-architectural risks the ADR explicitly accepts — nonce-on-success-only (DoS-vs-replay tradeoff, ADR §6) and ID-token transiting browser JS (XSS-becomes-credential-theft, ADR §6) — are recorded as Info, not findings.

**Counts:** Critical: 1 · High: 2 · Medium: 3 · Low: 3 · Info: 5

---

## Threat model

### Trust boundaries
- Internet → BFF (Next.js API routes under `client/app/api/auth/google/*`)
- BFF (Next runtime) → Nest API (`server/src/modules/auth/auth.controller.ts`)
- Nest → PostgreSQL (`user` table, unique `email` / unique `googleId`)
- Nest → Redis (nonce store at `oauth:nonce:${nonce}`, 300 s TTL)
- Browser → `accounts.google.com` (GIS script + Google's identity assertion)
- BFF → browser (HttpOnly `session_id` cookie carrying the Redis session key)

### Attack surface

| Surface | Type | Authenticated? | Rate-limited? | Input shape |
|---|---|---|---|---|
| `GET /api/auth/google/nonce` | HTTP (BFF proxy) | No | **No** | none |
| `POST /api/auth/google` | HTTP (BFF) | No | **No** | `{ credential: string, nonce: string }` |
| `GET /auth/google/nonce` | HTTP (Nest) | No | **No** | none |
| `POST /auth/google` | HTTP (Nest) | No | **No** | `{ credential: string, nonce: string }` (validated via class-validator) |
| Auth page `client/app/crm/auth/page.tsx` | Browser route | No | n/a | renders `GoogleSignInButton` on login + register views; mounts `accounts.google.com/gsi/client` |

### Sensitive data flows
- Google ID token (JWT) → browser JS in `googleAuthService.handleCredential` (`googleAuthService.ts:86-106`) → BFF JSON body → Nest `OAuth2Client.verifyIdToken` → discarded after verify (never logged, never persisted).
- Email (`payload.email`) → either matched against existing `user.email` or inserted as a new `user.email`. Returned to client in `AuthResponseDto.user.email`.
- Google account ID (`payload.sub`) → persisted as `user.googleId` (`user.entity.ts:15-16`, varchar(255), unique, nullable). Never returned to client.
- Access + refresh JWTs → BFF `sessionStorage.create` → Redis session row keyed by HttpOnly `session_id` cookie (`SESSION_COOKIE_SETTINGS` in `client/src/services/session/constants.ts`). Tokens never reach browser JS.
- Nonce → Nest mints CSPRNG-256-bit hex → Redis under `oauth:nonce:${nonce}` (300 s TTL) → BFF transparent proxy → browser → bound to GIS-issued JWT's `nonce` claim → POSTed back → Nest consumes (deletes from Redis on success).

---

## Coverage

| Area | Coverage | Notes |
|---|---|---|
| Authentication | ✅ Full | New unauthenticated entry point + token-verification path audited end-to-end. |
| Authorization | ✅ Full | Post-auth — issues the same `AuthResponseDto` as `/auth/login`; no new authz surface introduced (no admin scopes, no role flags). |
| Input validation (server) | ✅ Full | `GoogleAuthDto` uses `@IsString @IsNotEmpty`; see M-3 for missing length cap. |
| Input validation (client) | ✅ Full | Client passes through to BFF; BFF re-checks in `route.ts:11-13` (hand-rolled, see L-2). |
| XSS | ⚠️ Partial | Auth page uses standard React escaping. ADR §6 explicitly accepts "ID token transits browser JS briefly". No CSP backstop — see M-2. |
| CSRF | ✅ Full | Pre-session entry; `SameSite=Lax` on the session cookie covers post-session state changes. See I-4. |
| SQL injection | ✅ Full | All queries via TypeORM `Repository.findOneBy / save / update`; no raw SQL on the new code path. |
| NoSQL injection | N/A | No Mongo / DynamoDB / equivalent. |
| Command injection | N/A | No `exec / spawn` on the audited surface. |
| Secrets handling | ⚠️ Partial | No client secret in the flow ✅. But pre-existing JWT-secret defaults (H-2) are reachable from this surface. |
| Dependency vulnerabilities | ⚠️ Partial | Static lockfile inspection only — recommend `npm audit` / Dependabot in CI. |
| CORS | ⚠️ Partial | No `app.enableCors(...)` in `server/src/main.ts`; today's deployment is BFF-only (browser never hits Nest direct), so cross-origin is N/A. Flag for any future direct-from-browser surface. |
| Rate limiting | ❌ Out of scope (implementation) — see H-1 | No `@nestjs/throttler` or equivalent anywhere; finding raised. |
| Sensitive data exposure | ✅ Full | No tokens in logs; only coarse `reason` codes in error responses. |
| Session management | ✅ Full | Same `SESSION_COOKIE_SETTINGS` (`HttpOnly`, `SameSite=Lax`, `Secure` in prod) as the existing password login. |
| Cryptography | ✅ Full | Nonce uses `crypto.randomBytes(32)`. Nonce comparison uses `timingSafeEqual`. Passwords use `bcrypt`. ID-token signature verification delegated to `google-auth-library`. |
| Security headers | ❌ Out of scope (implementation) — see M-2 | No helmet / CSP / HSTS on the Nest app. |
| File uploads | N/A | None on this feature surface. |
| SSRF | N/A | No server-side outbound calls on user input on the new code path (`OAuth2Client` fetches Google JWKS, not a user-supplied URL). |
| Open redirect | ✅ Full | Post-auth redirect is hard-coded `/crm/auctions` in `useGoogleSignIn.ts:7`. |
| Path traversal | N/A | No filesystem reads/writes from user input. |

---

## Findings

### Critical

#### C-1 — Automatic Google→email link enables account takeover via pre-emption
**Where:** `server/src/modules/auth/google-auth.service.ts:111-115`, `server/src/modules/auth/auth.service.ts:56-79` (register flow), `docs/features/FEAT-007-google-sign-in/01-feature-spec.md` §12 (dependency note)
**Category:** AuthN
**What:** When a Google sign-in arrives for an email that already matches an existing email+password user, `resolveUser` calls `usersService.linkGoogleId(byEmail.id, payload.sub)` and returns the linked user — no proof that the requester owns either side of the link. The implementation deliberately defers the "proof-of-ownership" responsibility to email-verification on the email+password signup flow, and the spec (§12, References) calls this out explicitly: *"Dependency: email verification for the email+password signup flow must ship before this feature reaches production, so that FR-5 cannot bind a Google account to an unverified existing record."* That dependency is **not** implemented — `auth.service.register()` at `auth.service.ts:65-71` creates the user with `email` and bcrypt'd `password`, sets no `emailVerified` flag, and sends no verification email. The audit is raising this as Critical because the spec's own production gate is unmet.
**Attack vector:**
1. Attacker registers `victim@gmail.com` via `POST /api/auth/register` with a password they choose. No email verification means no proof the attacker owns the address — the account is created and persists.
2. The legitimate owner of `victim@gmail.com` later signs in with Google on the CRM.
3. `resolveUser` finds no `googleId` match, finds the attacker-controlled `byEmail` record, and links the real Google account to it (`usersService.linkGoogleId` at `users.service.ts:39-44`).
4. Both the attacker (with the chosen password) and the legitimate user (with Google) can now sign in to the same record.
**Impact:** Full account takeover from the public surface. The attacker reads / mutates the victim's CRM data — auctions, lots, buyers, room state — and can invite themselves as a member, finish auctions, alter results. Triggered with one pre-registration request per target email.
**Mitigation:** Either (a) ship the email-verification dependency *before* exposing Google sign-in to real users — add an `emailVerified: boolean` column on `user`, gate `linkGoogleId` on `byEmail.emailVerified === true`, and require verification on the existing register flow; or (b) treat the existence of an email+password record as evidence in itself only when an `emailVerified` flag is set, and otherwise require the Google flow to send a verification challenge to the same email before linking. Sketch:
```ts
private async resolveUser(payload) {
  const byGoogleId = await this.usersService.findByGoogleId(payload.sub);
  if (byGoogleId) return byGoogleId;

  const byEmail = await this.usersService.findByEmail(payload.email);
  if (byEmail) {
    if (!byEmail.emailVerified) {
      throw new ApiAuthorizationError(); // refuse to link to an unverified record
    }
    await this.usersService.linkGoogleId(byEmail.id, payload.sub);
    return byEmail;
  }
  // Brand-new Google user: emailVerified is implied by payload.email_verified === true
  return this.usersService.create({ email: payload.email, googleId: payload.sub, password: null, emailVerified: true });
}
```
**References:** OWASP A07:2021 (Identification & Authentication Failures) · CWE-287 (Improper Authentication) · CWE-1240 (Use of a Cryptographic Primitive with a Risky Implementation) · ASVS V2.7.1, V2.7.3 · Spec §12 (Dependency note)
**Severity rationale:** Direct account takeover from a public unauthenticated surface with no preconditions other than knowing a target email — Critical. The spec itself names this exact scenario as a prerequisite; treating it as anything less than Critical would mean overriding the spec's own production gate.

---

### High

#### H-1 — No rate limiting on any auth endpoint
**Where:** `server/src/main.ts:1-34` (no throttler / no helmet); affects `auth.controller.ts:38, 50, 62, 71, 84, 93` and the BFF proxies in `client/app/api/auth/*/route.ts`
**Category:** Rate limiting
**What:** Nest is bootstrapped with no rate limiter (`@nestjs/throttler` or equivalent is not imported, not in `package.json`, not registered globally or on any controller). The new endpoints — `GET /auth/google/nonce` and `POST /auth/google` — and the existing `POST /auth/login`, `/auth/register`, `/auth/refresh` are all unauthenticated and unthrottled. `GET /auth/google/nonce` is particularly exposed because every call writes a 64-byte Redis row with a 300 s TTL.
**Attack vector:**
- **Redis amplification DoS:** Attacker scripts `GET /auth/google/nonce` at 1 k req/s. Each call mints a 32-byte random hex (64-byte value) keyed under `oauth:nonce:<64-hex>` (~80-byte key) and TTL'd for 300 s. Steady state: ~150 k entries / ~22 MB if perfectly bounded, but with no IP throttle the attacker scales horizontally — easily into hundreds of MB until Redis eviction kicks in.
- **Credential stuffing on `/auth/login`:** Standard unthrottled brute force.
- **Account enumeration via Google sign-in:** `POST /auth/google` returns `INVALID_AUTH` (bad token) vs `NONCE_NOT_FOUND` (valid token, missing nonce) vs `200` — combined with timing differences, an attacker with a stolen Google ID token can probe nonce existence.
**Impact:** Redis fill DoS, account brute force, and account enumeration are all available against the production auth surface. Compounds with C-1 (an attacker scripting register-with-victim-email needs no rate budget).
**Mitigation:** Add `@nestjs/throttler` globally and tighter limits on auth controllers. Sketch:
```ts
// app.module.ts
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
{ provide: APP_GUARD, useClass: ThrottlerGuard },
// auth.controller.ts
@Throttle({ default: { ttl: 60_000, limit: 5 } })
@Post('login') login(...) {...}

@Throttle({ default: { ttl: 60_000, limit: 10 } })
@Get('google/nonce') googleNonce() {...}
```
Tie throttling to client IP (with `X-Forwarded-For` correctly trusted at the reverse proxy) for unauthenticated routes; per-userId for authenticated routes.
**References:** OWASP A04:2021 (Insecure Design) · CWE-307 (Improper Restriction of Excessive Authentication Attempts) · CWE-770 (Allocation of Resources Without Limits or Throttling) · ASVS V2.2.1, V11.1.4
**Severity rationale:** Reachable from the public surface, multiple distinct attack chains, no preconditions. Not Critical because none of the individual chains is a direct credential theft; the aggregate is severe but not "RCE-grade".

#### H-2 — JWT secret fallbacks are hardcoded and reachable from the new public surface
**Where:** `server/src/config/app.config.ts:51-56`
**Category:** Secrets
**What:** The JWT secret loading uses `||` fallbacks: `process.env.JWT_ACCESS_SECRET || 'access_default'`, `process.env.JWT_REFRESH_SECRET || 'refresh_default'`, `process.env.JWT_ROOM_MEMBER_INVITE_TOKEN_SECRET || 'invite_default'`, `process.env.JWT_ROOM_MEMBER_TOKEN_SECRET || 'member_default'`. Any environment that boots the server without all four env vars set (a misconfigured deploy, a forgotten staging env var, a hotfix container) will sign and verify production JWTs with secrets that are public in the source tree. This is pre-existing — but the feature opens a new public unauthenticated path (`POST /auth/google`) that mints tokens with these very secrets, increasing the practical blast radius.
**Attack vector:** Attacker checks the public repository (or guesses `access_default` / `refresh_default` — names are obvious). If the target environment is missing one of those env vars at boot, JWTs signed by the server are universally forgeable: attacker signs `{ sub: '<known-user-uuid>', email: '<known-email>' }` with `access_default` and presents it as a Bearer token → bypasses `AuthGuard`. Combined with C-1 / H-1, the attack chain compresses to "find any deploy with missing env, instantly impersonate any user".
**Impact:** Full session forgery → bypass of every authenticated endpoint (auction CRUD, lot management, room admin actions). Even single-environment slip is catastrophic.
**Mitigation:** Fail closed at boot. Replace `||` fallbacks with an explicit assertion:
```ts
const required = ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET', 'JWT_ROOM_MEMBER_INVITE_TOKEN_SECRET', 'JWT_ROOM_MEMBER_TOKEN_SECRET'];
for (const key of required) {
  if (!process.env[key] || process.env[key].length < 32) {
    throw new Error(`Missing or short ${key} — refusing to boot.`);
  }
}
```
Optionally enforce via Zod schema on env vars at module init.
**References:** CWE-798 (Use of Hard-coded Credentials) · CWE-1188 (Insecure Default Initialization of Resource) · ASVS V6.4.1, V14.1.3 · OWASP A02:2021 (Cryptographic Failures)
**Severity rationale:** Out-of-feature-scope but inside the audit's blast-radius perimeter — the new Google sign-in path issues tokens signed with these very secrets. Raising at High (not Critical) because exploitation requires a misconfigured deploy; raising at High (not Medium) because the consequence is total session forgery and the deploy pattern is realistic.

---

### Medium

#### M-1 — TOCTOU on nonce consumption: `get` + `clear` is not atomic
**Where:** `server/src/modules/auth/google-auth.service.ts:63-67`
**Category:** AuthN (CSRF defense)
**What:** The nonce consume sequence is `await nonces.get(nonce)` then `await nonces.clear(nonce)` — two separate Redis round-trips. Two concurrent `POST /auth/google` requests presenting the same `{credential, nonce}` pair can both pass `nonces.get()` before either reaches `nonces.clear()`, defeating the single-use guarantee for the duration of that window.
**Attack vector:** Attacker captures a victim's `{credential, nonce}` pair via a TLS-broken proxy, a logged network capture, a misconfigured corporate-MITM, or compromised observability tooling. Within the millisecond-scale window between the legitimate POST's `get` and `clear`, attacker fires a second POST → both sign in successfully as the victim → attacker now holds a valid session.
**Impact:** One extra successful sign-in per intercepted credential. Doesn't undermine the OAuth flow's primary defense (the Google-signed JWT is still required) but does undermine the "single-use" guarantee the nonce mechanism is designed to provide. Real-world likelihood is low (requires credential interception) but the fix is trivial.
**Mitigation:** Use Redis `GETDEL` (Redis ≥ 6.2) or a small Lua script. Sketch:
```ts
// Add to RedisSimpleRepository
async getDel(key: CombinedKey): Promise<T | null> {
  const entity = await this.client.getdel(this.getFullKey(key));
  return entity ? (JSON.parse(entity) as T) : null;
}
// google-auth.service.ts
const nonceExists = await this.nonces.getDel(nonce);
if (!nonceExists) throw new ApiNonceNotFoundError();
```
**References:** CWE-367 (TOCTOU Race Condition) · CWE-362 (Race Condition)
**Severity rationale:** Real but narrow — needs credential interception (which already implies broken transport) and millisecond timing. Not Low because the contract violation ("single-use nonce") is the very point of the mechanism.

#### M-2 — No security headers on Nest responses; auth page has no CSP backstop for the ID-token surface
**Where:** `server/src/main.ts:1-34` (no `helmet`); `client/app/crm/auth/page.tsx` (loads `accounts.google.com/gsi/client` via `client/src/modules/google-auth/gisLoader.ts:3`)
**Category:** Headers
**What:** The Nest app sets no `Content-Security-Policy`, `Strict-Transport-Security`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, or `X-Frame-Options`. There is no `helmet` middleware in the `package.json` dependency list. The CRM auth page now handles a Google ID token in browser JS for milliseconds (ADR §6 explicitly accepts this XSS-becomes-token-theft risk), but no CSP exists to constrain inline scripts or third-party script sources — meaning a stored or reflected XSS anywhere on the auth route exfiltrates the ID token to an attacker-controlled origin before it reaches the server.
**Attack vector:** Any XSS sink that lands on `/crm/auth` — e.g. a future feature that renders untrusted text without escaping, or a vulnerable dependency in the CRM-shell layout — escalates from "DOM access" to "Google ID token + nonce theft → attacker presents to `/auth/google` from their own machine and signs in as the victim". Without HSTS, a one-time downgrade attack on first visit can intercept the same flow.
**Impact:** Elevates any future XSS / mixed-content / clickjacking finding from "site annoyance" to "auth credential theft". The Google sign-in surface is the primary high-value target on the page.
**Mitigation:** Add `helmet` with a per-route CSP. Strict CSP for `/crm/auth`:
```ts
// main.ts
import helmet from 'helmet';
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", 'https://accounts.google.com/gsi/client'],
      connectSrc: ["'self'", 'https://accounts.google.com/gsi/'],
      frameSrc: ['https://accounts.google.com/'],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
    },
  },
  strictTransportSecurity: { maxAge: 31_536_000, includeSubDomains: true, preload: true },
}));
```
Mirror the CSP on the Next.js side (`next.config.ts` headers function) since the BFF serves the auth page HTML.
**References:** OWASP A05:2021 (Security Misconfiguration) · CWE-693 (Protection Mechanism Failure) · ASVS V14.4.1, V14.4.3, V14.4.5
**Severity rationale:** Defense-in-depth gap rather than directly exploitable today, but the ADR explicitly elevates the consequence of any future XSS on this page. Medium, not Low, because the auth route is the highest-value page on the surface.

#### M-3 — `GoogleAuthDto.credential` has no max-length validator
**Where:** `server/src/modules/auth/dto/google-auth.dto.ts:5-15`
**Category:** Input validation (server)
**What:** Both `credential` and `nonce` are validated only with `@IsString @IsNotEmpty`. No `@MaxLength` cap. A real Google ID token is ~1-3 KB; the DTO will happily accept multi-MB payloads, which are then handed to `OAuth2Client.verifyIdToken` for JWT parsing. With the global Nest `body-parser` default (typically 100 KB or 1 MB depending on adapter), payloads up to the body-parser limit reach the verifier per request — combined with no rate limit (H-1), this is a cheap CPU amplifier.
**Attack vector:** Attacker POSTs maximum-size garbage payloads to `/auth/google` at high rate → server spends CPU on JSON parse + JWT decode for each. Doesn't bypass verification (the signature check fails) but does consume verification budget.
**Impact:** Modest DoS amplifier on the verification path. Not catastrophic on its own; compounds with H-1.
**Mitigation:** Cap both fields. Sketch:
```ts
@IsString() @IsNotEmpty() @MaxLength(4096)
credential: string;

@IsString() @IsNotEmpty() @MaxLength(128)
nonce: string;
```
**References:** CWE-770 (Allocation of Resources Without Limits) · ASVS V13.1.4
**Severity rationale:** Defense-in-depth — the verifier rejects the payload either way. Medium, not Low, because the fix is one-line and the cost of leaving it is real CPU under attack.

---

### Low

#### L-1 — No audit logging of security-relevant events
**Where:** `server/src/modules/auth/google-auth.service.ts` (entire file); `server/src/modules/auth/auth.service.ts:81-95`
**Category:** Sensitive data / Operational
**What:** No log lines for: failed credential verification, `email_verified === false` rejection, nonce mismatch, nonce-not-found (TTL elapsed or replay), successful new-user creation, successful Google-to-existing-user link, or successful sign-in. The `withNextErrorResponse` middleware (`client/src/api/core/middlewares.ts:14-15`) only logs "Unknown error" for non-HTTP errors. This makes forensic reconstruction of an attack against C-1 / H-1 / H-2 essentially impossible.
**Attack vector:** N/A — operational gap.
**Impact:** Post-incident investigation has no signal. SOC 2 CC7.2 / GDPR Art. 30 (records of processing) readiness affected.
**Mitigation:** Add a small structured logger on the Google-auth path. At minimum: `{event, userId?, email?, googleId?, ip, reason}` for failed branches; `{event, userId, linkedFromEmailUser?}` for success branches. Avoid logging the credential itself.
**References:** OWASP A09:2021 (Security Logging & Monitoring Failures) · ASVS V7.1.1, V7.2.1

#### L-2 — BFF hand-rolls `credential and nonce required` validation instead of forwarding Nest's class-validator response
**Where:** `client/app/api/auth/google/route.ts:11-13`
**Category:** Input validation (client) / consistency
**What:** The BFF route checks `if (!credential || !nonce)` and returns a hand-rolled `{ message: 'credential and nonce are required' }, status: 400` — instead of forwarding the request to Nest and letting `ValidationPipe` produce the standard class-validator error shape. Two different 400 shapes appear on the wire depending on which check fails first. Not a vulnerability, but the inconsistency lets a probing attacker fingerprint where each layer's validation lives.
**Attack vector:** Information disclosure — attacker learns the BFF-vs-Nest boundary by varying input.
**Impact:** Minor reconnaissance signal. No direct impact.
**Mitigation:** Drop the hand-rolled check; let Nest's `ValidationPipe` answer. `withNextErrorResponse` already forwards Nest 400s verbatim.
**References:** ASVS V14.5.1 (consistent error responses)

#### L-3 — User-creation race on first sign-in
**Where:** `server/src/modules/auth/google-auth.service.ts:103-122`
**Category:** AuthN / concurrency
**What:** `resolveUser` reads `findByGoogleId` → `findByEmail` → `create` in three independent queries. Two concurrent first-sign-ins for the same Google account (e.g. user double-clicks the Google button before the first request completes; or One-Tap fires alongside the explicit click) can both miss the lookups and both reach `usersService.create`. The unique constraint on `email` (or on `googleId`) will reject one of them — surfaced as a TypeORM error → Nest 500 → end user sees a generic failure.
**Attack vector:** N/A (user-triggered; not an attack).
**Impact:** Bad UX on a narrow race; no security impact because the unique constraint enforces correctness.
**Mitigation:** Either an `INSERT ... ON CONFLICT (email) DO NOTHING RETURNING *` (Postgres upsert) or catch the unique-violation in `resolveUser` and retry the lookup once. Sketch:
```ts
try {
  return await this.usersService.create({ email: payload.email, googleId: payload.sub, password: null });
} catch (err) {
  if (isUniqueViolation(err)) {
    // Lost the race — refetch
    return (await this.usersService.findByEmail(payload.email))!;
  }
  throw err;
}
```
**References:** CWE-362 (Race Condition)

---

### Info

#### I-1 — Nonce-on-success-only consume is a deliberate ADR-recorded tradeoff
**Where:** `server/src/modules/auth/google-auth.service.ts:42-43` (in-code comment), `docs/features/FEAT-007-google-sign-in/03-adr.md` §6 (Tradeoffs)
**Category:** AuthN
**What:** The nonce is consumed (`nonces.clear(nonce)`) only on the all-checks-pass path. On any rejection branch (bad signature, mismatched `payload.nonce`, `email_verified: false`) the nonce stays in Redis for the remainder of its 300 s TTL. The code's inline comment and ADR-02 §6 both justify this with: burning the nonce on first read would let an unauthenticated attacker invalidate a victim's nonce via a garbage `{credential, nonce}` POST (cheap DoS). The verify-first design forecloses that — to invalidate a nonce, the attacker must present a Google-signed JWT bound to that exact nonce, which is precisely what the nonce mechanism is built to prevent. Worth recording in the audit so a future re-audit does not re-flag it.
**Attack vector:** N/A (design choice recorded).
**Impact:** None.
**Mitigation:** None required. Keep current behavior.
**References:** ADR-FEAT-007-02 §6

#### I-2 — `google-auth-library@10.6.2` — static lockfile review only
**Where:** `server/package.json`, `server/package-lock.json`
**Category:** Dependencies
**What:** `google-auth-library@10.6.2` is the current major, actively maintained by Google. No widely-known CVEs in this version range as of the audit date. **This is static lockfile inspection only — not a live CVE scan.**
**Mitigation:** Add `npm audit` (or Snyk / Dependabot) to CI for continuous coverage.

#### I-3 — Nest server reads `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
**Where:** `server/src/config/app.config.ts:79`
**Category:** Secrets handling / config
**What:** The Nest server reads `process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID` — a `NEXT_PUBLIC_*` prefix is Next.js convention for "expose to browser bundle". The OAuth client ID is intentionally public (it's printed in every JWT's `aud`), so this is **not a leak**. The cross-workspace coupling (server reading a client-prefixed env var) is worth flagging only for clarity.
**Mitigation:** Optional — set both `GOOGLE_CLIENT_ID` (server) and `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (client) to the same value, and have the server read `GOOGLE_CLIENT_ID`. Pure tidiness.

#### I-4 — No CSRF token on BFF auth POSTs
**Where:** `client/app/api/auth/google/route.ts`, `client/app/api/auth/login/route.ts`
**Category:** CSRF
**What:** No CSRF token / SameSite preflight on the auth POST endpoints. Not a finding because these endpoints are the pre-session entry point — there is nothing to "ride" on a CSRF attack (no session cookie yet, and the attacker forcing a victim to authenticate as the attacker is not a meaningful threat). Post-session state-changing endpoints rely on `SameSite=Lax` on the `session_id` cookie (`client/src/services/session/constants.ts`).
**Mitigation:** None required.

#### I-5 — `useGoogleSignIn` cleanup doesn't cancel in-flight requests
**Where:** `client/src/modules/google-auth/useGoogleSignIn.ts:31`, `client/src/modules/google-auth/googleAuthService.ts:54-72`
**Category:** Other
**What:** `service.stopInit()` flips `disposed = true` and calls `gis?.cancel()`, but the awaited `loadGisScript()`, `getGoogleNonce()`, and `googleAuth()` promises continue. Each await checks `this.disposed` afterwards (`googleAuthService.ts:55, 59`) and bails on the next state mutation, which prevents the post-cleanup callbacks from firing — but doesn't actually cancel the in-flight HTTP. Pure UI concern, no security impact.
**Mitigation:** Optional — pass an `AbortController.signal` to the axios calls.

---

## Dependency review

Static lockfile inspection. **Not** a live CVE scan. Recommend running `npm audit` / Snyk / GitHub Dependabot in CI.

| Package | Version | Issue | Severity | Notes |
|---|---|---|---|---|
| `google-auth-library` | `10.6.2` | None observed (current major, maintained by Google) | I | New dependency added for ID-token verification. |

No EOL or unmaintained dependencies introduced by the diff. The four BFF imports (`next/server`, internal `@/src/*` modules) are first-party.

---

## Compliance touchpoints

Flags only — this is **not** a compliance audit and does **not** constitute certification.

- **PII detected:** yes — email address (`payload.email`, persisted as `user.email`); Google account ID (`payload.sub`, persisted as `user.googleId`). No display name is stored (NFR-3 honored — `resolveUser` only consumes `sub` and `email`).
- **Sensitive categories (GDPR Art. 9 / HIPAA / PCI-DSS / COPPA):** none. No health, payment-card, biometric, location, or minors' data on the audited surface.
- **Cross-border data transfer:** authentication assertions transit to Google (US-resident infrastructure) by definition of using GIS; governed by Google's processor terms. No additional cross-border surface introduced by this feature.
- **Audit logging of sensitive operations:** absent — see L-1. Affects SOC 2 CC7.2 / GDPR Art. 30 readiness for the auth surface.
- **Data retention / deletion:** spec §10 defers explicit unlinking of Google accounts. If GDPR Art. 17 ("right to erasure") requests are anticipated, the feature needs an unlink-or-delete path before processing such requests at scale. Flag for product / legal.

### OWASP Top 10 (2021) coverage map

- **A01 Broken Access Control:** ✅ Full — post-auth surface unchanged (same `AuthGuard`, same `AuthorizedRequest`). No new authz boundaries.
- **A02 Cryptographic Failures:** ⚠️ Partial — ID-token signature verification via `google-auth-library` is sound, `crypto.randomBytes` / `timingSafeEqual` correct, `bcrypt` retained for passwords. JWT-secret defaults (H-2) are the gap.
- **A03 Injection:** ✅ Full — TypeORM only; no raw SQL; no shell exec on path.
- **A04 Insecure Design:** ⚠️ Partial — C-1 (the auto-link without verification) is fundamentally a design gap pinned by an unmet spec dependency. H-1 (no rate limiting) is design-level too.
- **A05 Security Misconfiguration:** ⚠️ Partial — M-2 (no security headers), H-2 (insecure secret defaults).
- **A06 Vulnerable & Outdated Components:** ✅ Full per static review — no known CVE on `google-auth-library@10.6.2`. Live scanner recommended.
- **A07 Identification & Authentication Failures:** ❌ — C-1 (account takeover via pre-emption) lives here.
- **A08 Software & Data Integrity Failures:** ✅ Full — no integrity gaps observed; the GIS script is loaded unhashed but that is industry norm for Google-CDN-versioned vendor scripts.
- **A09 Security Logging & Monitoring Failures:** ⚠️ Partial — L-1 (no audit logging).
- **A10 Server-Side Request Forgery (SSRF):** ✅ Full — no user-supplied URL handed to a server-side fetch.

---

## Open questions for the user

- Is the email-verification dependency (spec §12) on the roadmap before this feature ships to production users, or is C-1 being accepted as a known risk for a controlled rollout?
- Is the deployment topology BFF-only (browser never touches Nest direct)? If yes, the CORS gap noted in the Coverage table stays N/A; if anything ever calls Nest from a browser, `app.enableCors(...)` needs explicit origin allowlisting.
- Should `helmet` and `@nestjs/throttler` be addressed as part of this feature (since FEAT-007 opens the most-exposed surface in the codebase) or as a separate platform-hardening task?

## Out of scope for this audit

- Penetration testing — this is static analysis only.
- Infrastructure / deployment hardening (firewall, WAF, IAM, network segmentation, TLS termination, reverse proxy header trust).
- Compliance certification — touchpoints flagged, not certified.
- Code-quality issues unrelated to security → see `05-review-FEAT-007.md`.
- Test coverage of security paths → `sdlc-tests`. The audit notes when a defense path lacks a test (no test asserts the C-1 takeover is rejected; no test asserts rate limits are honored — but neither defense yet exists to test).
- System-wide threat models beyond feature scope → `sdlc-adr` / `sdlc-docs`.
