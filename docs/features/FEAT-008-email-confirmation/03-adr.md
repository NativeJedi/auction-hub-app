# ADR: FEAT-008 — Email Confirmation on Registration

**Feature:** FEAT-008-email-confirmation
**Status:** Proposed
**Date:** 2026-05-27
**Decision makers:** sdlc-adr

Two decisions are recorded here. They are coupled: the login guard logic reads the field defined in ADR-FEAT-008-02, and the resend endpoint uses the counter from ADR-FEAT-008-01.

---

## ADR-FEAT-008-01: Resend-Confirmation Attempt Counter + General Auth Throttling

---

### 1. Context

Per FR-4, `POST /auth/resend-confirmation` must be limited to 3 requests per hour per email address to prevent confirmation-email spam. This is a domain rule tied to the email-verification flow, not a generic rate limit.

Separately, the auth module (`/register`, `/login`, `/resend-confirmation`, `/confirm-email`) currently has no protection against brute-force or request floods. These are high-value endpoints where unchecked volume creates both security and deliverability risk.

The project already has a shared Redis instance (`RedisService`) used for refresh-token storage and OAuth nonces. `@nestjs/throttler` is not yet in the server `package.json`.

These two concerns — a per-email domain counter and a general per-IP flood guard — have different semantics and lifecycle requirements. They are best handled by separate mechanisms.

### 2. Decision Drivers

1. Per-email counter must be shared across API instances (Redis, not process memory).
2. Zero new infrastructure — Redis is already in service; avoid adding a managed queue or external service.
3. Idiomatic NestJS for the endpoint-level flood guard — decorator-based, applies uniformly without per-route boilerplate.
4. Clear separation of concerns: domain business rule (max 3 resends) vs infrastructure protection (flood guard).
5. Minimal new dependencies — only add packages that pull their weight.

### 3. Options Considered

#### Option A: Redis counter for resend + `@nestjs/throttler` (in-memory) for general throttling — **Chosen**

**Description:** In `AuthService.resendConfirmation()`, maintain a `RedisSimpleRepository<number>` under namespace `resend_limits` with TTL 3600 s. On each call: read count; if ≥ 3, throw `HttpStatus.TOO_MANY_REQUESTS`; otherwise write `count + 1` (which resets the TTL, producing a sliding window from the last resend). Register `@nestjs/throttler` in `AuthModule` with a conservative IP-based limit on all auth endpoints (e.g. 30 req/min per IP).

**Pros:**
- Per-email counter reuses `RedisSimpleRepository` — the identical pattern used for refresh tokens and OAuth nonces; zero new dependencies.
- `@nestjs/throttler` (1 package, in-memory default) is the idiomatic NestJS flood guard — decorator-based, well-tested, applies with a single `ThrottlerGuard` at the controller level.
- Concerns are cleanly separated: domain rule lives in the service, infrastructure guard lives in the module wiring.
- In-memory throttler is acceptable for the general guard because the limit is coarse (per-IP DDoS protection, not a precise per-user quota).

**Cons:**
- The per-email counter uses a sliding window (TTL resets on each write) rather than a strict fixed window, because `RedisSimpleRepository.set()` always overwrites with a fresh TTL. For anti-spam purposes this is more conservative (stricter), but the window is measured from the last resend attempt, not the first.
- `@nestjs/throttler` in-memory state is lost on process restart and is not shared across API instances. Acceptable for a coarse flood guard; not acceptable for the per-email business rule (hence Redis for that one).

**Estimated effort:** ~2 h (Redis counter in service, `@nestjs/throttler` module wiring).

---

#### Option B: `@nestjs/throttler` + Redis store for everything

**Description:** Add `@nestjs/throttler` and `@nest-lab/throttler-storage-redis`. Configure a custom throttle key based on the email from the request body for the resend endpoint. All throttling goes through one mechanism.

**Pros:**
- Single mechanism for all rate limiting.
- Accurate cross-instance limiting for the per-email rule.

**Cons:**
- Two new packages; `@nest-lab/throttler-storage-redis` adds a third-party Redis adapter with its own release cadence.
- Throttler keying on request-body fields requires a custom `ThrottlerGuard` subclass — non-trivial wiring.
- Treats the resend business rule (domain logic with a spec-defined limit) identically to infrastructure flood protection. Conflates concerns.

**Estimated effort:** ~4 h (module setup, custom guard subclass, testing).

---

#### Option C: In-memory Map in AuthService for resend counter

**Description:** `AuthService` holds a `Map<string, { count: number; resetAt: number }>` keyed by email. A periodic cleanup removes stale entries.

**Pros:**
- Zero dependencies.
- Simple to read and test.

