# Task T-002: Server Email-Confirmation API

**Task ID:** T-002
**Feature:** FEAT-008-email-confirmation
**Status:** Todo
**Priority:** Must-have
**Depends on:** T-001

---

## 1. Context

This task delivers the core server-side behavior of the email-confirmation feature: the
modified registration flow, the login guard, the confirmation endpoint, and the resend
endpoint. It is scoped to the email/password auth path only — Google Sign-In handling is
addressed separately in T-003. Separating T-002 and T-003 allows both to run in parallel
after T-001 lands because they touch completely different files.

Related requirements: FR-1 (send confirmation email on register), FR-2 (block login for
unverified accounts), FR-3 (confirm-email endpoint), FR-4 (resend endpoint with rate
limiting), AC-1, AC-2, AC-3, AC-4

## 2. Description

Modify `AuthService.register()` to send a confirmation email instead of returning auth
tokens. Add `AuthService.confirmEmail()` and `AuthService.resendConfirmation()` with the
resend rate-limiter backed by `RedisSimpleRepository<number>`. Update `AuthService.login()`
to block unverified accounts with a distinct 403 error code. Wire two new routes in
`AuthController`. Protect all auth endpoints with `@nestjs/throttler` as the general
flood guard.

## 3. Files to Touch

**Create:**
- `server/src/modules/auth/auth.service.spec.ts` — scaffold test stubs for all new `AuthService` methods (file likely exists; add new describe blocks)

**Modify:**
- `server/src/modules/auth/auth.service.ts` — modify `register()` and `login()`; add `confirmEmail()`, `resendConfirmation()`
- `server/src/modules/auth/auth.controller.ts` — add `GET /auth/confirm-email` and `POST /auth/resend-confirmation` routes
- `server/src/modules/auth/auth.module.ts` — import `ThrottlerModule.forRoot`, register `ThrottlerGuard` as APP_GUARD or at controller level
- `server/src/modules/auth/dto/auth.dto.ts` — add `ResendConfirmationDto { email: string }`
- `server/src/modules/email/email.service.ts` — add `sendConfirmationEmail(to: string, token: string): Promise<void>`
- `server/package.json` — add `@nestjs/throttler` dependency

**Read for context (no changes expected):**
- `server/src/modules/auth/jwt.token.ts` — token generation/validation pattern to reuse for confirmation JWT
- `server/src/modules/redis/` — `RedisService.createSimpleRepository` signature
- `server/src/modules/auth/google-auth.service.ts` — nonce pattern as reference for `RedisSimpleRepository` usage

## 4. Implementation Plan

1. **Install and wire throttler.** Run `npm install @nestjs/throttler` in `server/`. In `auth.module.ts`, import `ThrottlerModule.forRoot([{ ttl: 60_000, limit: 30 }])` and add `ThrottlerGuard` to the module providers (or as `APP_GUARD`). This applies a 30-req/min per-IP cap to all auth endpoints.

2. **Add `resendLimits` to `AuthService`.** Inject `RedisService` (already injected for refresh tokens). In the constructor, create:
   ```ts
   this.resendLimits = redisService.createSimpleRepository<number>('resend_limits', 3600);
   ```
   (Same pattern as `GoogleAuthService.nonces` and the refresh-token repository.)

3. **Add `EmailService.sendConfirmationEmail(to, token)`.** Composes a plain-text confirmation email body with the URL `${this.config.urls.clientUrl}/confirm-email?token=${token}` and calls the existing `sendEmail()` method.

4. **Modify `AuthService.register()`.** After creating the user:
   - Sign a confirmation JWT: `jwtService.sign({ sub: user.id }, { subject: 'email_confirmation', expiresIn: '24h' })`.
   - Call `emailService.sendConfirmationEmail(user.email, token)`.
   - Return `{ status: 'pending_confirmation' }` instead of `{ accessToken, refreshToken }`.

5. **Add `AuthService.confirmEmail(token)`.** Verify the JWT (check `subject: 'email_confirmation'`; throw `HttpException('INVALID_CONFIRMATION_TOKEN', HttpStatus.FORBIDDEN)` on expired or malformed). On valid token, call `UsersService.setEmailVerified(payload.sub)`. Return `{ status: 'confirmed' }`.

6. **Add `AuthService.resendConfirmation(email)`.** Look up the user by email (throw 404 if not found, but do so with a generic message to avoid email enumeration). Check `user.emailVerified`; if already verified, return `{ status: 'already_verified' }` silently. Read the Redis counter (`resendLimits.get(email)`); if `count >= 3`, throw `HttpException('RESEND_LIMIT_EXCEEDED', HttpStatus.TOO_MANY_REQUESTS)`. Otherwise, set `resendLimits.set(email, (count ?? 0) + 1)` (TTL resets per ADR sliding-window decision), sign a fresh token, send the email.

