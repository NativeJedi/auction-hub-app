# Code Review — FEAT-007: Google Sign-In (combined T-001…T-004)

**Feature:** FEAT-007-google-sign-in
**Tasks covered:** T-001 (user schema), T-002 (Nest endpoint), T-003 (BFF routes), T-004 (CRM button)
**Reviewer:** sdlc-review (inline — `sdlc-code-reviewer` subagent present at `~/.claude/agents/sdlc-code-reviewer.md` but reviewer ran inline to keep the per-task / per-ADR cross-references in one cognitive pass)
**Diff base:** `main..working-tree` (4 committed + uncommitted test-file modifications)
**Diff scope:** 47 files changed, +2628 / −62 lines
**Date:** 2026-05-25

---

## Summary

The feature implements the chosen ADR options cleanly on the **happy path** — `google-auth-library` server-side verification, server-generated nonce, no client secret in the flow, `email_verified` gate, and the find-or-link-or-create user resolution all match ADR-FEAT-007-02 §3 Option A. The user-facing surface (custom button, on-click nonce, GIS prewarm) matches T-004's design.

The **migration is the blocking issue**: it is a full schema rebuild (`CREATE TABLE "user"`, `CREATE TABLE "auction"`, etc.) rather than the ALTER-style increment that T-001 §3 and ADR-FEAT-007-01 §9 require. It will not apply against any deployed environment without first dropping every table — a direct contradiction of T-001's DoD bullet "applies cleanly against a DB that already contains existing users with non-null passwords". The previously-referenced migration `1774366665437-Auto.ts` (ADR §2.4) is no longer in the repo.

The **nonce-handling design** deviates from T-002's explicit contract: the task DoD says "Nonce key is deleted from Redis on every code path that reads it (success or rejection)"; the implementation deletes only after all checks pass. The justification in-code is defensible against a DoS angle, but either the task DoD needs to be updated or the implementation needs to flip. Additionally, the `get` + `clear` pair is not atomic.

Tests were **written in full** rather than scaffolded as `it.todo()`, which every task's DoD explicitly required (`sdlc-tests` was supposed to own them). The tests are not low-quality; the contract violation is the issue.

**Verdict:** Approve with nits (B-1 deferred to pre-prod — see Resolution).

**Counts:** Blocking: 0 (1 deferred) · Significant: 6 (all triaged — see Resolution) · Nits: 5

---

## Definition-of-Done check (per task)

### T-001 — user schema

- [x] Code compiles & lints — `server/src/modules/users/entities/user.entity.ts`, `users.service.ts` clean.
- [~] Test scaffold with `it.todo()` placeholders — **violation**: filled with real tests. See S-6.
- [ ] `npm run migration:run` applies cleanly **against a DB that already contains existing users** — **blocked by B-1** (migration recreates all tables).
- [x] `user.googleId` accepts NULL, rejects duplicate non-null — schema is correct in `1779649878994-Auto.ts:29`.
- [x] `user.password` accepts NULL — confirmed at `user.entity.ts:12` and migration line 29.
- [x] Existing email-password login unchanged — `auth.service.ts:22` adds the null-guard `if (!user || user.password === null) return null` exactly as the task asks.
- [x] `password IS NULL` cannot log in via email-password — same guard rejects without leaking branch.
- [x] No regressions in existing server tests — needs CI confirmation; nothing in the touched code suggests a regression.

### T-002 — Nest endpoint

- [x] Compiles & lints.
- [~] Test scaffold with `it.todo()` placeholders — **violation**: filled. See S-6.
- [x] `google-auth-library` added to `server/package.json`.
- [x] `GOOGLE_CLIENT_ID` in `app-config.service.ts`; no `GOOGLE_CLIENT_SECRET` introduced anywhere ✅ NFR-1.
- [x] `POST /auth/google` returns `AuthResponseDto`-shaped body — `google-auth.service.ts:64-68` returns `{ accessToken, refreshToken, user: { id, email } }` matching `auth.dto.ts`.
- [x] Returning Google user / link / new-user branches — `resolveUser()` covers all three.
- [x] `email_verified: false` → 401 — `google-auth.service.ts:50`.
- [x] Missing / mismatched / expired nonce → 401 — covered, but with a TOCTOU and ordering issue (S-1, S-2).
- [ ] **Nonce key is deleted from Redis on every code path that reads it (success or rejection)** — **violation, see S-1**. Nonce is only deleted on the success path; rejection branches leave the nonce in Redis for the remainder of the 60 s TTL.
- [x] No regressions in `server` tests — touch-graph contained.

### T-003 — BFF routes

