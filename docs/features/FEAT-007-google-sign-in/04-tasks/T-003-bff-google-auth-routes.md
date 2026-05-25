# Task T-003: BFF Google auth routes (nonce proxy + forward)

**Task ID:** T-003
**Feature:** FEAT-007-google-sign-in
**Status:** Todo
**Priority:** Must-have
**Depends on:** T-002

---

## 1. Context

This task delivers the Next.js BFF surface for FEAT-007: two route handlers under `client/app/api/auth/google/`. The BFF is a **transparent proxy** — it holds no nonce logic, no Redis, no pre-auth session. Nonce generation and validation live entirely on the Nest side (T-002). The BFF simply relays requests and, on the POST success path, creates an authenticated session with the returned tokens (same as the existing login route).

Related requirements: FR-1 (enabling), FR-6, NFR-1, NFR-2

## 2. Description

Create two Next.js route handlers:

- `GET /api/auth/google/nonce` — transparent proxy to Nest `GET /auth/google/nonce`. Returns `{ nonce }` as-is. No Redis, no cookie, no session.
- `POST /api/auth/google` — proxy `{ credential, nonce }` to Nest `POST /auth/google`. On success, persists the returned tokens via the existing `SessionStorage` pattern and sets the session cookie, exactly like `client/app/api/auth/login/route.ts`.

The browser holds the nonce in a JS closure between the two calls — no server-side nonce storage on the BFF side.

## 3. Files to Touch

**Create:**
- `client/app/api/auth/google/nonce/route.ts` — `GET` handler. Calls Nest `GET /auth/google/nonce` and returns the response body (`{ nonce }`) unchanged. No cookies, no session manipulation.
- `client/app/api/auth/google/route.ts` — `POST` handler. Reads `{ credential, nonce }` from the request body, forwards them to Nest `POST /auth/google`. On success: stores tokens via `SessionStorage.create(...)`, sets the httpOnly session cookie, returns the same response shape as `POST /api/auth/login`. On Nest error: forwards the status code and body verbatim.
- `client/app/api/auth/google/route.test.ts` — scaffold (Vitest, `it.todo()` placeholders).
- `client/app/api/auth/google/nonce/route.test.ts` — scaffold (Vitest, `it.todo()` placeholders).

**Modify:**
- `client/.env.example` (or root `.env.example`) — add `NEXT_PUBLIC_GOOGLE_CLIENT_ID=` under a `# Google OAuth` heading (public twin of the server's `GOOGLE_CLIENT_ID`).

**Read for context (no changes expected):**
- `client/app/api/auth/login/route.ts` — canonical pattern for forward + session creation + cookie set.
- `client/app/api/auth/register/route.ts` — secondary reference for error shape.
- `client/src/services/session/index.ts` — current `SessionStorage.create()` API.
- `server/src/modules/auth/dto/google-auth.dto.ts` — confirms body shape: `{ credential, nonce }` (no `sessionId`).

## 4. Implementation Plan

1. Implement `GET /api/auth/google/nonce`:
   - Call the Nest endpoint using the same server-side fetch wrapper the login route uses.
   - Return `Response.json({ nonce })` with the value from Nest. No cookies, no session.
2. Implement `POST /api/auth/google`:
   - Parse `{ credential, nonce }` from the request body. Return 400 on missing fields.
   - Forward to Nest `POST /auth/google` with `{ credential, nonce }`.
   - On success: extract `{ accessToken, refreshToken, user }` from the Nest response, call `SessionStorage.create({ accessToken, refreshToken })`, set the session cookie (same attributes as the login route — httpOnly, Lax, Secure in non-dev). Return the same response shape `POST /api/auth/login` returns.
   - On Nest error (4xx / 5xx): forward the status code and body as-is.
3. Scaffold both `*.test.ts` files with `it.todo()` placeholders.

## 5. Definition of Done

- [ ] All code compiles with `cd client && npm run build` and lints cleanly (`npm run lint`).
- [ ] Test scaffolds exist with `it.todo()` placeholders for both routes.
- [ ] `GET /api/auth/google/nonce` proxies to Nest and returns `{ nonce }` (64-char hex). No cookies set, no session created.
- [ ] `POST /api/auth/google` forwards `{ credential, nonce }` to Nest (no `sessionId` in the body). On success, persists tokens and sets the session cookie with the same attributes as the login route.
- [ ] On Nest 401 (bad credential, bad nonce, `email_verified: false`), the BFF returns the same status code and error body verbatim.
- [ ] No regressions on existing `client/app/api/auth/{login,register,logout}` routes.
- [ ] No new env var beyond `NEXT_PUBLIC_GOOGLE_CLIENT_ID`. No `GOOGLE_CLIENT_SECRET` introduced anywhere.

## 6. Test Plan

**Unit tests (Vitest):**
- Nonce route — proxies the Nest response, returns `{ nonce }`, sets no cookies.
- Forward route — happy path: forwards `{ credential, nonce }`, persists tokens, returns 200 with `AuthResponseDto` shape.
- Forward route — error paths: missing body fields → 400; Nest 401 → forwarded as 401 with the same error body.

**Component tests (RTL):**
- None — pure BFF.

**E2E tests (Playwright):**
- Deferred to T-004 (full flow with stubbed Google).

**Test data needs:**
- Mock the Nest fetch wrapper (MSW or vi.mock at the module boundary).
- Mock `SessionStorage` for unit tests.

## 7. Notes & Considerations

- **No nonce logic on the BFF.** All nonce generation and validation is on Nest (T-002). The BFF never touches Redis.
- **No sessionId.** The Nest DTO is `{ credential, nonce }` — do not add `sessionId` to the forwarded body.
- **No pre-auth session.** The nonce route returns a plain JSON response with no cookie — the browser holds the nonce in a JS closure in T-004.
- Cookie attributes (httpOnly, sameSite, secure, path) on the POST success path must match the login route exactly to avoid two-cookie scenarios.
- Both routes are unauthenticated. Do not wrap them in any auth middleware/guard.

## 8. References

- Feature Spec: `01-feature-spec.md` — FR-1 (enables), FR-6, NFR-1
- ADR: `03-adr.md` — ADR-FEAT-007-02 §5 (Decision), §9 Consequences "For the codebase"
- Related tasks: T-002 (Nest endpoints this proxies to), T-004 (UI that consumes both routes)