**Cons:**
- Not shared across API instances — each instance has its own counter. Under horizontal scaling the effective limit becomes `3 × instanceCount`.
- State is lost on process restart, immediately resetting all per-email counters.
- Requires a cleanup timer to avoid memory leaks.

**Estimated effort:** ~1 h — but must be replaced when scaling past one instance.

---

### 4. Comparison

| Criterion | Option A (Chosen) | Option B | Option C |
|---|---|---|---|
| Per-email multi-instance correctness | ✓ Redis | ✓ Redis | ✗ in-memory |
| New packages | 1 (`@nestjs/throttler`) | 2 | 0 |
| Domain/infra separation | ✓ explicit | ✗ blurred | N/A |
| Complexity | Low | Medium | Very low |
| General auth throttling included | ✓ | ✓ | ✗ |
| Pattern fit with existing codebase | High (RedisSimpleRepository) | Medium | Low |

### 5. Decision

**Chosen option:** A

The per-email resend counter is a domain rule, not infrastructure throttling. Using `RedisSimpleRepository<number>` keeps it in the service layer alongside the related business logic, and reuses infrastructure the project already understands. `@nestjs/throttler` (in-memory) as a separate flood guard on the auth controller is the idiomatic NestJS answer for that second concern. Driver 4 (separation of concerns) was the deciding factor over Option B.

### 6. Tradeoffs

**Gained:**
- Zero new infrastructure — Redis is already the source of truth for short-lived server state.
- Each concern is handled by the most appropriate layer: domain rule in the service, flood guard in the transport layer.
- `@nestjs/throttler` can be extended to other modules later without touching the email-specific counter.

**Sacrificed:**
- The per-email counter uses a sliding window (last-write TTL reset) rather than a strict fixed window. A user who spaces three resends over 59 minutes will be locked out for an additional hour from their third attempt rather than from their first.
- General auth throttler state is not shared across API instances. An attacker who distributes requests across a load balancer can exceed the per-instance limit. Acceptable for v1 — real DDoS mitigation belongs at the ingress layer.

### 7. Known Limitations

- The sliding-window behavior of `RedisSimpleRepository.set()` means the effective lock-out after 3 resends is measured from the last write, not the first. Upgrading to a strict fixed-window counter requires using `redis.getClient().incr()` + `expire(key, 3600, 'NX')` directly instead of `RedisSimpleRepository`.
- `@nestjs/throttler` in-memory does not protect against distributed flood attacks. If multiple API instances are deployed in production, the throttler should be upgraded to use a Redis store (`@nest-lab/throttler-storage-redis`).
- Neither mechanism prevents a determined actor from registering many different email addresses. That is an account-level abuse problem, not in scope for FEAT-008.

### 8. Future Optimization Opportunities

- **Fixed-window resend counter** — when the sliding-window behavior is flagged as confusing, swap `RedisSimpleRepository.set()` for `INCR` + `EXPIRE(NX)` on the raw Redis client. Drop-in change in `AuthService`, no schema migration.
- **Shared throttler across instances** — when the API scales past one instance, add `@nest-lab/throttler-storage-redis` to `ThrottlerModule`. No service-layer changes required.
- **Dedicated rate-limiting layer** — when more than 3–4 endpoints need custom limits, consolidate all throttling behind a reverse-proxy policy (nginx `limit_req`, AWS WAF rate rules) and remove `@nestjs/throttler` from the application code.

### 9. Consequences

**For the codebase:**
- `AuthService` gains a `RedisSimpleRepository<number>` field (`resendLimits`) constructed via `RedisService.createSimpleRepository<number>('resend_limits', 3600)`.
- `AuthModule` imports `ThrottlerModule.forRoot([{ ttl: 60_000, limit: 30 }])` and registers `ThrottlerGuard` at the controller or module level.
- `server/package.json` gains one new dependency: `@nestjs/throttler`.

**For the team:**
- No new concepts — `RedisSimpleRepository` pattern is already used in `GoogleAuthService` (nonces) and `jwt.token.ts` (refresh tokens).

**For operations:**
- The `resend_limits:{email}` key namespace appears in Redis alongside `refresh_tokens` and `oauth:nonce`.

**For testing:**
- Unit tests for `AuthService.resendConfirmation()` must mock `RedisSimpleRepository.get/set` and assert the 429 branch.
- E2E test: send 4 resend requests for the same email within one test — confirm the 4th returns 429.

### 10. References