7. **Modify `AuthService.login()`.** After password validation and before token generation, add:
   ```ts
   if (!user.emailVerified) {
     throw new HttpException('EMAIL_NOT_VERIFIED', HttpStatus.FORBIDDEN);
   }
   ```
   This error must be distinguishable by the client. Do not let it fall through to a generic authorization error handler.

8. **Add controller routes.** In `AuthController`:
   - `@Get('confirm-email') @SkipThrottle() confirmEmail(@Query('token') token: string)` → delegates to `authService.confirmEmail(token)`.
   - `@Post('resend-confirmation') resendConfirmation(@Body() dto: ResendConfirmationDto)` → delegates to `authService.resendConfirmation(dto.email)`.

## 5. Definition of Done

The task is complete when:

- [ ] All code in "Files to Touch" is written and lints cleanly.
- [ ] Test files exist (scaffolded — actual tests filled in by `sdlc-tests`).
- [ ] No regressions in existing tests (`npm run test` in server passes).
- [ ] Code follows existing project conventions and patterns.
- [ ] `POST /auth/register` returns `{ status: 'pending_confirmation' }` and does not return tokens.
- [ ] `POST /auth/login` returns 403 with body `EMAIL_NOT_VERIFIED` when `user.emailVerified === false`.
- [ ] `GET /auth/confirm-email?token=<valid>` sets `emailVerified = true` and returns `{ status: 'confirmed' }`.
- [ ] `GET /auth/confirm-email?token=<expired>` returns 403 `INVALID_CONFIRMATION_TOKEN`.
- [ ] `POST /auth/resend-confirmation` returns 429 on the 4th call for the same email within 1 h.
- [ ] `@nestjs/throttler` is wired and applies a 30-req/min limit to auth endpoints.

## 6. Test Plan

Tests that `sdlc-tests` should write for this task:

**Unit tests (Jest):**
- `AuthService.register()` — calls `emailService.sendConfirmationEmail`; returns `{ status: 'pending_confirmation' }`; does NOT call `tokenService.generateTokens`.
- `AuthService.login()` — throws 403 `EMAIL_NOT_VERIFIED` when mock user has `emailVerified: false`; proceeds normally when `emailVerified: true`.
- `AuthService.confirmEmail(token)` — calls `UsersService.setEmailVerified` on valid token; throws 403 on expired/invalid token.
- `AuthService.resendConfirmation(email)` — increments Redis counter; throws 429 when counter is 3; returns `already_verified` when user is already verified.
- `EmailService.sendConfirmationEmail()` — calls `sendEmail` with the correct recipient and URL format.

**Component tests (RTL):**
- None — server-side only.

**E2E tests (Playwright):**
- Register → attempt login before confirming → expect 403 `EMAIL_NOT_VERIFIED`.
- Register → call `GET /auth/confirm-email?token=<token>` → login succeeds.
- `POST /auth/resend-confirmation` × 4 for same email → 4th returns 429.

**Test data needs:**
- A factory for a `User` with `emailVerified: false`.
- A helper that signs a valid / expired email-confirmation JWT for use in unit tests.

## 7. Notes & Considerations

- **Email enumeration guard.** `resendConfirmation()` should not reveal whether an email exists. Return a generic 200/202 even when the user is not found, while internally doing nothing. Avoids leaking registered emails.
- **JWT subject.** The confirmation token must use a distinct `subject` claim (e.g. `'email_confirmation'`) so it cannot be mistaken for an access or refresh token. Verify the subject in `confirmEmail()` before trusting the payload.
- **`SkipThrottle` on confirm-email.** The confirmation link in an email is single-click and should not be throttled. Apply `@SkipThrottle()` (from `@nestjs/throttler`) to the `confirmEmail` route handler.
- **Sliding window behavior.** Per ADR-FEAT-008-01 §6, `ResendLimits.set()` resets the TTL on each write, producing a sliding window from the last resend. This is intentional and documented in the ADR.
- **No token invalidation in v1.** Per spec §7, a valid confirmation link can be re-clicked after the account is verified — `setEmailVerified` on an already-verified account is a no-op (`UPDATE … SET emailVerified = true WHERE id = ?` is idempotent).

## 8. References

- Feature Spec: `docs/features/FEAT-008-email-confirmation/01-feature-spec.md` (FR-1, FR-2, FR-3, FR-4, §7 Security NFR, §7 Product Tradeoffs, AC-1–AC-4)
- ADR: `docs/features/FEAT-008-email-confirmation/03-adr.md` (ADR-FEAT-008-01 — §3 Option A, §5 Decision, §6 Tradeoffs, §9 Consequences)
- ADR: `docs/features/FEAT-008-email-confirmation/03-adr.md` (ADR-FEAT-008-02 — §9 Consequences, login check details)
- Related tasks: T-001 (prerequisite — provides `emailVerified` column and `setEmailVerified()`), T-003 (parallel — Google Sign-In fix), T-004 (downstream — client consumes these endpoints)
