# Task T-001: emailVerified Schema and UserService Methods

**Task ID:** T-001
**Feature:** FEAT-008-email-confirmation
**Status:** Todo
**Priority:** Must-have
**Depends on:** none

---

## 1. Context

This task delivers the data-layer foundation for the entire email-confirmation feature. All
other tasks in this feature — the server API (T-002), the Google Sign-In fix (T-003), and
the client flow (T-004) — require the `emailVerified` column and the `setEmailVerified()`
service method to exist first. It is kept separate because it is a purely additive schema
change with no logic of its own; downstream tasks can then build on a stable data contract.

Related requirements: FR-2 (login block depends on this field), FR-3 (confirmation endpoint
writes this field), FR-5 (Google users are created with this field set to `true`), AC-1, AC-2,
AC-5

## 2. Description

Add a `emailVerified: boolean` column (default `false`) to the `User` entity and generate the
corresponding TypeORM migration. Add a `setEmailVerified(userId)` method to `UsersService` so
upstream services can mark an account verified without coupling to the entity directly. All
existing accounts will default to `false` after migration, which is correct — they were
registered before email confirmation was enforced.

## 3. Files to Touch

**Create:**
- `server/src/migrations/<timestamp>-AddEmailVerifiedToUser.ts` — additive migration adding the `emailVerified` boolean column

**Modify:**
- `server/src/modules/users/entities/user.entity.ts` — add `emailVerified` column decorator
- `server/src/modules/users/users.service.ts` — add `setEmailVerified(userId: string): Promise<void>`
- `server/src/modules/users/dto/user.dto.ts` — expose `emailVerified` in the user DTO where appropriate

**Read for context (no changes expected):**
- `server/src/migrations/1779649878994-Auto.ts` — existing migration pattern to match style
- `server/src/modules/users/users.service.spec.ts` — existing test style to follow for scaffold

## 4. Implementation Plan

1. Add `@Column({ default: false }) emailVerified: boolean` to the `User` entity in `user.entity.ts`. Follow the same column-decorator style used for `googleId` (per FEAT-007 ADR precedent).

2. Add `emailVerified` to `UserDto` (if the DTO is a plain class mirroring the entity). Mark it optional or always-present depending on how `UserDto` is used across the codebase — check usages before deciding.

3. Add `setEmailVerified(userId: string): Promise<void>` to `UsersService`:
   ```ts
   await this.usersRepository.update(userId, { emailVerified: true });
   ```
   Single UPDATE, no SELECT round-trip needed.

4. Run `npm run migration:generate -- --name=AddEmailVerifiedToUser` from the server directory. Inspect the generated migration file; confirm the SQL is `ALTER TABLE "user" ADD COLUMN "emailVerified" boolean NOT NULL DEFAULT false` (additive, non-breaking).

5. Scaffold the test file `server/src/modules/users/users.service.spec.ts` (if it doesn't already have a `setEmailVerified` describe block) — add a pending test stub for the method.

## 5. Definition of Done

The task is complete when:

- [ ] All code in "Files to Touch" is written and lints cleanly.
- [ ] Test files exist (scaffolded — actual tests filled in by `sdlc-tests`).
- [ ] No regressions in existing tests (`npm run test` passes in server).
- [ ] Code follows existing project conventions and patterns.
- [ ] `User` entity has `emailVerified: boolean` with `DEFAULT false`.
- [ ] TypeORM migration file generated; SQL is a plain `ADD COLUMN … DEFAULT false` (safe for live DB).
- [ ] `UsersService.setEmailVerified(userId)` exists and performs a single UPDATE.
- [ ] `UserDto` reflects `emailVerified` so callers can read verification state.

## 6. Test Plan

Tests that `sdlc-tests` should write for this task:

**Unit tests (Vitest / Jest):**
- `UsersService.setEmailVerified(userId)` — calls `repository.update` with `{ emailVerified: true }` and the correct user ID; does not throw on valid input.
- `UsersService.setEmailVerified(userId)` — propagates a DB error if the repository throws.

**Component tests (RTL):**
- None — purely server-side.

**E2E tests (Playwright):**
- None — covered by T-002 and T-004 e2e tests which exercise the full flow.

**Test data needs:**
- A mock `User` object where `emailVerified: false` (already the default after migration).

## 7. Notes & Considerations

- `DEFAULT false` in the migration means all pre-existing rows become `emailVerified = false` at migration time. If the platform already has active users in production, a one-time backfill (setting `emailVerified = true` for accounts older than the deployment date) must be decided before deploying. This is a deployment concern outside the code scope of this task — flag it in the PR description.
- `password` on the `User` entity uses `select: false` to avoid leaking hashes. Verify that `emailVerified` is returned in default SELECT queries used by the login path (i.e., it is NOT `select: false`). The login guard in T-002 reads it directly.
- The `googleId` column (added in FEAT-007) uses a nullable column with no default. `emailVerified` differs: it uses `NOT NULL DEFAULT false`. Follow the exact column decorator syntax from the ADR rather than copying `googleId`'s decorator.

## 8. References

- Feature Spec: `docs/features/FEAT-008-email-confirmation/01-feature-spec.md` (FR-2, FR-3, FR-5, §7 Product Tradeoffs)
- ADR: `docs/features/FEAT-008-email-confirmation/03-adr.md` (ADR-FEAT-008-02 — §3 Option A, §5 Decision, §9 Consequences)
- FEAT-007 ADR (googleId column precedent): `docs/features/FEAT-007-google-sign-in/03-adr.md` (ADR-FEAT-007-01)
- Related tasks: T-002 (consumes `setEmailVerified`, `emailVerified` login check), T-003 (consumes `setEmailVerified` + `create()` with `emailVerified: true`)