- Feature Spec: `docs/features/FEAT-008-email-confirmation/01-feature-spec.md` (FR-4, NFR — Deliverability)
- Existing Redis counter pattern: `server/src/modules/auth/jwt.token.ts` (`RefreshToken` class, lines 50–93)
- Existing nonce pattern: `server/src/modules/auth/google-auth.service.ts` (`GoogleAuthService.nonces`)
- `@nestjs/throttler` docs: https://docs.nestjs.com/security/rate-limiting

---

## ADR-FEAT-008-02: emailVerified Schema Extension on User Entity

---

### 1. Context

FR-2 requires blocking email/password login for accounts where the email address has not been confirmed. FR-5 requires Google Sign-In accounts to be considered verified at creation. FR-3 requires a `GET /auth/confirm-email?token=<jwt>` endpoint that sets the account to verified.

The `User` entity (`server/src/modules/users/entities/user.entity.ts`) currently has four columns: `id`, `email`, `password`, `googleId`. No verification state exists. A TypeORM migration is required regardless of which option is chosen.

The spec §4 Non-Goals explicitly defers email re-verification after account creation. FEAT-007 ADR established the pattern of extending the `User` entity with nullable columns for new identity properties (`googleId`).

### 2. Decision Drivers

1. Spec §4 Non-Goals excludes re-verification — no historical record of verification events is required in v1.
2. Login check must require no JOIN — the guard runs on every login attempt.
3. Minimal migration surface — one column, one migration, consistent with the `googleId` precedent.
4. Must handle the edge case where a Google login arrives for an existing unverified email/password account (see §9).

### 3. Options Considered

#### Option A: Boolean column `emailVerified` on User — **Chosen**

**Description:** Add `emailVerified: boolean` with `DEFAULT false` to the `User` entity and a TypeORM migration. The login guard reads this field directly. `UsersService` gains a `setEmailVerified(userId)` method. Google Sign-In accounts are created with `emailVerified: true`; the confirmation endpoint calls `setEmailVerified`.

**Pros:**
- Zero JOIN on every login — the field is on the same row as `email` and `password`.
- Identical pattern to how FEAT-007 added `googleId`: one nullable/default column on `User`, one migration.
- Simplest possible implementation of the spec's requirement.
- `DEFAULT false` in the migration means all existing rows become unverified at migration time, which is correct (they were registered before email confirmation was enforced).

**Cons:**
- No audit history — cannot answer "when was this account verified?" without adding a separate `emailVerifiedAt` timestamp column.
- Re-verification (deferred to non-goals) would require a schema change.

**Estimated effort:** ~1 h (entity column, migration, UsersService method, guard check in AuthService).

---

#### Option B: Separate `email_verification` table

**Description:** New `EmailVerification` entity with `userId FK`, `status: enum`, `createdAt`, `verifiedAt`, token storage. The login guard queries this table alongside the user lookup.

**Pros:**
- Full audit history without additional schema changes.
- Natural home for future re-verification logic.

**Cons:**
- JOIN on every login — two DB round-trips or a join query.
- Significantly more migration surface (new table, FK constraint, index).
- Premature: spec §4 explicitly defers re-verification, making the added complexity unjustifiable for v1.

**Estimated effort:** ~3 h.

---

#### Option C: Enum column `emailStatus` on User

**Description:** Replace the boolean with `emailStatus: 'unverified' | 'pending' | 'verified'` to capture more states.

**Pros:**
- Slightly richer state machine — distinguishes "never sent" from "link sent".

**Cons:**
- PostgreSQL enum type alterations (adding values) require `ALTER TYPE` with `USING` clauses — painful to migrate later.
- The `pending` state is not required by any FR or AC in this spec. No component would consume it in v1.
- Enum migrations are irreversible in PostgreSQL without recreating the type.

**Estimated effort:** ~2 h — plus higher future migration risk.

---

### 4. Comparison

| Criterion | Option A (Chosen) | Option B | Option C |
|---|---|---|---|
| Migration complexity | 1 column | 1 new table + FK | 1 enum type + 1 column |
| Login check JOIN | No | Yes | No |
| Re-verification support | Needs schema change | Ready | Needs `ALTER TYPE` |
| Spec alignment | Exact fit | Premature (Non-Goals) | Overkill (no pending use case) |
| Migration reversibility | Easy | Easy | Hard (enum alter) |
| Consistent with FEAT-007 pattern | ✓ | ✗ | ✗ |

### 5. Decision

**Chosen option:** A

Spec §4 explicitly defers re-verification. Option B's audit trail and Option C's richer state machine solve problems that are not in scope for v1 and carry real migration cost. A simple `boolean DEFAULT false` column delivers exactly what FR-2, FR-3, and FR-5 require with minimal surface area. Driver 1 (spec alignment) and Driver 3 (minimal migration surface) tipped the balance.

### 6. Tradeoffs