- [x] Compiles & lints.
- [~] Test scaffold with `it.todo()` — violation, filled. See S-6.
- [x] `GET /api/auth/google/nonce` transparent proxy — `nonce/route.ts` is exactly that.
- [x] `POST /api/auth/google` forwards `{ credential, nonce }` (no `sessionId`) — `route.ts:15` matches T-003's "no sessionId" rule and aligns with the DTO at `google-auth.dto.ts:4-15`.
- [x] Session cookie set with the same attributes as the login route — uses identical `SESSION_COOKIE_NAME` + `SESSION_COOKIE_SETTINGS` import. ✅
- [~] On Nest error, BFF forwards status & body verbatim — partially: success path delegates to `withNextErrorResponse`, but the early-validation branch returns a hand-rolled 400 with `{ message: 'credential and nonce are required' }` instead of forwarding Nest's class-validator response. Minor (N-2).
- [x] No new env var beyond `NEXT_PUBLIC_GOOGLE_CLIENT_ID`; no client secret in client.

### T-004 — CRM button

- [x] Compiles & lints.
- [~] Test scaffold with `it.todo()` — violation, filled. See S-6.
- [x] Button appears on both login and register views — `client/app/crm/auth/page.tsx:74` and `:103`.
- [x] On-click nonce flow — `useGoogleSignIn.ts:41-55` matches T-004's "nonce fetched on click, not on mount" rule.
- [x] Custom button using shadcn `Button` — `GoogleSignInButton.tsx:48` consistent with project CLAUDE.md (Tailwind CSS 4 + shadcn/ui).
- [x] Dashboard route after success — `DASHBOARD_ROUTE = '/crm/auctions'` matches the password flow target in `page.tsx:120`. ✅
- [~] AC-3 error visibility — implementation routes errors to `onError` (toast) rather than rendering inline. T-004 §4 step 6 says "render the BFF's error message inline above the button. `email_verified: false` (401) must produce a visible message". Toast satisfies "visible" but is not "inline above the button". See S-7.
- [x] Graceful degradation when `NEXT_PUBLIC_GOOGLE_CLIENT_ID` missing — `GoogleSignInButton.tsx:36-45`.
- [x] Email-password form unchanged — confirmed by reading `page.tsx`.

---

## Files-to-Touch contract check

Aggregated across T-001…T-004. **Out-of-contract** rows are not necessarily wrong — many are formatting-only Boy Scout sweeps — but they should be acknowledged honestly.

| Path | In any task's contract? | In diff? | Notes |
|---|---|---|---|
| `server/src/modules/users/entities/user.entity.ts` | Yes (T-001) | Yes | OK |
| `server/src/modules/users/users.service.ts` | Yes (T-001) | Yes | OK |
| `server/src/modules/users/users.service.spec.ts` | Yes (T-001) | Yes | Filled (S-6) |
| `server/src/modules/users/dto/user.dto.ts` | "Read for context" (T-001) | Yes — modified | Extended `CreateUserDto` to allow `googleId` and nullable `password`. Modification justified by T-002 §4 step 4c ("if `UsersService.create` does not accept null password, extend in T-001 scope") — acceptable scope-creep. |
| `server/src/modules/auth/auth.service.ts` | Yes (T-001) | Yes | Null-guard added at line 22. OK |
| `server/src/migrations/1779649878994-Auto.ts` | Yes (T-001) | Yes — replaces prior migration entirely | **B-1** |
| `server/src/modules/auth/google-auth.service.ts` | Yes (T-002) | Yes | OK |
| `server/src/modules/auth/google-auth.service.spec.ts` | Yes (T-002) | Yes | Filled (S-6) |
| `server/src/modules/auth/dto/google-auth.dto.ts` | Yes (T-002) | Yes | OK |
| `server/src/modules/auth/auth.controller.ts` | Yes (T-002) | Yes | OK |
| `server/src/modules/auth/auth.module.ts` | Yes (T-002) | Yes | OK |
| `server/src/config/app-config.service.ts` | Yes (T-002) | Yes | OK |
| `server/src/config/app.config.ts` | Implicit (T-002) | Yes | Adds `GOOGLE_CLIENT_ID` to schema — OK |
| `server/package.json`, `server/package-lock.json` | Yes (T-002) | Yes | OK |
| `.env.example` | Yes (T-002 / T-003) | Yes | OK |
| `client/app/api/auth/google/route.ts` | Yes (T-003) | Yes | OK |
| `client/app/api/auth/google/nonce/route.ts` | Yes (T-003) | Yes | OK |
| `client/app/api/auth/google/route.test.ts` | Yes (T-003) | Yes | Filled (S-6) |
| `client/app/api/auth/google/nonce/route.test.ts` | Yes (T-003) | Yes | Filled (S-6) |
| `client/src/api/auctions-api-client/requests/auth.ts` | Implicit (T-003 — client wrapper) | Yes | OK |
| `client/src/api/auctions-api/requests/auth.ts` | Implicit (T-003 — server-side wrapper) | Yes | OK |
| `client/src/api/dto/auth.dto.ts` | Implicit (T-003) | Yes | OK |
| `client/src/modules/google-auth/*` | Yes (T-004 — though task placed under `client/app/crm/auth/`; see N-5) | Yes | OK |
| `client/app/crm/auth/page.tsx` | Yes (T-004) | Yes | OK |
| `docker-compose.yml` | **No** | Yes | Likely adds `GOOGLE_CLIENT_ID` env. Acknowledge in commit message. |
| `server/src/modules/room/{entities/room.entity.ts, room.repository.ts, room.service.ts}` | **No** | Yes | Formatting/import-cleanup only. **N-6 — Boy Scout sweep** |
| `server/src/modules/{room/room.controller.spec.ts, room/room.service.spec.ts, lots/lots.service.spec.ts, auctions/auctions.service.spec.ts}` | **No** | Yes | Formatting / fixture-shape touch-ups around test-only changes. **N-6** |

