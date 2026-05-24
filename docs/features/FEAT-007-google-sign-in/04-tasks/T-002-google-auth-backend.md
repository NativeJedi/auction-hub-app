# Task T-002: Google auth backend endpoint

**Task ID:** T-002
**Feature:** FEAT-007-google-sign-in
**Status:** Todo
**Priority:** Must-have
**Depends on:** T-001

---

## 1. Context

This task delivers the server-side surface for FEAT-007: a single `POST /auth/google` endpoint that accepts a Google ID token + nonce, verifies them, enforces `email_verified`, branches to find-or-create-or-link, and issues the project's existing `AuthResponseDto`. ADR-FEAT-007-02 chose Option A (Google Identity Services + `google-auth-library`) because it satisfies NFR-1 (no client secret in the flow) trivially and minimizes hand-rolled security code. The endpoint depends on T-001 because it calls the new `findByGoogleId` and `linkGoogleId` methods.

Related requirements: FR-2, FR-3, FR-4, FR-5, FR-6, NFR-1, NFR-2, NFR-3

## 2. Description

Install `google-auth-library`, add a `GoogleAuthService` that wraps `OAuth2Client.verifyIdToken`, asserts `email_verified === true`, validates the request `nonce` against the value stored in Redis at `oauth:nonce:${sessionId}` (single-use — delete on success), and performs the find-or-create-or-link branch using `UsersService`. Expose it via `POST /auth/google` on `AuthController`, returning the same `AuthResponseDto` shape as the email-password flow.

## 3. Files to Touch

**Create:**
- `server/src/modules/auth/google-auth.service.ts` — verify ID token, validate nonce, branch find/create/link, issue tokens via existing `TokenService`.
- `server/src/modules/auth/google-auth.service.spec.ts` — scaffold `it.todo` placeholders for the four branches (new user, link existing, returning user, `email_verified: false`).
- `server/src/modules/auth/dto/google-auth.dto.ts` — `GoogleAuthDto { credential: string; nonce: string; sessionId: string }` with `class-validator` decorators (`@IsString()`, `@IsNotEmpty()`).

**Modify:**
- `server/src/modules/auth/auth.controller.ts` — add `@Post('google') async googleAuth(@Body() dto: GoogleAuthDto): Promise<AuthResponseDto>` that delegates to `GoogleAuthService`.
- `server/src/modules/auth/auth.module.ts` — register `GoogleAuthService` as a provider; ensure `UsersModule` and the Redis module are imported.
- `server/src/config/app-config.service.ts` — expose `googleClientId` getter that reads `GOOGLE_CLIENT_ID` via `ConfigService`.
- `server/package.json` — add `google-auth-library` dependency (latest stable major).
- `.env.example` (or whichever env template exists) — add `GOOGLE_CLIENT_ID=` placeholder.

**Read for context (no changes expected):**
- `server/src/modules/auth/auth.service.ts` — pattern for issuing `AuthResponseDto`.
- `server/src/modules/auth/token.service.ts` — token generation API.
- `server/src/modules/auth/dto/auth.dto.ts` — `AuthResponseDto` shape.
- `server/src/modules/redis/` — Redis client / repository convention to use for nonce lookup + delete.
- `server/src/modules/users/users.service.ts` — `findByEmail`, `findByGoogleId`, `linkGoogleId` from T-001.

## 4. Implementation Plan

1. `npm install google-auth-library` in the `server/` workspace. Confirm it resolves cleanly.
2. Add `googleClientId` to the config service (read `GOOGLE_CLIENT_ID`, fail-fast if missing in non-test envs).
3. Create `google-auth.service.ts`. Inject `ConfigService` (for `googleClientId`), `UsersService`, `TokenService`, and the Redis repository. Construct a singleton `OAuth2Client` from `google-auth-library` for `verifyIdToken`.
4. Implement `signIn(credential, nonce, sessionId)`:
   - Read `oauth:nonce:${sessionId}` from Redis. If missing → throw `UnauthorizedException('Invalid nonce')`. Delete the key immediately (single-use).
   - Call `client.verifyIdToken({ idToken: credential, audience: googleClientId })`. On error → throw `UnauthorizedException('Invalid Google credential')`.
   - Extract `payload`. Assert `payload.nonce === nonce` (constant-time compare). Assert `payload.email_verified === true` else throw `UnauthorizedException('Google email is not verified')` (FR-3 / NFR-2). Assert `payload.email` and `payload.sub` present.
   - Branch:
     - `findByGoogleId(payload.sub)` → returning user (FR-6). Skip to token issuance.
     - Else `findByEmail(payload.email)` → existing email-password user. Call `linkGoogleId(user.id, payload.sub)` (FR-5).
     - Else create a new user with `email`, `googleId = payload.sub`, `password = null` (FR-4). Use existing `UsersService.create` extended as needed; if the existing API requires `password`, add a creation path that accepts `null` (do this in T-001 if missed, otherwise extend here minimally).
   - Issue tokens via `TokenService` and return `AuthResponseDto`.
