# ADRs: FEAT-007 Google Sign-In

**Feature:** FEAT-007-google-sign-in
**Date:** 2026-05-22
**Decision makers:** sdlc-adr

This file contains two coupled architectural decisions for FEAT-007. They are recorded together because the OAuth flow choice (ADR-02) constrains the schema (ADR-01) and vice versa, but each follows the full ADR template independently.

- **ADR-FEAT-007-01** — User identity schema for Google linkage
- **ADR-FEAT-007-02** — OAuth integration: library, flow, and callback location

---

# ADR-FEAT-007-01: User Identity Schema for Google Linkage

**Feature:** FEAT-007-google-sign-in
**ADR ID:** ADR-FEAT-007-01
**Status:** Accepted
**Date:** 2026-05-22
**Decision makers:** sdlc-adr

---

## 1. Context

FEAT-007 introduces Google as a second sign-in option for CRM admins. The existing `user` entity (`server/src/modules/users/entities/user.entity.ts`) stores `id` (uuid), `email` (unique, 255), and `password` (bcrypt hash, 255). There is currently no representation of any external identity provider on the user record, no `oauth_*` table, and no `emailVerified` flag.

Per FR-2, the system must receive the Google account ID (Google's `sub` claim — a stable string per user that never changes even if the user changes their primary email) alongside the email and `email_verified` flag. Per FR-4, when no matching email exists, a new user must be created **storing that Google account ID**. Per FR-5, when the Google email matches an existing email-password user, the system must link the Google account to that user. Per NFR-3, only email, Google account ID, and optionally display name may be stored — no other profile data, no other scopes.

The architectural question is **where and how to model the link between a user and their Google identity** — a new column on `user`, a separate `oauth_identities` table, a JSON metadata column, or matching purely by email without storing a Google identifier at all.

The choice is load-bearing: changing the schema later requires a migration on the hottest entity in the application (User is referenced by `Auction`, `Auth`, `Room`, and every guard) and may require backfilling Google IDs from a re-prompt of users.

**Inherited assumption:** the spec's §12 dependency — email verification for the password signup flow must ship before FEAT-007 reaches production — is treated as a separate feature outside this ADR's scope. This ADR's recommendation is correct independent of how that dependency lands.

## 2. Decision Drivers

In order of importance:

- **Spec compliance** — FR-2, FR-4, and NFR-3 explicitly require persisting the Google account ID. A schema that does not store it requires changing the spec.
- **Account stability across IdP changes** — Google's `sub` is the only Google-side identifier guaranteed stable across email changes (relevant for Google Workspace admins whose primary email can be renamed by their workspace admin).
- **YAGNI on multi-provider** — spec §10 explicitly defers Apple/Microsoft/GitHub to the backlog. Pre-building multi-provider infrastructure is speculative complexity.
- **Migration cost** — the project has a single existing migration (`server/src/migrations/1774366665437-Auto.ts`). Schema choices that require multiple new tables or wide refactors are penalised.
- **Readability of the User entity** — `User` is touched by many modules. Adding noise (large JSON blobs, parallel relations) for a single planned provider degrades the central entity.

## 3. Options Considered

### Option A: Nullable `googleId` column on `user`

**Description:** Add `googleId VARCHAR(255) NULL UNIQUE` directly to the `user` table. NULL means the user has not linked Google. A unique index prevents two users from claiming the same Google `sub`. Lookups: `findByGoogleId(sub)` for returning sign-ins, `findByEmail(email)` for the link-on-match flow (FR-5), `linkGoogleId(userId, sub)` to attach Google to an existing email-password account.

**Pros:**
- Spec-compliant by construction (FR-2/FR-4/NFR-3)
- Single migration, single index, single column — trivial to reason about
- Returning sign-ins are an indexed unique lookup — O(log n)
- Resilient to Google Workspace email changes (we re-find by `sub`, not by stale email)
- Adds no noise for code paths that do not care about OAuth — readers of `User` see one extra nullable field

**Cons:**
- Adding a second provider later (Apple/Microsoft) requires either another column or a refactor to Option B
- Couples user identity to Google specifically — the schema "knows" about Google

**Estimated effort:** ~0.5 day (migration + repository methods + entity field).

### Option B: Separate `oauth_identities` table

**Description:** New table `oauth_identities (id, user_id, provider, provider_user_id, linked_at, UNIQUE (provider, provider_user_id))`. The `user` entity stays unchanged. A `OneToMany` relation `User.oauthIdentities` is added on the TypeORM side.

**Pros:**
- Natively supports multiple providers per user (Apple, Microsoft, etc.) without further migrations
- `user` table stays minimal
- Easy to model "linked at" / "last used" telemetry per provider in the future

**Cons:**
- Solves a problem the spec explicitly defers — adds complexity for a benefit we are committed to **not** taking now
- Every Google sign-in becomes a JOIN (or a separate query) instead of a column read
- Two-row write path for new Google signups (insert user + insert identity) — must be transactional
- New repository, new TypeORM relation, new migration for a single-provider feature

**Estimated effort:** ~1.5 days (new entity + migration + repository + transactional create flow + tests).

### Option C: Email-only matching, no Google identifier stored

**Description:** Trust that the verified `email` claim from Google is enough. On every Google sign-in, verify the ID token, read `email`, look up the user by `email`, create one if missing. No `googleId` column, no new table.

**Pros:**
- Smallest possible change — zero schema changes, zero migration
- Conceptually simple — "Google is just a fancy email-verifier"
- Same lookup path as the password flow (`findByEmail`)

**Cons:**
- **Contradicts spec FR-2, FR-4, and NFR-3** — would require changing the spec to be valid
- Vulnerable to Google Workspace email-change scenarios: a Workspace admin renames `ivan@company.com` → `ivan.petrov@company.com` in Google. On next sign-in, we cannot find the original user and either create a duplicate or silently lock them out of their auctions
- Vulnerable to email-takeover after domain abandonment: if `oldcompany.com` is sold and the new owner creates a Google Workspace account with the same email, our system cannot distinguish them from the original user (the new user's Google `sub` differs, but we are not checking it)
- Forecloses cheap implementation of future hardening — adding `googleId` later means a backfill pass for every existing Google-linked user, which we cannot do without re-prompting them

**Estimated effort:** ~0.25 day (no migration), but requires a spec amendment.

## 4. Comparison

| Criterion | A — `googleId` column | B — `oauth_identities` table | C — email-only |
|---|---|---|---|
| Spec compliance (FR-2/FR-4/NFR-3) | Yes | Yes | **No** |
| Resilience to email change at IdP | Yes | Yes | **No** |
| Defense against email-takeover | Yes | Yes | **No** |
| Migration footprint | 1 column + index | 1 new table + relation | None |
| Future multi-provider cost | Refactor to B | Already supports | Refactor to B |
| Code paths touched | `User`, `UsersService` | `User`, `UsersService`, new repo | `UsersService` only |
| Readability of central `User` entity | Slight noise (1 column) | Clean | Cleanest |

## 5. Decision

**Chosen option:** A — nullable `googleId` column on `user`.

**Rationale:** The decision is driven by spec compliance and stability-across-IdP-changes, in that order. Option C fails both — it forces a spec amendment and quietly loses the Workspace email-change case. Option B solves a problem the spec deferred and pays JOIN cost and write-path complexity for a benefit we are committed to not taking. Option A delivers exactly what the spec asks for, no more, no less, and the migration cost is trivial.

Option C deserves an honest mention: for our user base (CRM admins, mostly personal `gmail.com` accounts), the email-change and takeover scenarios are low-probability. The decision is not "C is dangerous" — it is "C requires changing the spec and forecloses cheap hardening, while A costs us 0.5 day and one nullable column". The asymmetry favours A.

## 6. Tradeoffs

**Gained:**
- Stable identity that survives Google-side email changes
- Indexed O(log n) lookup for returning Google sign-ins
- Defense against email-takeover scenarios on Workspace domains
- Compliance with spec FR-2/FR-4/NFR-3 without re-litigation

**Sacrificed:**
- The `user` entity is now Google-aware. Adding Apple/Microsoft later will either add another nullable column (cheap but ugly) or trigger a migration to Option B (a real refactor).
- The `password` column likely becomes nullable to support Google-only signups (FR-4). Code that currently assumes a non-null `password` (e.g. `findByEmail(email, withPassword = true)` consumers) must handle `null`.

## 7. Known Limitations

- **Single provider only.** This schema does not model multiple OAuth providers per user. When Apple or Microsoft sign-in is added, this ADR will need to be superseded (or extended) by ADR-FEAT-XXX with a migration to a join table.
- **No "linked at" telemetry.** We do not record when Google was linked or when it was last used. If we later want to surface "Google linked on 2026-05-22" in account settings, we will need to add that column.
- **No unlinking.** Spec §10 defers unlinking to backlog. The schema supports it (set `googleId = NULL`), but the API/UI does not exist.
- **Does not address email verification gap.** If the spec §12 dependency (email verification for password signups) is not shipped before FEAT-007 reaches production, FR-5 can bind a Google account to an unverified existing email-password row. That risk is product-side and surfaced in the spec, not this ADR.

## 8. Future Optimization Opportunities

- **Migrate to `oauth_identities` table** — when a second provider lands (Apple/Microsoft). At that point, write a migration that backfills existing `googleId` values into `oauth_identities` rows and drops the column. Trigger: the moment a second provider is committed.
- **Add `linked_at` / `last_login_at`** — when the team wants account-management UX showing per-provider history. Cheap (one column each), no urgency.
- **Add a partial unique index** on `LOWER(email)` to harden against case-mismatched emails coming from Google. Trigger: first support ticket about "I have two accounts".

## 9. Consequences

**For the codebase:**
- New TypeORM migration under `server/src/migrations/` adding `google_id VARCHAR(255) NULL UNIQUE` to the `user` table
- `server/src/modules/users/entities/user.entity.ts` — add `@Column({ length: 255, unique: true, nullable: true }) googleId: string | null;`
- `server/src/modules/users/users.service.ts` — add `findByGoogleId(googleId)`, `linkGoogleId(userId, googleId)`
- `password` column changes to `nullable: true` to permit Google-only signups (FR-4) — callers that read `password` (currently only `auth.service.login`) must already handle the lookup-failed case; explicit null-check needed on the Google-only path
- No changes required in `Auction`, `Room`, or any other module — they reference `user.id`, not `user.password`

**For the team:**
- No new technology to learn — straight TypeORM column.

**For operations:**
- One short migration to apply in staging and prod. No data backfill needed (column is nullable).

**For testing:**
- Unit test additions on `UsersService` for `findByGoogleId`, `linkGoogleId`
- Test that existing password-flow users (no `googleId`) continue to authenticate unchanged

## 10. References

- Feature Spec: `docs/features/FEAT-007-google-sign-in/01-feature-spec.md` — FR-2, FR-4, FR-5, NFR-3, §10, §12
- Related: ADR-FEAT-007-02 (OAuth integration) — same file, below
- Existing entity: `server/src/modules/users/entities/user.entity.ts`
- Existing service: `server/src/modules/users/users.service.ts`

---

# ADR-FEAT-007-02: OAuth Integration — Library, Flow, and Callback Location

**Feature:** FEAT-007-google-sign-in
**ADR ID:** ADR-FEAT-007-02
**Status:** Accepted
**Date:** 2026-05-22
**Decision makers:** sdlc-adr

---

## 1. Context

FEAT-007 requires authenticating CRM admins via Google and issuing the application's existing JWT access + refresh tokens (`server/src/modules/auth/token.service.ts`). The current auth stack is:

- **Server** — `@nestjs/jwt` directly + a custom `AuthGuard` + `bcrypt`. **No Passport, no `@nestjs/passport`.**
- **BFF** — Next.js route handlers under `client/app/api/auth/{login,register,logout}` proxy to Nest, store the resulting Nest tokens in Redis keyed by a `session_id`, and set an httpOnly `Lax` cookie. **No `next-auth`, no `iron-session`.**
- **Client** — `client/app/crm/auth/page.tsx` with a `FormBuilder` + Zod email/password form.

No OAuth dependency is installed in either workspace (`server/package.json`, `client/package.json`).

The architectural question is **how the browser obtains a verifiable assertion of the user's Google identity and how the backend consumes it** — specifically: (a) which OAuth flow to use, (b) where the callback / verification happens, (c) which library handles the cryptography.

The choice is load-bearing because OAuth implementations are the historical source of high-severity auth vulnerabilities (CSRF on callback, `state` mishandling, `client_secret` leakage, ID token validation bypass). Picking a flow with a smaller attack surface and fewer hand-rolled steps directly reduces the risk we ship a critical security bug.

## 2. Decision Drivers

In order of importance:

- **NFR-1 — OAuth client secret must never reach the browser.** Hard constraint.
- **NFR-2 — Reject when `email_verified: false`.** Hard constraint; library choice must expose the claim.
- **Minimize hand-rolled security-sensitive code.** Every line of OAuth code we write is a line we have to audit; OAuth callback handlers and `state` validators are a known source of CVEs.
- **Reuse the existing BFF Redis-session pattern.** The new flow should look like a peer of `/api/auth/login` — same session creation, same cookie, same `AuthResponseDto`.
- **No Google API access required after login.** We do not need Drive, Calendar, Gmail, or any other scope — just OpenID identity. This kills the main reason to keep a Google refresh token.
- **Consistency with the existing no-Passport style.** The codebase is intentionally light on auth frameworks; introducing Passport for a single strategy is overhead that breaks consistency.

## 3. Options Considered

### Option A: Client-side Google Identity Services (GIS) + `google-auth-library` on Nest, server-generated `nonce`

**Description:** The CRM auth page renders a custom "Continue with Google" button. On click, the browser calls Nest `GET /auth/google/nonce` (via BFF proxy) to obtain a fresh cryptographic nonce; Nest generates `randomBytes(32).toString('hex')`, stores it in Redis under `oauth:nonce:${nonce}` with a **60-second TTL**, and returns it. The page calls `google.accounts.id.initialize({ client_id, nonce, callback })` and then `google.accounts.id.prompt()` to open the consent popup. On user consent, GIS returns a signed ID token; the callback POSTs `{ credential, nonce }` to the BFF, which forwards the body to Nest `POST /auth/google`. Nest uses `google-auth-library`'s `OAuth2Client.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID })` to verify the signature (against Google's JWKS), `aud`, `iss`, and `exp`, then verifies `payload.nonce === nonce` and that `oauth:nonce:${nonce}` exists in Redis (single-use: deleted immediately on read), asserts `payload.email_verified === true`, and either finds or creates the user (per ADR-FEAT-007-01). Nest issues the standard `AuthResponseDto`; the BFF creates the session and sets the `session_id` cookie exactly as it does for password login.

**Pros:**
- **No `client_secret` involved in the flow** — eliminates an entire category of credential-leak risk
- Verification is a single library call (`verifyIdToken`) that atomically checks signature, `aud`, `iss`, `exp`
- No callback URL configured in Google Console — eliminates `redirect_uri` mismatch and open-redirect risk
- Nonce generated on click → 60s TTL is sufficient; no UX issue with expiry
- No pre-auth BFF session needed — nonce is its own Redis key, BFF is a transparent proxy
- GIS handles the consent UI natively — no redirect, no popup-blocker dance
- Native localhost support — works on `http://localhost:3001` in dev without HTTPS

**Cons:**
- ID token transits browser JS briefly; an XSS on the auth page could steal it. Mitigation: auth page must remain XSS-clean (standard requirement).
- No Google refresh token — we cannot silently re-authenticate against Google later. Not a problem since we issue our own refresh tokens.
- We depend on the GIS script being reachable from `accounts.google.com` — adblockers occasionally interfere.
- Implementing `nonce` correctly is on us — must be cryptographically random, single-use, short-TTL. Library does not enforce this.

**Estimated effort:** ~1.5 days (Nest endpoint + verify path + nonce route + BFF route + UI button + tests).

### Option B: Server-side Authorization Code + PKCE (raw or via `openid-client`)

**Description:** The CRM auth page renders a "Continue with Google" link that redirects the browser to `https://accounts.google.com/o/oauth2/v2/auth?...` with `response_type=code`, `client_id`, `redirect_uri`, `state` (bound to our session), and PKCE `code_challenge`. Google redirects back to a new BFF route `GET /api/auth/callback/google?code=...&state=...`. The BFF verifies `state`, exchanges `code` for tokens at Google's `/token` endpoint (this exchange requires `GOOGLE_CLIENT_SECRET` server-side), receives an ID token + access token, verifies the ID token, calls Nest to find/create the user, and creates the session.

**Pros:**
- Most familiar OAuth pattern; abundant documentation and Stack Overflow answers
- If we ever wanted Google API access (Drive, Calendar), this flow gives us a refresh token
- `code` is single-use and short-lived; PKCE protects against code interception even if Referer leaks the URL

**Cons:**
- **Requires `GOOGLE_CLIENT_SECRET`** in server env — one more secret to provision, rotate, and protect across dev/staging/prod
- Requires implementing `state` correctly (server-generated, session-bound, single-use) — historically the #1 source of OAuth CSRF bugs
- New callback route on the BFF — more HTTP surface, including `redirect_uri` allowlisting in Google Console
- Session-fixation hardening needed after callback (rotate `session_id`)
- Solves problems we do not have (Google API access) at the cost of attack surface we have to defend

**Estimated effort:** ~3 days (auth init route + callback route + token exchange + state mgmt + session rotation + UI + tests + Google Console redirect URI config across envs).

### Option C: `@nestjs/passport` + `passport-google-oauth20`

**Description:** Install `@nestjs/passport`, `passport`, and `passport-google-oauth20`. Implement a `GoogleStrategy` that wires up the Authorization Code flow under the hood. Add a Nest controller endpoint `GET /auth/google` that triggers redirect, and `GET /auth/google/callback` that Passport handles, returning a user object the controller then converts to our `AuthResponseDto`.

**Pros:**
- Conventional NestJS pattern; well-documented in NestJS recipes
- If we later add Facebook, Apple, Microsoft strategies, the API is uniform across them
- The strategy hides much of the OAuth wiring

**Cons:**
- **Introduces Passport as a first dependency** in a codebase that has explicitly avoided it. Breaks consistency.
- Still an Authorization Code flow under the hood — all of Option B's downsides (client secret, callback route, `state`) apply
- The "uniform strategy API" benefit does not exist with a single provider
- Adds three packages (`passport`, `@nestjs/passport`, `passport-google-oauth20`) plus their `@types/*`
- Passport's session-vs-token model is awkward when overlaid on our token-only stack; needs `session: false` and manual handling

**Estimated effort:** ~2.5 days (Passport wiring + strategy + controller + UI + tests + Google Console config). Less than B because Passport handles `state`, but more than A because the flow is fundamentally heavier.

## 4. Comparison

| Criterion | A — GIS + `google-auth-library` | B — Auth Code + PKCE | C — Passport + google-oauth20 |
|---|---|---|---|
| `client_secret` in flow | **No** | Yes | Yes |
| New HTTP routes on BFF | 2 (token + nonce) | 2 (init + callback) | 2 (init + callback) |
| CSRF defense mechanism | `nonce` (we write) | `state` (we write) | `state` (Passport writes) |
| Net new server code | ~30 LOC | ~150 LOC | ~100 LOC + framework |
| New deps (server) | `google-auth-library` | `openid-client` (or raw) | `passport` + `@nestjs/passport` + `passport-google-oauth20` |
| Consistency with current stack | Aligned | Aligned | **Breaks** (no-Passport convention) |
| Future Google API access | No (re-auth required) | Yes (refresh token) | Yes (refresh token) |
| Dev-env friction | Minimal (localhost works) | Moderate (callback URL per env) | Moderate (callback URL per env) |
| Attack-surface size | Smallest | Largest | Large |

## 5. Decision

**Chosen option:** A — Client-side Google Identity Services + `google-auth-library` on Nest + server-generated `nonce`.

**Rationale:** Three drivers decide it:

1. **NFR-1 ("client secret must never reach the browser") is satisfied trivially** — Option A does not have a client secret at all. Options B and C have one and we have to defend its lifecycle.
2. **Minimize hand-rolled security code.** Option A's CSRF defense is one Redis put/get + one equality check. Options B and C require `state` plumbing, callback verification, and session rotation — historically the source of OAuth CVEs.
3. **We do not need Google API access.** The only real advantage of Auth Code (the Google refresh token) is moot for our use case.

The deprioritized driver is "Passport familiarity" — Option C's claim that the codebase becomes more standard. The codebase has deliberately chosen no-Passport; introducing it for a single strategy is a net loss in consistency.

## 6. Tradeoffs

**Gained:**
- No `GOOGLE_CLIENT_SECRET` to provision, rotate, audit, or leak
- Smallest attack surface of the three options
- Smallest implementation (~50 LOC total across server + BFF)
- Stays consistent with the existing no-Passport, no-`next-auth` style
- No `redirect_uri` allowlist to maintain in Google Console as we add envs

**Sacrificed:**
- Cannot call Google APIs on behalf of the user later — would require re-prompting the user with broader scopes (acceptable: spec NFR-3 forbids requesting other scopes anyway)
- ID token transits browser JS briefly — XSS on the auth page becomes a higher-impact vulnerability
- Depends on `accounts.google.com/gsi/client` being reachable (adblockers, restrictive corporate networks may break it)
- We own correctness of the `nonce` — bug here means CSRF defense gone

## 7. Known Limitations

- **No Google API access.** Out of scope per spec NFR-3, but explicitly forecloses Drive/Calendar/Gmail integrations without re-auth.
- **No One-Tap by default.** This ADR records the explicit-button flow. One-Tap is a UX choice that can be layered on top later without changing the trust model.
- **No "remember which provider" UI hint.** A user who linked Google sees both the email-password form and the Google button on every visit. Account-settings UX showing "linked to Google" is out of scope here.
- **GIS dependency on Google CDN.** If `accounts.google.com/gsi/client` is unreachable, the button does not render. Email-password remains as a fallback (FR-7), so this degrades gracefully.
- **Revocation on Google's side is not detected.** If a user revokes our app's grant in their Google account settings, we receive no notification and take no action. The user's current CRM session continues until normal JWT expiry; on next sign-in, Google re-prompts consent and login resumes. The `user.googleId` link is not cleared automatically. Explicit unlinking is a separate backlog feature (spec §10). Resolves spec §11.2.

## 8. Future Optimization Opportunities

- **Add Google One-Tap UI.** When CRM admin sign-up volume justifies it, add `prompt_parent_id` for one-tap rendering on the dashboard for visitors who are signed into Google. Trigger: ≥30% of sign-ups via Google.
- **Add FedCM support.** Google is migrating One-Tap to the FedCM browser API. GIS already supports the migration path; we adopt it when Chrome stable defaults to FedCM (already true as of 2026).
- **Surface "linked to Google" in account settings.** When account-management UX is built. Cheap (uses ADR-01's `googleId` column).
- **Migrate to Auth Code + PKCE.** If a future feature requires Google API access (Drive uploads for lot images, Calendar for auction scheduling). Trigger: a spec requires a non-OpenID Google scope.

## 9. Consequences

**For the codebase:**

- New server dependency: `google-auth-library` (Google's official Node client)
- New Nest endpoint: `GET /auth/google/nonce` — generates `randomBytes(32).toString('hex')`, stores at `oauth:nonce:${nonce}` with **60s TTL** in Redis, returns `{ nonce }`
- New Nest endpoint: `POST /auth/google` — accepts `{ credential: string; nonce: string }`, returns the existing `AuthResponseDto`
- New Nest service: `server/src/modules/auth/google-auth.service.ts` — `mintNonce()` + `signIn()`: wraps `OAuth2Client.verifyIdToken`, checks nonce existence in Redis (single-use delete-first), asserts `email_verified`, performs find-or-create-or-link
- `server/src/modules/auth/auth.module.ts` — register `GoogleAuthService`
- New BFF route: `client/app/api/auth/google/nonce/route.ts` — **transparent proxy** to Nest `GET /auth/google/nonce`; no Redis, no session logic
- New BFF route: `client/app/api/auth/google/route.ts` — proxies `{ credential, nonce }` to Nest, creates session + sets cookie on success; mirrors `client/app/api/auth/login/route.ts`
- `client/app/crm/auth/GoogleSignInButton.tsx` — custom button (not `renderButton`); on click: fetch nonce → `initialize({ client_id, nonce })` → `prompt()`; callback: POST `{ credential, nonce }` to `/api/auth/google`

**For the team:**

- One new dependency to learn (`google-auth-library`'s `OAuth2Client.verifyIdToken`). Surface area is one method.
- No new framework, no new auth paradigm.

**For operations:**

- Provision `GOOGLE_CLIENT_ID` per environment (dev, prod) in env config. **No `GOOGLE_CLIENT_SECRET`** needed for this flow.
- Create two OAuth 2.0 Client IDs in Google Cloud Console (recommended: separate dev and prod clients):
  - Dev — Authorized JavaScript origin `http://localhost:3001`
  - Prod — Authorized JavaScript origin `https://<prod-domain>`
- No Authorized Redirect URIs required.
- Redis adds an `oauth:nonce:*` key namespace with short-TTL keys; negligible memory impact.

**For testing:**

- Unit tests on the Google auth service mock `OAuth2Client.verifyIdToken` (do not call Google in CI)
- Integration tests cover the four paths: new user (FR-4), link to existing email-password user (FR-5), returning Google user (FR-6), `email_verified: false` rejected (FR-3 / NFR-2)
- Playwright e2e: stub the BFF's `POST /api/auth/google` and `GET /api/auth/google/nonce` endpoints; do not drive the real Google consent UI (Google blocks browser automation)
- Manual smoke test in dev with a real Google account is the only end-to-end coverage of the GIS script itself

## 10. References

- Feature Spec: `docs/features/FEAT-007-google-sign-in/01-feature-spec.md` — FR-1..FR-7, NFR-1..NFR-3, AC-1..AC-4
- Related: ADR-FEAT-007-01 (user identity schema) — same file, above
- Existing service: `server/src/modules/auth/auth.service.ts`, `server/src/modules/auth/token.service.ts`
- Existing BFF auth route: `client/app/api/auth/login/route.ts`
- Existing session mechanism: `client/src/services/session/index.ts`
- External — Google Identity Services docs: https://developers.google.com/identity/gsi/web/guides/overview
- External — `google-auth-library` ID token verification: https://github.com/googleapis/google-auth-library-nodejs#oauth2
- External — GIS nonce guidance: https://developers.google.com/identity/gsi/web/reference/js-reference#nonce