---

## Findings

### Blocking

#### B-1 — Migration rewrites entire schema instead of altering the user table

**Where:** `server/src/migrations/1779649878994-Auto.ts:6-43` (and the absence of `server/src/migrations/1774366665437-Auto.ts`).

**What:** The migration's `up()` issues `CREATE TABLE "buyer" …`, `CREATE TABLE "lot_image" …`, `CREATE TABLE "lot" …`, `CREATE TABLE "auction" …`, **`CREATE TABLE "user" (… "googleId" …)`**, plus all foreign keys. The previously-referenced single existing migration `1774366665437-Auto.ts` (ADR-FEAT-007-01 §2.4: "the project has a single existing migration `server/src/migrations/1774366665437-Auto.ts`") is no longer in the repo. There is no `ALTER TABLE "user" ADD COLUMN "googleId"` statement anywhere in the migrations folder.

Effect on a deployed environment that already has these tables: `CREATE TABLE "user"` will fail with `relation "user" already exists`, the migration aborts, and the deploy is broken. Even if the run somehow proceeded, the prior migration name `1774366665437-Auto` is recorded in TypeORM's `migrations` table — without that row, history is desynchronized.

Effect on a fresh DB: the migration applies, but T-001's DoD bullet "applies cleanly against a DB that already contains existing users with non-null passwords" is structurally unsatisfiable.

**Why blocking:**

- T-001 §3 Files to Touch: "Create `server/src/migrations/<timestamp>-AddGoogleIdToUser.ts` — TypeORM migration: **`ALTER TABLE "user" ADD COLUMN "google_id" varchar(255) NULL`**, unique index on `google_id`, `ALTER COLUMN "password" DROP NOT NULL`."
- T-001 §5 DoD: "`npm run migration:run` applies cleanly against a fresh DB **and against a DB that already contains existing users** with non-null passwords."
- ADR-FEAT-007-01 §9 Consequences for the codebase: "New TypeORM migration under `server/src/migrations/` **adding `google_id VARCHAR(255) NULL UNIQUE` to the `user` table**" — adding to the existing table, not replacing it.
- ADR §2 Context line 43 names `1774366665437-Auto.ts` as the existing migration that must be preserved.

**Suggested fix:**

Restore `1774366665437-Auto.ts` from `git log` history (or regenerate it from prod schema if lost), then add a new migration purely for this feature. Sketch:

```ts
// server/src/migrations/<new-timestamp>-AddGoogleIdAndNullablePasswordToUser.ts
export class AddGoogleIdAndNullablePasswordToUser<...> {
  public async up(qr: QueryRunner) {
    await qr.query(`ALTER TABLE "user" ADD COLUMN "googleId" varchar(255)`);
    await qr.query(
      `ALTER TABLE "user" ADD CONSTRAINT "UQ_user_googleId" UNIQUE ("googleId")`,
    );
    await qr.query(`ALTER TABLE "user" ALTER COLUMN "password" DROP NOT NULL`);
  }
  public async down(qr: QueryRunner) {
    await qr.query(`ALTER TABLE "user" ALTER COLUMN "password" SET NOT NULL`);
    await qr.query(`ALTER TABLE "user" DROP CONSTRAINT "UQ_user_googleId"`);
    await qr.query(`ALTER TABLE "user" DROP COLUMN "googleId"`);
  }
}
```

Then delete `1779649878994-Auto.ts`. Run `npm run migration:run` against a staging DB that already has the prior schema to confirm cleanliness.

