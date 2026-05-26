# Task T-001: Add `googleId` to user, make `password` nullable

**Task ID:** T-001
**Feature:** FEAT-007-google-sign-in
**Status:** Todo
**Priority:** Must-have
**Depends on:** none

---

## 1. Context

This task delivers the persistence layer for FEAT-007. ADR-FEAT-007-01 chose Option A: a single nullable `googleId` column on the existing `user` table plus two new repository methods (`findByGoogleId`, `linkGoogleId`). Because FR-4 allows Google-only signups where the user never sets a password, the existing `password` column must also become nullable. This is its own task because every downstream piece (Nest endpoint, BFF, UI) reads from the schema and the new repo methods — it must land first.

Related requirements: FR-4, FR-5, FR-7, NFR-3

## 2. Description

Extend the `User` entity with a `googleId` field (nullable, unique, 255 chars), make `password` nullable, generate the corresponding TypeORM migration, and add two methods to `UsersService`: `findByGoogleId(googleId)` and `linkGoogleId(userId, googleId)`. The existing email-password flow must continue to work unchanged for users without a `googleId`.

## 3. Files to Touch

**Create:**
- `server/src/migrations/<timestamp>-AddGoogleIdToUser.ts` — TypeORM migration: `ALTER TABLE "user" ADD COLUMN "google_id" varchar(255) NULL`, unique index on `google_id`, `ALTER COLUMN "password" DROP NOT NULL`.
- `server/src/modules/users/users.service.spec.ts` — scaffold for unit tests on `findByGoogleId`, `linkGoogleId` (empty `it.todo` placeholders; `sdlc-tests` fills them).

**Modify:**
- `server/src/modules/users/entities/user.entity.ts` — add `@Column({ length: 255, unique: true, nullable: true }) googleId: string | null;` and change `password` to `nullable: true` with `string | null` typing.
- `server/src/modules/users/users.service.ts` — add `findByGoogleId(googleId: string)` and `linkGoogleId(userId: string, googleId: string)` methods.
- `server/src/modules/auth/auth.service.ts` — guard the password-comparison path against `user.password === null` (Google-only accounts cannot log in with password).

**Read for context (no changes expected):**
- `server/src/migrations/1774366665437-Auto.ts` — migration style reference.
- `server/src/modules/users/users.module.ts` — confirm `UsersService` is exported.
- `server/src/modules/users/dto/user.dto.ts` — confirm `CreateUserDto` shape; no changes required here.

## 4. Implementation Plan

1. Update `user.entity.ts`: add the `googleId` column with the constraints above; change `password` typing/decorator to nullable.
2. Run `npm run migration:generate -- AddGoogleIdToUser` from the root (per CLAUDE.md commands) and verify the generated SQL adds the column, the unique index, and drops NOT NULL on `password`. Hand-edit only if generation drops or reorders unrelated columns.
3. Add `findByGoogleId(googleId)` to `UsersService` — single TypeORM `findOne({ where: { googleId } })`.
4. Add `linkGoogleId(userId, googleId)` — `update({ id: userId }, { googleId })`, ensure it errors / no-ops cleanly when `userId` does not exist (decide and document in the method comment).
5. Audit `auth.service.ts` (and any other caller of `user.password`) for an implicit non-null assumption; add explicit null-guard that rejects login with the existing "invalid credentials" error so we do not leak account-state information.
6. Scaffold `users.service.spec.ts` next to `users.service.ts` with `it.todo()` placeholders for the new methods (do not write real tests — `sdlc-tests` owns that).

## 5. Definition of Done

- [ ] All code compiles with `cd server && npm run build` and lints cleanly.
- [ ] Test scaffold file exists with `it.todo()` placeholders for `findByGoogleId` and `linkGoogleId`.
- [ ] Schema after dev startup (with TypeORM `synchronize: true`): `user.googleId` accepts NULL, rejects duplicate non-null values, and `user.password` accepts NULL. Verified against the running dev container.
- [ ] **Pre-prod gate (deferred — out of scope for the current dev iteration):** before the first deploy to a non-synchronize environment, regenerate a clean incremental migration against the target schema (`ALTER TABLE "user" ADD COLUMN "googleId" …`, `ALTER COLUMN "password" DROP NOT NULL`) and replace the current full-rebuild `1779649878994-Auto.ts` artifact. Apply against a staging DB that already contains existing users to confirm cleanliness.
- [ ] Existing email-password login (`POST /auth/login`) continues to work unchanged for users whose `googleId` is NULL (manual smoke + existing tests green).
- [ ] A user row whose `password IS NULL` cannot be logged in via the email-password endpoint (returns same generic "invalid credentials" error).
- [ ] No regressions in `cd server && npm run test`.

## 6. Test Plan

**Unit tests (Vitest / Jest — server uses Jest):**
- `UsersService.findByGoogleId` — returns the user when a match exists; returns `null`/`undefined` when no match (matches the convention of `findByEmail`).
- `UsersService.linkGoogleId` — sets `googleId` on the target user; behavior when target does not exist matches step 4's documented decision.
- `AuthService.login` — when stored `user.password` is NULL, returns the same generic auth-failed error (does not throw, does not branch differently observable to the client).

**Component tests (RTL):**
- None — server-only task.

**E2E tests (Playwright):**
- None — covered by later tasks.

**Test data needs:**
- Fixture for a Google-only user (`password: null`, `googleId: 'google-sub-xyz'`).
- Fixture for a legacy email-password user (`password: '<bcrypt-hash>'`, `googleId: null`).

## 7. Notes & Considerations

- **Compactness exception:** parallelization gate failed; created on user request.
- ADR alignment: matches ADR-FEAT-007-01 §5 (chosen Option A), §9 Consequences "For the codebase".
- ADR-FEAT-007-01 §7 Known Limitations: single provider only — the column is intentionally Google-specific. Do not generalize to a `provider` column "just in case".
- Assumption (spec §12): email-verification for the password signup flow is a separate feature. This task does not address it; the linking risk (FR-5 binding to an unverified email) remains a product-side concern.
- The unique constraint on `google_id` must allow multiple NULLs (Postgres default behavior for UNIQUE on a nullable column — verify the generated migration does not add `WHERE google_id IS NOT NULL` predicate unless that is required).
- Do not add `linked_at` / `last_login_at` columns — explicitly deferred per ADR §8.

## 8. References

- Feature Spec: `01-feature-spec.md` — FR-4, FR-5, FR-7, NFR-3
- ADR: `03-adr.md` — ADR-FEAT-007-01 §5 (Decision), §9 (Consequences)
- Related tasks: T-002 (consumer of the new repo methods)
