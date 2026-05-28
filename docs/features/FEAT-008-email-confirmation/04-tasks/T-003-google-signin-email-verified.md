# Task T-003: Google Sign-In emailVerified Fix

**Task ID:** T-003
**Feature:** FEAT-008-email-confirmation
**Status:** Todo
**Priority:** Must-have
**Depends on:** T-001

---

## 1. Context

FR-5 requires that Google Sign-In accounts have `emailVerified = true` at creation and bypass
the confirmation flow entirely. The ADR (§9 Consequences, edge case) also identifies a
specific scenario: if a user registered with email/password but never confirmed, then later
signs in with Google using the same email address, `GoogleAuthService.resolveUser()` calls
`UsersService.linkGoogleId()` to link the Google credential to the existing account. That
link operation must also set `emailVerified = true` in the same DB write, because Google
has independently confirmed the email address.

This task is scoped purely to the Google auth path and touches different files than T-002,
making it safe to implement in parallel with T-002 after T-001 lands.

Related requirements: FR-5, AC-5

## 2. Description

Ensure that every user who authenticates via Google emerges from `GoogleAuthService.resolveUser()`
with `emailVerified = true`. This covers two paths: (a) a brand-new Google user created for
the first time, and (b) an existing email/password account that is linked to a Google
credential. In both cases the `emailVerified = true` write must happen atomically in the
same DB operation — no two-step read-then-update.

## 3. Files to Touch

**Modify:**
- `server/src/modules/auth/google-auth.service.ts` — update `resolveUser()` to ensure both creation paths produce `emailVerified: true`
- `server/src/modules/users/users.service.ts` — update `linkGoogleId()` (or add `linkGoogleAndVerify()`) to include `emailVerified: true` in the same UPDATE

**Read for context (no changes expected):**
- `server/src/modules/auth/google-auth.service.ts` lines 55 and 104–123 — `email_verified` assertion and `resolveUser` branching logic
- `server/src/modules/users/users.service.ts` — current `create()` and `linkGoogleId()` signatures
- `server/src/modules/auth/google-auth.service.spec.ts` — existing test style to follow for scaffold

## 4. Implementation Plan

1. **Read `GoogleAuthService.resolveUser()` carefully.** Identify the two branches:
   - Branch A: no existing user found by email → calls `usersService.create(…)` with `{ email, googleId }`.
   - Branch B: existing user found but no `googleId` set → calls `usersService.linkGoogleId(userId, googleId)`.
   Note that the ADR confirms `payload.email_verified === true` is already asserted (line 55) before `resolveUser` is called, so Google has independently confirmed ownership.

2. **Update Branch A (new Google user creation).** Modify the `usersService.create(…)` call in `resolveUser()` to pass `emailVerified: true`:
   ```ts
   await this.usersService.create({ email: payload.email, googleId, emailVerified: true });
   ```
   Verify that `UsersService.create()` (and its underlying entity creation) accepts and persists this field after T-001 adds the column.

3. **Update Branch B (link existing account).** Two implementation options — pick whichever keeps the call sites clean:
   - **Option i** (preferred if simple): Update `UsersService.linkGoogleId(userId, googleId)` to also set `emailVerified: true` in the same `repository.update()` call:
     ```ts
     await this.usersRepository.update(userId, { googleId, emailVerified: true });
     ```
   - **Option ii**: Add a new `UsersService.linkGoogleAndVerify(userId, googleId)` method and call it from `resolveUser()` instead. Use this only if `linkGoogleId` is called elsewhere without wanting verification side-effects.

4. **No change to the Google Sign-In flow for users who are already verified.** If `user.emailVerified` is already `true`, setting it again is idempotent — no special-case branch needed.

5. **Scaffold tests.** Add describe blocks to `google-auth.service.spec.ts` for:
   - New Google user created → `usersService.create` called with `emailVerified: true`.
   - Existing unverified user linked → `usersService.linkGoogleId` (or `linkGoogleAndVerify`) called with `emailVerified: true`.

## 5. Definition of Done

The task is complete when:

- [ ] All code in "Files to Touch" is written and lints cleanly.
- [ ] Test files exist (scaffolded — actual tests filled in by `sdlc-tests`).
- [ ] No regressions in existing tests (`npm run test` in server passes).
- [ ] Code follows existing project conventions and patterns.
- [ ] A brand-new Google Sign-In user is created with `emailVerified = true`.
- [ ] An existing unverified email/password account linked via Google Sign-In has `emailVerified` set to `true` in the same DB write as the `googleId` link.
- [ ] `UsersService.linkGoogleId()` (or its replacement) atomically updates both `googleId` and `emailVerified` in one query.

## 6. Test Plan

Tests that `sdlc-tests` should write for this task:

**Unit tests (Jest):**
- `GoogleAuthService.resolveUser()` — when no user exists: calls `usersService.create` with `{ emailVerified: true, googleId, email }`.
- `GoogleAuthService.resolveUser()` — when user exists with `googleId = null`: calls `usersService.linkGoogleId` (or `linkGoogleAndVerify`) with `emailVerified: true`.
- `GoogleAuthService.resolveUser()` — when user already has `googleId` set: no change to `emailVerified` (already handled by the existing path).
- `UsersService.linkGoogleId()` — calls `repository.update` with `{ googleId, emailVerified: true }`.

**Component tests (RTL):**
- None — server-side only.

**E2E tests (Playwright):**
- Google Sign-In with a brand-new email → user can log in immediately; `emailVerified` in DB is `true`.
- Google Sign-In where the email matches an existing unverified email/password account → login succeeds; `emailVerified` in DB is `true` after sign-in.

**Test data needs:**
- Mocked Google `TokenPayload` with `email_verified: true` and a test email.
- A seed for an existing `User` record with `emailVerified: false` and no `googleId`.

## 7. Notes & Considerations

- **Atomicity matters.** Setting `googleId` and `emailVerified` in the same `UPDATE` prevents a race condition where the link succeeds but the verify fails (or vice versa) if the process crashes between two separate writes.
- **Verify `email_verified` assertion location.** The ADR references line 55 of `google-auth.service.ts` as the assertion point. Confirm it is a hard throw (not a log), so this task can safely assume `payload.email_verified === true` at the point `resolveUser` runs.
- **`usersService.create()` signature.** After T-001 adds `emailVerified` to the entity, `create()` may need its input type or DTO updated to accept the new field. Check whether `create()` uses a partial entity object or a typed `CreateUserDto` — adjust accordingly.
- **No client-side changes.** This task is entirely server-side. The Google Sign-In button and client flow are unchanged.

## 8. References

- Feature Spec: `docs/features/FEAT-008-email-confirmation/01-feature-spec.md` (FR-5, AC-5, §4 Non-Goals)
- ADR: `docs/features/FEAT-008-email-confirmation/03-adr.md` (ADR-FEAT-008-02 — §9 Consequences edge case: "Google login on an existing unverified account")
- Related tasks: T-001 (prerequisite — provides `emailVerified` column), T-002 (parallel — email/password flow), T-004 (downstream — client verifies AC-5 end-to-end)