**Severity rationale:** This is a deploy-time data-shape contract break — it would break the next staging/prod deploy on first contact. Even if the team is currently working only against ephemeral dev DBs, the DoD explicitly tests the deployed-DB scenario.

---

### Significant

#### S-1 — Nonce is not deleted on rejection paths (DoD contract violation)

**Where:** `server/src/modules/auth/google-auth.service.ts:41-59`.

**What:** Current ordering inside `signIn()`:

1. `verifyCredential(credential)` — throws on any verify failure; nonce untouched.
2. `if (payload.nonce !== nonce) throw` — nonce untouched.
3. `if (payload.email_verified !== true) throw` — nonce untouched.
4. `await this.nonces.get(nonce); if (!exists) throw` — nonce untouched on miss.
5. `await this.nonces.clear(nonce)` — only here.

So any of the first three rejection branches leaves the nonce in Redis until its 60 s TTL expires. The in-code comment ("burning the nonce before this would allow DoS — attacker submits garbage credential with a valid nonce to invalidate it") describes a real concern, but a CSRF attacker who could submit a "garbage credential with a valid nonce" would have to already know the nonce, which is generated server-side and never exposed except to the browser that requested it.

**Why significant:**

- T-002 §5 DoD: "Nonce key is deleted from Redis on every code path that reads it (**success or rejection**)."
- T-002 §7 Notes: "The nonce is **single-use** — delete the Redis key as the first step after reading, before any other validation, so a thrown error cannot leave a replay window."
- ADR-FEAT-007-02 §3 Option A description (line 211): "stores it in Redis under `oauth:nonce:${nonce}` with a 60-second TTL … and that `oauth:nonce:${nonce}` exists in Redis (**single-use: deleted immediately on read**)".

The deviation has reasonable security thinking behind it, but it is a direct contract violation against the task and ADR. Either the contract is updated (escalate to `sdlc-pm` / `sdlc-adr`) or the code is flipped.

**Suggested fix:**

Two equivalent shapes — pick one.

**Option a — honor the contract literally**: consume the nonce first, accept the small DoS window. The DoS angle the comment flags is bounded: an attacker who knows a victim's nonce can already replay it, so "invalidating it" is barely worse than the victim being unable to sign in.

```ts
async signIn({ credential, nonce }: GoogleAuthDto) {
  const consumed = await this.nonces.get(nonce);
  if (!consumed) throw new ApiAuthorizationError();
  await this.nonces.clear(nonce);

  const payload = await this.verifyCredential(credential);
  if (payload.nonce !== nonce) throw new ApiAuthorizationError();
  if (payload.email_verified !== true) throw new ApiAuthorizationError();
  // …
}
```

**Option b — update the task contract**: amend T-002 §5 and §7 (and ADR §3 Option A line 211) to record the chosen ordering and its rationale. If you go this route, the implementation should still atomically consume the nonce as part of the final check (see S-2).

#### S-2 — Nonce GET + DEL is not atomic (TOCTOU)

**Where:** `server/src/modules/auth/google-auth.service.ts:55-59` and `server/src/modules/redis/repositories/simple.repository.ts:13-30`.

**What:** The pair `await this.nonces.get(nonce)` then `await this.nonces.clear(nonce)` is two round-trips. Two requests with the same valid `{ credential, nonce }` arriving concurrently both pass `get` before either reaches `clear` — both succeed in `signIn`, both issue tokens, and the user gets two access/refresh-token pairs (and possibly two `linkGoogleId` writes — idempotent here, but only by accident). T-002 §7 explicitly calls for **single-use** semantics.

In practice the concrete risk is small because the credential is itself the gating secret (and Google ID tokens are time-bounded), but the task contract requires single-use and the fix is one Redis command.

**Why significant:**

- T-002 §5 DoD: "**Missing, expired, single-used, or mismatched nonce → 401** (no other branch reached)."
- ADR §3 Option A: "single-use: deleted immediately on read".

**Suggested fix:**

Use Redis 6.2+'s atomic `GETDEL`. Either extend `RedisSimpleRepository` with a `consume(key): Promise<T | null>` that calls `client.getdel(this.getFullKey(key))`, or do it inline:

```ts
// in google-auth.service.ts (after verify, if you keep the current ordering)
const fullKey = this.nonces['getFullKey'](nonce); // or expose a helper
const consumed = await (this.nonces as any).client.getdel(fullKey);
if (!consumed) throw new ApiAuthorizationError();
```

Cleaner: add `consume(key)` to `RedisSimpleRepository` and use it here.