5. Add the `POST /auth/google` endpoint on `AuthController` delegating to `GoogleAuthService.signIn`. No `@UseGuards` (the endpoint is unauthenticated by definition).
6. Register the service in `AuthModule`. Confirm `RedisModule` (or whichever module exports the nonce repository) is imported.
7. Scaffold `google-auth.service.spec.ts` with `it.todo()` placeholders for: returning Google user, link-to-existing-email-password, new user, `email_verified: false` rejected, missing/expired nonce rejected, mismatched nonce rejected, invalid ID token rejected.

## 5. Definition of Done

- [ ] All code compiles with `cd server && npm run build` and lints cleanly.
- [ ] `google-auth-library` added to `server/package.json` and lockfile updated.
- [ ] `GOOGLE_CLIENT_ID` documented in `.env.example` and read via `ConfigService`. No `GOOGLE_CLIENT_SECRET` introduced anywhere (NFR-1).
- [ ] `POST /auth/google` accepts `{ credential, nonce, sessionId }`, returns the same `AuthResponseDto` shape as `POST /auth/login` on success.
- [ ] Returning Google user: lookup by `googleId` returns the existing record, no new row created, tokens issued (FR-6 / AC-2 returning case).
- [ ] Link-existing path: when no `googleId` match but `email` matches, the existing user's `googleId` is set and tokens are issued (FR-5 / AC-2).
- [ ] New-user path: no `googleId` and no `email` match → new user created with `password = null`, tokens issued (FR-4 / AC-1).
- [ ] `email_verified: false` → 401 with clear message (FR-3 / NFR-2 / AC-3).
- [ ] Missing, expired, single-used, or mismatched nonce → 401 (no other branch reached).
- [ ] Nonce key is deleted from Redis on every code path that reads it (success or rejection).
- [ ] No regressions in `cd server && npm run test` and existing email-password flow.

## 6. Test Plan

**Unit tests (Jest):**
- `GoogleAuthService.signIn` — mock `OAuth2Client.verifyIdToken` and the Redis nonce repo. Cover the four functional branches (new / link / returning / rejected) plus the nonce-failure branches (missing, mismatched). Assert `linkGoogleId` is called exactly once on the link path and never on the others.
- Assert the nonce key is deleted on every path (use a spy on the repo).
- Assert tokens are issued via `TokenService` (do not test `TokenService` itself — that already has coverage).

**Component tests (RTL):**
- None — server-only.

**E2E tests (Playwright):**
- Deferred to T-004; this task only scaffolds the endpoint.

**Test data needs:**
- Fake `TokenPayload` fixtures: verified-new, verified-existing-email, verified-existing-googleId, unverified.
- Helper to seed `oauth:nonce:${sessionId}` in the test Redis (or mocked repo).

## 7. Notes & Considerations

- **Compactness exception:** parallelization gate failed; created on user request.
- ADR alignment: matches ADR-FEAT-007-02 §5 (chosen Option A), §9 Consequences "For the codebase".
- The nonce is **single-use** — delete the Redis key as the first step after reading, before any other validation, so a thrown error cannot leave a replay window.
- Use constant-time string comparison for the `payload.nonce === nonce` check (`crypto.timingSafeEqual` on Buffer pairs of equal length).
- Do not request any OAuth scope beyond OpenID (NFR-3). `verifyIdToken` is scope-agnostic — this is enforced on the client side by GIS configuration (T-004), but call it out in the service's file header comment as a reminder.
- `sessionId` flows in from the BFF (T-003) inside the request body. Do **not** read it from a Nest-side cookie — the Nest server does not own the session cookie; the BFF does.
- If `UsersService.create` does not currently accept a `null` password, prefer extending it in T-001's scope (revisit the entity/DTO there) rather than working around it here. Surface this to the user if discovered during implementation.
- Spec §11 OQ-2 (revocation on Google side) is resolved — no action needed in this service.

## 8. References

- Feature Spec: `01-feature-spec.md` — FR-2, FR-3, FR-4, FR-5, FR-6, NFR-1, NFR-2, NFR-3, AC-1, AC-2, AC-3
- ADR: `03-adr.md` — ADR-FEAT-007-02 §5 (Decision), §6 (Tradeoffs), §9 (Consequences)
- Related tasks: T-001 (schema + repo methods consumed here), T-003 (BFF that calls this endpoint)
