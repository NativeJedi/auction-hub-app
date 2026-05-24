# Task T-003: BFF Google auth routes (nonce + forward)

**Task ID:** T-003
**Feature:** FEAT-007-google-sign-in
**Status:** Todo
**Priority:** Must-have
**Depends on:** T-002

---

## 1. Context

This task delivers the Next.js BFF surface for FEAT-007: two route handlers under `client/app/api/auth/google/` that bracket the Google flow. One mints and stores a nonce in Redis under `oauth:nonce:${sessionId}` (300 s TTL) before the GIS button initializes; the other receives the `{ credential, nonce }` from the browser, forwards them to the Nest `POST /auth/google` endpoint, and creates a session + cookie exactly like the existing password login route. The two routes are merged into one task per user direction.

Related requirements: FR-1 (enabling), FR-6, NFR-1, NFR-2

## 2. Description

Create two Next.js route handlers: `GET /api/auth/google/nonce` (mint a cryptographically random nonce, persist it in Redis with the session-scoped key, return it as JSON), and `POST /api/auth/google` (forward the body + the BFF's session id to the Nest endpoint, store the returned access/refresh tokens via the existing `SessionStorage` pattern, set the httpOnly session cookie). The forward route must mirror the existing `client/app/api/auth/login/route.ts` shape so the rest of the app is unchanged.

## 3. Files to Touch

**Create:**
- `client/app/api/auth/google/nonce/route.ts` — `GET` handler. Mints `nonce = crypto.randomBytes(32).toString('hex')`, ensures a BFF session exists (mint one if not), stores at `oauth:nonce:${sessionId}` in Redis with 300 s TTL, returns `{ nonce }`. Sets the session cookie if newly minted.
- `client/app/api/auth/google/route.ts` — `POST` handler. Reads `{ credential, nonce }` from body + `sessionId` from the cookie, calls Nest `POST /auth/google`, on success stores tokens in `SessionStorage`, returns the same response shape the existing login route returns.
- `client/app/api/auth/google/route.test.ts` — scaffold for the forward route (Vitest, `it.todo()` placeholders).
- `client/app/api/auth/google/nonce/route.test.ts` — scaffold for the nonce route (Vitest, `it.todo()` placeholders).

**Modify:**
- `client/src/services/session/index.ts` — only if a nonce-specific helper is needed (e.g. `setNonce(sessionId, nonce, ttlSeconds)` / `getNonce`). Prefer adding small helpers here over hand-rolling Redis access inline in the route, to keep all Redis touchpoints in one file.
- `.env.example` (or `client/.env.example`) — add `GOOGLE_CLIENT_ID` (public — fed to GIS in T-004), keep the same value as the server's `GOOGLE_CLIENT_ID` so audience matches.

**Read for context (no changes expected):**
- `client/app/api/auth/login/route.ts` — canonical pattern for forward + session creation + cookie set.
- `client/app/api/auth/register/route.ts` — secondary reference for error shape.
- `client/src/services/session/index.ts` — current session creation API.
- `server/src/modules/auth/dto/google-auth.dto.ts` — confirm body shape forwarded matches Nest's DTO (T-002).

## 4. Implementation Plan

1. Confirm `SessionStorage` exposes (or can cheaply expose) a way to mint a pre-auth session — i.e. a sessionId + cookie without any tokens yet. The ADR §7 explicitly flags this assumption ("`nonce` storage requires a pre-auth Redis session"). If the existing API only mints sessions on auth success, add a `createPreAuthSession()` (or equivalent) helper here.
2. Implement `GET /api/auth/google/nonce`:
   - Read the existing session cookie. If absent, call `createPreAuthSession()` and prepare a `Set-Cookie` header on the response.
   - Generate the nonce (`crypto.randomBytes(32).toString('hex')`).
   - Store via `SessionStorage` (or a thin Redis helper) at `oauth:nonce:${sessionId}` with TTL 300 s.
   - Return `Response.json({ nonce })` with the (optional) `Set-Cookie` header.
3. Implement `POST /api/auth/google`:
   - Read `{ credential, nonce }` from body. Return 400 on missing fields.
   - Read `sessionId` from the session cookie. Return 401 if missing (cannot validate nonce without it).
   - Call Nest `POST /auth/google` with `{ credential, nonce, sessionId }`. Use the same server-side fetch wrapper the login route uses.
   - On success: extract tokens from the Nest `AuthResponseDto`, persist via `SessionStorage` against the same `sessionId`, ensure the session cookie is set/refreshed, return the same response shape `POST /api/auth/login` returns (so the UI in T-004 has a uniform success contract).
   - On failure: forward the Nest status + error body (do not rewrite the error message — the UI surfaces it).
4. Scaffold both `*.test.ts` files next to the routes with `it.todo()` placeholders.

## 5. Definition of Done

- [ ] All code compiles with `cd client && npm run build` and lints cleanly (`npm run lint`).
- [ ] Test scaffolds exist with `it.todo()` placeholders for both routes.
- [ ] `GET /api/auth/google/nonce` returns `{ nonce }` (32 bytes hex) and stores it at `oauth:nonce:${sessionId}` with TTL 300 s. A second call within the TTL overwrites the previous value (no orphaned old nonces).
- [ ] On first call from a clean browser (no cookie), the response sets a session cookie with the same attributes as the login route (httpOnly, Lax, secure in non-NODE_ENV=development).
- [ ] `POST /api/auth/google` forwards `{ credential, nonce, sessionId }` to Nest, persists returned tokens against the same `sessionId`, returns the same success shape as `POST /api/auth/login`.
- [ ] On Nest 401 (bad credential, bad nonce, `email_verified: false`), the BFF returns the same status code and error body verbatim.
- [ ] No regressions on existing `client/app/api/auth/{login,register,logout}` routes.
- [ ] No new env var beyond `GOOGLE_CLIENT_ID` (public, shared with server). No `GOOGLE_CLIENT_SECRET` introduced.

## 6. Test Plan

**Unit tests (Vitest):**
- Nonce route — generates a 64-char hex string, calls `SessionStorage.setNonce` with TTL 300, sets the session cookie when one is missing.
- Forward route — happy path: forwards body, reads cookie, persists tokens, returns 200 with `AuthResponseDto` shape.
- Forward route — error paths: missing body fields → 400; missing cookie → 401; Nest 401 → forwarded as 401 with the same error body.

**Component tests (RTL):**
- None — pure BFF.

**E2E tests (Playwright):**
- Deferred to T-004 (full flow with stubbed Google).

**Test data needs:**
- Mock Nest fetch wrapper (MSW or vi.mock at the module boundary).
- Mock `SessionStorage` for unit tests; real Redis if integration-style testing is preferred (match whatever the existing login route tests use).

## 7. Notes & Considerations

- **Compactness exception:** parallelization gate failed; created on user request.
- ADR alignment: matches ADR-FEAT-007-02 §9 Consequences ("New BFF route: `client/app/api/auth/google/route.ts`" and the nonce route description).
- Nonce key format `oauth:nonce:${sessionId}` is a **contract with T-002** — the Nest service reads exactly this key. Do not change without coordinating.
- TTL 300 s is ADR-mandated. Do not lower (UX impact on slow Google consent) or raise (longer CSRF window).
- The pre-auth session is just a session id with no tokens — guards across the app must continue to reject it for any authenticated endpoint. This is already the case if guards check for the token's presence, not just the session cookie; verify in the implementation pass.
- The cookie attributes (httpOnly, sameSite, secure, path) must match the existing login route exactly to avoid two-cookie scenarios.
- Both routes are unauthenticated. Do not wrap them in any auth middleware/guard.

## 8. References

- Feature Spec: `01-feature-spec.md` — FR-1 (enables), FR-6, NFR-1
- ADR: `03-adr.md` — ADR-FEAT-007-02 §5 (Decision), §7 Known Limitations (pre-auth session), §9 Consequences "For the codebase"
- Related tasks: T-002 (Nest endpoint this forwards to; same Redis key contract), T-004 (UI that consumes both routes)