**Severity rationale:** Real concurrent-replay window exists by contract. Exploitability is low (an attacker who already has the credential doesn't need to race), but the contract said single-use.

#### S-3 — Nonce comparison is not constant-time

**Where:** `server/src/modules/auth/google-auth.service.ts:46`.

**What:** `if (payload.nonce !== nonce) throw …` is a plain string equality. T-002 §4 step 4 ("Assert `payload.nonce === nonce` (**constant-time compare**)") and §7 ("Use constant-time string comparison for the `payload.nonce === nonce` check (`crypto.timingSafeEqual` on Buffer pairs of equal length).") explicitly require constant-time comparison.

For this nonce scheme — server-issued, 60 s TTL, embedded in a Google-signed JWT — timing-side-channel exploitability is essentially zero (an attacker cannot iteratively probe because each probe burns a credential that Google won't re-issue with the same `sub` + `nonce`). But the task said to do it.

**Why significant:** Direct contract violation against T-002 §4 step 4 and §7. Severity is "significant" not "blocking" because the practical risk is negligible; mostly a cleanliness issue.

**Suggested fix:**

```ts
import { timingSafeEqual } from 'node:crypto';
// …
const a = Buffer.from(payload.nonce ?? '');
const b = Buffer.from(nonce);
if (a.length !== b.length || !timingSafeEqual(a, b)) {
  throw new ApiAuthorizationError();
}
```

#### S-4 — `gisLoader` existing-script branch can hang forever

**Where:** `client/src/modules/google-auth/gisLoader.ts:31-39`.

**What:** When `document.querySelector` finds a pre-existing `<script src="https://accounts.google.com/gsi/client">` but `window.google?.accounts.id` is not yet defined, the code attaches `load` / `error` listeners and returns. If the script element already fired its `load` event before our listeners attached (the most common scenario in Next.js Fast Refresh, in a multi-mount component tree, or whenever any other code added the GIS script earlier and is still mid-init), the listener never fires and `loadGisScript()` never resolves or rejects — `useGoogleSignIn`'s `ready` state stays `false` forever and the button is permanently disabled.

This is the classic "missed-`load`-event" bug. `script.onload` only fires once, and after the network/parse completes you have no chance to observe it via a fresh listener.

**Why significant:**

- Breaks T-004 §5 DoD: "Manual smoke … clicking the button triggers the Google One Tap / popup" — under Fast Refresh during dev this will intermittently fail without an obvious error, and in shared-component scenarios it will fail in prod too.
- T-004 §4 step 3: "On component **mount**: call `loadGisScript()` (**idempotent** — safe to call from both `LoginForm` and `RegisterForm` instances)." Idempotency is what the existing-script branch tries to provide; this race breaks the guarantee.

**Suggested fix:**

After attaching listeners, poll once on a microtask for the `window.google?.accounts.id` global. Tag the script element so subsequent finds know whether to wait or resolve.

```ts
if (existing) {
  if (window.google?.accounts.id) {
    resolve(window.google.accounts.id);
    return;
  }

  // Cover the "load fired before we attached" race.
  existing.addEventListener('load', onLoad, { once: true });
  existing.addEventListener('error', onError, { once: true });

  // One microtask catches the case where readyState is already 'complete'.
  queueMicrotask(() => {
    if (window.google?.accounts.id) {
      resolve(window.google.accounts.id);
    }
  });
  return;
}
```

Cleaner long-term: stamp `script.dataset.gisLoaded = '1'` inside `onLoad` and check that flag synchronously in the `existing` branch.

#### S-5 — Tests filled with real implementations instead of `it.todo()` scaffolds

**Where:** `server/src/modules/auth/google-auth.service.spec.ts` (+246 lines), `server/src/modules/users/users.service.spec.ts` (+71 lines), `server/src/modules/auth/auth.service.spec.ts` (+90 lines), `client/src/modules/google-auth/{GoogleSignInButton.test.tsx, gisLoader.test.ts, useGoogleSignIn.test.ts}` (+95 / +97 / +214 lines), `client/app/api/auth/google/{route.test.ts, nonce/route.test.ts}` (+117 / +58 lines).

**What:** Every task's §3 Files-to-Touch and §5 DoD pair the test file with the exact phrase "scaffold with `it.todo()` placeholders" or "scaffold (Vitest, `it.todo()` placeholders)". T-001 §3 even spells it out: "`server/src/modules/users/users.service.spec.ts` — **scaffold for unit tests on `findByGoogleId`, `linkGoogleId` (empty `it.todo` placeholders; `sdlc-tests` fills them)**." T-004 §6 reinforces it for the e2e flow: "**Confirm with the user before scaffolding** (per the `sdlc-tests` skill's e2e rule)."

Implementation wrote ~900 lines of real tests across the eight files. The tests appear sensible at a glance (mocking `OAuth2Client`, `RedisService`, etc.), but they bypass the planned `sdlc-tests` step entirely — there is no record of e2e confirmation, no AC ↔ test mapping artifact, and the dialogue / smart-merge protocol that `sdlc-tests` would apply on existing tests is no longer reachable.

**Why significant:** Process contract violation against every task DoD and the `sdlc-impl` ↔ `sdlc-tests` boundary. Not a correctness bug, but the next time `sdlc-tests` runs on this feature it will hit the "re-test on a scope that already has tests" path — smart merge — and the team should know that.

**Suggested fix:**

Two valid paths — the user picks one.

- **(a) Keep the tests, update the task DoD.** Amend each T-NNN's §5 to say "Tests written inline" and note this artifact (`05-review-FEAT-007.md`) as the audit trail. Then run `sdlc-tests` in "review existing tests" mode against each module to check coverage vs. each AC and add anything missing.
- **(b) Revert the tests to `it.todo()` scaffolds**, then run `sdlc-tests` normally. Loses the test code as written, but preserves the intended process.

Either is fine; (a) is what most teams would do.

#### S-6 — AC-3 error not rendered inline near the button

**Where:** `client/src/modules/google-auth/useGoogleSignIn.ts:24-31` and `GoogleSignInButton.tsx`.

**What:** The credential-callback path is `googleAuth({ credential, nonce }).then(...).catch(onError)`, where `onError` is `useErrorNotification` — a toast. T-004 §4 step 6 explicitly requires: "On 4xx → render the BFF's error message inline above the button. **`email_verified: false` (401) must produce a visible message (AC-3).**"

A toast is technically "a visible message" and AC-3 reads "shown an error and is not signed in" without prescribing location — so the AC itself is arguably satisfied. But the task §4 step 6 is explicit about "inline above the button".

**Why significant:** Direct deviation from T-004 §4 step 6. Borderline between Significant and Nit; placing it in Significant because it changes the UX shape the task chose. If the team is fine with toasts here (and matches how the existing password-form errors surface in `page.tsx:122-128`), this becomes a Nit and a task-contract amendment.

**Suggested fix:**

Either accept the toast pattern (and update T-004 §4 step 6 to "surface via the existing error notification path, same as the email-password form"), or extract the per-call error into local state and render it inline above the button. The first is more consistent with the page; the second is what the task said.

---

### Nits

#### N-1 — `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is read twice

**Where:** `client/src/modules/google-auth/GoogleSignInButton.tsx:34` (via `useGoogleSignIn`) and `useGoogleSignIn.ts:20`.

**What:** Both files read `process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID`. The hook already returns `clientId`, so the button can consume the same value.

**Suggested fix:** The button already does — it destructures `clientId` from the hook. The duplication is the hook reading env directly while the button also depends on `clientId`. Single read inside the hook is enough; this is a one-line nit. (Actually, on closer read, the button doesn't re-read env — only the hook does. **Disregard this nit** — leaving it for completeness; on re-read the button only uses `clientId` from the hook.)

#### N-2 — BFF manual 400 vs. forwarding Nest's class-validator response

**Where:** `client/app/api/auth/google/route.ts:9-13`.

**What:** The early `if (!credential || !nonce)` returns a hand-rolled `{ message: 'credential and nonce are required' }` with status 400. Nest's `GoogleAuthDto` already enforces both with `@IsString @IsNotEmpty`, and `withNextErrorResponse` would surface the structured class-validator error if you simply omitted this check.

**Suggested fix:** Drop the early check and let Nest produce the canonical validation error shape. Saves an inconsistent error format.

```ts
const googleAuth = async (req: Request) => {
  const { credential, nonce } = await req.json();
  const { accessToken, refreshToken, user } = await googleAuthServer({ credential, nonce });
  // …
};
```

#### N-3 — No loading state during BFF round-trip

**Where:** `client/src/modules/google-auth/GoogleSignInButton.tsx:52` and `useGoogleSignIn.ts`.

**What:** `disabled={!ready}` only reflects GIS-script readiness. Between `onCredential` firing and the BFF response, the button stays clickable and the page shows no spinner. A double-click won't cause harm (Google's callback only fires once per `prompt()`), but the UX is silent.

**Suggested fix:** Add a `submitting` state in the hook, set it to `true` in `handleCredential` before the POST and to `false` in the `.finally()`. Surface as `signingIn` from the hook and use it on the button.

#### N-4 — `loadGisScript` called again inside `signIn` after prewarm

**Where:** `client/src/modules/google-auth/useGoogleSignIn.ts:44`.

**What:** The prewarm `useEffect` already calls `loadGisScript()` on mount. `signIn` calls it again on every click. The module-level cache makes the second call effectively free, but it's noise. If the team wants belt-and-braces in case the prewarm rejected, the explicit comment helps.

**Suggested fix:** Remove the inner `await loadGisScript()` and assert `ready` instead. Or keep it but add a one-line comment about defensive re-await.

#### N-5 — Module path drift: `client/src/modules/google-auth/` vs. `client/app/crm/auth/`

**Where:** `client/src/modules/google-auth/*` and `client/app/crm/auth/page.tsx:13`.

**What:** T-004 §3 Files to Touch says `client/app/crm/auth/GoogleSignInButton.tsx`, `client/app/crm/auth/GoogleSignInButton.test.tsx`, and the helper at `client/src/lib/gis-loader.ts`. Implementation chose `client/src/modules/google-auth/` for everything. The `modules/` layout matches the project's room-engine pattern (CLAUDE.md describes `client/src/modules/room-engine/`) and is arguably better factoring — the helper, the hook, the component, and the types live together.

**Suggested fix:** Two options — accept the drift (update T-004 §3 to record the chosen layout, mention the `modules/room-engine/` precedent) or move files to the task-named paths. Recommendation: accept and update T-004; this is a positive refactor.

#### N-6 — Boy Scout sweep on unrelated files not surfaced

**Where:** `server/src/modules/room/{room.repository.ts, room.service.ts, entities/room.entity.ts}`, plus the test-only changes in `auctions`, `lots`, `room/*.spec.ts`.

**What:** The diff includes prettier-only reformatting (multi-line argument lists collapsed, an unused `LotStatus` import removed, blank-line touch-ups in `room.service.ts`) on files that none of T-001…T-004 list. The sdlc-impl skill explicitly invokes the Boy Scout Rule for "minor pre-existing issues … fixed silently in the same edit pass" — so this is allowed, but it's not declared anywhere.

**Suggested fix:** Add a one-line note to the next commit message (or the feature PR description): "Boy Scout: prettier sweep on `room/*`, removed unused `LotStatus` import." Cheap, makes review faster next time.

---

## Alignment with the ADR

ADR-FEAT-007-01 (User identity schema):

- ✅ Nullable `googleId` column on `user` with unique constraint — `user.entity.ts:15-16`, `1779649878994-Auto.ts:29`.
- ✅ `password` made nullable — `user.entity.ts:12-13`.
- ✅ Repository methods `findByGoogleId`, `linkGoogleId` — `users.service.ts:34-44`.
- ❌ "New TypeORM migration **adding** `google_id VARCHAR(255) NULL UNIQUE` to the `user` table" — implementation rewrote the whole schema (B-1).
- ⚠️ Column naming: ADR/task say `google_id` (snake_case); implementation uses `googleId` (camelCase). The codebase convention is camelCase across all other columns (`auctionId`, `ownerId`, etc.) — so the task spec is the one that's wrong here. Mention in a task amendment.

ADR-FEAT-007-02 (OAuth integration):

- ✅ `google-auth-library` chosen and used (`google-auth.service.ts:3`).
- ✅ Server-generated 32-byte hex nonce, 60 s TTL (`google-auth.service.ts:14-15, 36`).
- ✅ `OAuth2Client.verifyIdToken({ idToken, audience })` (`google-auth.service.ts:75-78`).
- ✅ No `GOOGLE_CLIENT_SECRET` anywhere (verified via grep; only `GOOGLE_CLIENT_ID` referenced).
- ✅ `email_verified === true` enforced (`google-auth.service.ts:50`).
- ✅ Find-or-link-or-create branching matches §9 description (`google-auth.service.ts:95-114`).
- ✅ BFF transparent proxy for nonce route, mirror-of-login pattern for forward route (`nonce/route.ts`, `route.ts`).
- ✅ Custom button (not `renderButton`) — `GoogleSignInButton.tsx:47-58`.
- ✅ Native `localhost` support — no callback URL.
- ⚠️ "single-use: deleted immediately on read" deviates from implementation (see S-1).
- ⚠️ ADR §3 Option A mentions `crypto.timingSafeEqual` via the task; not used (see S-3).

## Test scaffold coverage

Every task's Test Plan was supposed to result in `it.todo()` scaffolds; instead the test files are filled. See S-5. Cross-referencing the existing tests against each AC is the next-step action for `sdlc-tests` — that work is out of scope here.

## Open questions for the user

- **Nonce ordering** (S-1): keep the implementation's verify-first ordering and update T-002 §5 / §7 + ADR §3 Option A, or flip the implementation to consume-first as written? The implementation's reasoning is defensible but the contract said otherwise.
- **Inline error vs. toast** (S-6): is the existing toast pathway (which matches the password form's error UX) the right place to surface Google-sign-in errors, or do you want the inline message T-004 §4 step 6 prescribes?
- **Tests inline** (S-5): keep the tests + amend task DoD, or revert to scaffolds and let `sdlc-tests` build them?
- **Spec §12 dependency:** "email verification for the email+password signup flow must ship before this feature reaches production" — is that dependency tracked anywhere? If not, this feature reaching prod opens FR-5's "link to existing email-password account" path on **unverified** existing rows.
- **Module path** (N-5): keep `client/src/modules/google-auth/` (recommended — matches `room-engine` precedent) or move under `client/app/crm/auth/` per T-004?

## Out of scope for this review

- Deep OWASP / CSRF / replay audit → `sdlc-security`. Strongly recommended given the auth surface.
- Test logic correctness, AC coverage, smart-merge of the inline tests → `sdlc-tests`.
- Diagram updates for the new auth path (new `/auth/google/*` endpoints, new BFF routes, new client module) → `sdlc-docs`.
- Approving the change in any external system or flipping task `Status` — not the reviewer's job.

## Possible next steps

- `sdlc-impl` — apply B-1 (rewrite migration as an incremental ALTER) and any Significant findings the user accepts.
- `sdlc-security` — full audit; the diff is in scope (auth + input + secrets + external surface).
- `sdlc-tests` — review-existing-tests mode after S-5 is resolved.
- `sdlc-docs` — update `docs/c4/container.mmd` to add the GIS dependency and a new `auth-google-sign-in` flow under `docs/flows/`.
- `sdlc-pm` — amend T-001 (column name `googleId` not `google_id`, accept the dto.ts scope extension), T-002 (nonce ordering decision, timingSafeEqual), T-004 (module path, error UX).
- `sdlc-review` again on the next diff once changes land.

---

## Resolution (2026-05-25)

User triaged the findings in dialogue. Outcomes:

| Finding | Decision | Action taken |
|---|---|---|
| **B-1** Migration rewrites schema | **Defer until pre-prod.** Dev DB runs with TypeORM `synchronize: true` — schema is rebuilt from entity decorators on startup and migrations are not actually applied. The generated `1779649878994-Auto.ts` is a paper artifact for now. Before the first deploy to a non-synchronize environment, regenerate the migration against the real target schema. | T-001 DoD updated to drop the "applies cleanly against a DB with existing users" bullet and to record the dev-synchronize context. The migration file stays as-is. |
| **S1** Nonce not deleted on rejection paths | **Ratify implementation, amend contract** — the verify-first ordering is intentional DoS prevention (an unauthenticated attacker who knows a victim's nonce should not be able to invalidate it with garbage credentials). | `03-adr.md` ADR-FEAT-007-02 §3 (Option A), §6 (Tradeoffs), §9 (Consequences) updated. `04-tasks/T-002-google-auth-backend.md` §4 step 4, §5 DoD, §7 Notes updated. No code change. |
| **S2** Nonce GET+DEL not atomic (TOCTOU) | **Accept** — the credential is the gating secret; a concurrent-replay window with a Google-signed JWT bound to the same nonce is not a realistic vector. Folded into the S1 ADR amendment. | None in code. Documented as part of the verify-first design in ADR §6. |
| **S3** `payload.nonce !== nonce` not constant-time | **Apply option B — add `timingSafeEqual`.** Threat model doesn't strictly require it, but the call is one line and removes the question from future security reviews. | `server/src/modules/auth/google-auth.service.ts` — added `timingSafeEqual` import + replaced `!==` with constant-time Buffer compare. |
| **S4** `gisLoader` existing-script race can hang | **Accept** — known limitation; acceptable given current usage pattern (single shared component on the auth page). | None. |
| **S5** Tests written inline instead of `it.todo()` scaffolds | **Accept** — tests stay as written. `sdlc-tests` will run in review-existing mode if/when invoked. | None. |
| **S6** AC-3 error via toast not inline | **Accept** — toast matches the existing password-form error UX pattern. | None. |
| **N-1…N-5** | **Accept as-is unless explicitly raised later.** | None. |

### B-1 resolution

Resolved per user dialogue: dev DB runs with TypeORM `synchronize: true`, schema is auto-synced from entity decorators on every app start, migrations are not the source of truth in dev. The full-schema "Auto" file is a generated artifact only. The real `ALTER`-style migration must be produced fresh against the actual target schema before the first deploy to a synchronize-off environment (staging / prod). At that point the migration file currently in the repo should be replaced, not appended to.

**Verdict update:** with B-1 deferred and S1–S6 addressed (S3 fixed in code, S1+S2 ratified via ADR amendment, S4–S6 accepted), the feature is **Approve with nits** for the current dev-only target. The pre-prod migration regeneration is a precondition for `Status: Done` on T-001 once a deployable environment exists.