**Gained:**
- Single-row login check — no JOIN overhead on every authentication.
- Consistent with the `googleId` precedent: the `User` entity is the canonical identity record.
- `DEFAULT false` correctly retroactively marks all pre-existing accounts as unverified.

**Sacrificed:**
- No `emailVerifiedAt` timestamp — answering "when did this account verify?" requires a separate column or external log.
- Re-verification (out of scope, but the most natural future extension) requires at minimum adding a timestamp column and a status reset migration.

### 7. Known Limitations

- All accounts existing at migration time will have `emailVerified = false`. If the platform already has active users at migration time, a backfill strategy is needed (e.g. a one-time script to set `emailVerified = true` for accounts older than the cutoff, or an admin-triggered bulk verification). This is a deployment concern, not captured in the schema.
- Single-use confirmation token invalidation is explicitly deferred (spec §7 Product Tradeoffs). Until implemented, a valid confirmation link can be clicked more than once without side effect (the second click is a no-op because `emailVerified` is already `true`).
- There is no `emailVerifiedAt` column. If audit timestamp requirements emerge, add it as a nullable `timestamp` column in a separate migration.

### 8. Future Optimization Opportunities

- **Add `emailVerifiedAt: Date | null`** — a nullable timestamp column added in a subsequent migration. No application logic changes required beyond setting it alongside `emailVerified`.
- **Single-use token invalidation** — when replay prevention is required, store a `confirmationTokenId` UUID in Redis with a short TTL; the confirmation endpoint checks and burns it atomically via `getDel`. No schema change to `User`.
- **Re-verification flow** — when email-change support is added (per §4 Non-Goals), add an `emailStatus: enum` column in a new migration and migrate `true/false → verified/unverified`. The boolean column can be dropped in the same migration.

### 9. Consequences

**For the codebase:**
- `User` entity gains `@Column({ default: false }) emailVerified: boolean`.
- TypeORM migration: `ALTER TABLE "user" ADD COLUMN "emailVerified" boolean NOT NULL DEFAULT false`.
- `UsersService` gains `setEmailVerified(userId: string): Promise<void>` (single `UPDATE`).
- `AuthService.login()` checks `user.emailVerified` after password validation; throws a distinct error (e.g. `HttpStatus.FORBIDDEN` with code `EMAIL_NOT_VERIFIED`) if false. This error must NOT fall through to the generic `ApiAuthorizationError` so the client can distinguish "wrong password" from "unverified account".
- `AuthService.register()` no longer returns `{accessToken, refreshToken}` — the user cannot log in yet. It returns a status payload indicating that a confirmation email was sent.
- **Edge case — Google login on an existing unverified account:** `GoogleAuthService.resolveUser()` already links a Google credential to an existing account found by email (`linkGoogleId`). After this link, `emailVerified` must also be set to `true`. The `signIn` method already asserts `payload.email_verified === true` (line 55 in `google-auth.service.ts`), so Google has independently confirmed ownership. `UsersService.linkGoogleId()` (or a new `linkGoogleAndVerify()` helper) must include the `emailVerified = true` update in the same DB write.

**For the team:**
- Google Sign-In users created fresh get `emailVerified: true` at creation — no change needed in `usersService.create()` for new Google users as long as the caller passes `emailVerified: true`.
- Devs must know: `findByEmail(email)` does NOT select `emailVerified` by default if it follows the `password` select pattern. Ensure `emailVerified` is included in the default select or add it to login-path queries.

**For operations:**
- Migration is additive (`ADD COLUMN … DEFAULT false`) — safe to run against a live database with no downtime.
- Post-migration backfill decision (see §7) must be made before production deployment if existing verified users are present.

**For testing:**
- Unit: mock `UsersService.findByEmail()` to return `{ emailVerified: false }` and assert `AuthService.login()` throws the correct exception code.
- E2E: register → attempt login (expect 403 with `EMAIL_NOT_VERIFIED`) → call confirm endpoint → login succeeds.
- E2E: Google Sign-In where the email matches an existing unverified account → confirm `emailVerified = true` after sign-in.

### 10. References

- Feature Spec: `docs/features/FEAT-008-email-confirmation/01-feature-spec.md` (FR-2, FR-3, FR-5, §4 Non-Goals, §7 Product Tradeoffs, AC-1–AC-5)
- FEAT-007 ADR (googleId column precedent): `docs/features/FEAT-007-google-sign-in/03-adr.md` (ADR-FEAT-007-01)
- User entity: `server/src/modules/users/entities/user.entity.ts`
- Google auth service (resolveUser, email_verified check): `server/src/modules/auth/google-auth.service.ts` (lines 55, 104–123)
