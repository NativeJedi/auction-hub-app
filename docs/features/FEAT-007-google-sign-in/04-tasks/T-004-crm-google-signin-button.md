# Task T-004: CRM Google sign-in button (UI)

**Task ID:** T-004
**Feature:** FEAT-007-google-sign-in
**Status:** Todo
**Priority:** Must-have
**Depends on:** T-003

---

## 1. Context

This task delivers the user-facing surface for FEAT-007: a "Continue with Google" button on the CRM auth page, placed alongside the existing email-password form. It loads Google Identity Services (GIS) once, and on each click fetches a fresh nonce from `GET /api/auth/google/nonce`, initializes GIS with that nonce, and calls `google.accounts.id.prompt()`. On consent, the callback POSTs `{ credential, nonce }` to `POST /api/auth/google`. On success the user lands on the CRM dashboard (same destination as the password flow). The button appears in **both** the login and the register views so US-1 (Google sign-up) and US-3 (Google sign-in) share a single entry point. The backend (T-002) auto-branches between create / link / returning.

Related requirements: US-1, FR-1, FR-3 (error display), FR-4, FR-6, FR-7

## 2. Description

Create a `GoogleSignInButton` client component. On **mount**, fetch a fresh nonce from `GET /api/auth/google/nonce`, call `google.accounts.id.initialize({ client_id, nonce, callback, use_fedcm_for_prompt: true })`, render Google's native button via `google.accounts.id.renderButton(container, options)`, and call `google.accounts.id.prompt()` so One-Tap appears for users with an active Google session. The bulk of this logic lives in a pure `GoogleAuthService` class (no React); a thin `useGoogleSignIn` hook adapts it to the React tree. The GIS script itself is loaded lazily and cached. The `callback` POSTs `{ credential, nonce }` to `POST /api/auth/google` and navigates to the dashboard on success. If the BFF returns `reason: NONCE_NOT_FOUND` (TTL elapsed or nonce already consumed), the service fetches a new nonce, re-initializes GIS, re-renders the button, and re-invokes `prompt()` — capped at one retry per component lifetime to prevent loops.

The existing email-password form must remain unchanged in behavior and visual position.

## 3. Files to Touch

**Create:**
- `client/app/crm/auth/GoogleSignInButton.tsx` — client component (`"use client"`). Loads the GIS script on mount. On click: fetches nonce, calls `initialize({ client_id, nonce, callback })`, calls `prompt()`. The `callback` POSTs to `/api/auth/google` and on success calls `router.push('/crm')` (or whichever dashboard route the password flow lands on — match it exactly).
- `client/app/crm/auth/GoogleSignInButton.test.tsx` — scaffold (Vitest + RTL) with `it.todo()` placeholders.
- `client/src/lib/gis-loader.ts` (or similar small helper) — loads `https://accounts.google.com/gsi/client` once per page, returns a Promise that resolves when `window.google.accounts.id` is available. Only create this if no equivalent already exists; otherwise reuse.

**Modify:**
- `client/app/crm/auth/page.tsx` — embed `<GoogleSignInButton />` in **both** the `LoginForm` and `RegisterForm` views. Place it above (or below — match existing visual convention) each form. Do not change the existing forms themselves.

**Read for context (no changes expected):**
- `client/app/crm/auth/page.tsx` — current layout and post-login navigation target.
- `client/app/crm/auth/FormChangeViewButton.tsx` — sibling pattern for an inline auth control.
- `client/src/components/LogoutButton.test.tsx` — RTL test convention.
- `client/app/api/auth/google/route.ts`, `client/app/api/auth/google/nonce/route.ts` — confirm response shapes consumed by the button.

## 4. Implementation Plan

1. Add a narrow typed wrapper for `window.google.accounts.id` (small `interface` co-located with the button — do not pull in `@types/google.accounts` unless trivial). Surface only: `initialize`, `prompt`.
2. Read `NEXT_PUBLIC_GOOGLE_CLIENT_ID` from the client env. Fail loud (render an error chip in dev) if missing; in prod, hide the button to degrade gracefully (FR-7 — email-password still works).
3. On component **mount**: call `loadGisScript()` (idempotent — safe to call from both `LoginForm` and `RegisterForm` instances). Do not fetch a nonce on mount.
4. Render a custom styled button (Tailwind + shadcn primitives — no `google.accounts.id.renderButton()`). The button is disabled while GIS is loading.
5. On button **click**:
   a. `fetch('/api/auth/google/nonce')` → `{ nonce }`. On fetch failure, show inline error and return.
   b. `google.accounts.id.initialize({ client_id: NEXT_PUBLIC_GOOGLE_CLIENT_ID, nonce, callback: onCredential })`.
   c. `google.accounts.id.prompt()`.
   d. Store `nonce` in a local `ref` or closure for use in the callback.
6. `onCredential(response)`:
   - `POST /api/auth/google` with `{ credential: response.credential, nonce }`.
   - On 2xx → `router.push('<dashboard route>')` (match the password flow's target exactly).
   - On 4xx → render the BFF's error message inline above the button. `email_verified: false` (401) must produce a visible message (AC-3).
   - On 5xx → render a generic "Sign-in failed, please try again" message.
7. On GIS script load failure or if `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is absent, hide the button silently in prod and log to console. The email-password form continues to work.
8. Scaffold `GoogleSignInButton.test.tsx` with `it.todo()` placeholders for: button renders after GIS loads; click fetches nonce and calls `initialize` + `prompt`; callback POSTs `{ credential, nonce }` to `/api/auth/google`; success navigates to dashboard; 401 shows inline error; missing `NEXT_PUBLIC_GOOGLE_CLIENT_ID` hides the button.

## 5. Definition of Done

- [ ] All code compiles with `cd client && npm run build` and lints cleanly (`npm run lint`).
- [ ] Test scaffold exists with `it.todo()` placeholders.
- [ ] Visual: "Continue with Google" button appears on `/crm/auth` next to the existing email-password form (FR-1).
- [ ] Visual: "Continue with Google" button appears on **both** the login and the register views of `/crm/auth`.
- [ ] Manual smoke (dev, real Google account): on page load the native Google button renders inside the container; if the visitor is signed into Google, the One-Tap card also appears. Clicking the button (or selecting an account in One-Tap) lands on the same CRM dashboard route as a password login (FR-6 / AC-1).
- [ ] Manual smoke: when the Redis nonce TTL is temporarily reduced and allowed to expire before clicking, the BFF returns `NONCE_NOT_FOUND`, the client shows a "session expired" info toast, the button re-renders, and a second click completes the sign-in. A second consecutive `NONCE_NOT_FOUND` shows a generic error toast (no infinite retry).
- [ ] Manual smoke: a new user who switches to the Register view and clicks "Continue with Google" lands on the dashboard with a freshly-created account (FR-4 / US-1 / AC-1).
- [ ] Manual smoke: an existing email-password user signing in with Google for the first time lands on the dashboard and on a subsequent visit can still sign in with their original password (AC-2 — depends on T-002 link path being correct).
- [ ] Manual smoke: when the Google account's email is unverified, the inline error message is shown and the user is not signed in (AC-3 / FR-3).
- [ ] Email-password form continues to work unchanged — same fields, same validation, same destination (FR-7 / AC-4).
- [ ] If `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is missing or the GIS script is unreachable, the page still renders the email-password form (graceful degradation per ADR §7).
- [ ] No regressions across the rest of the CRM auth surface.

## 6. Test Plan

**Unit tests (Vitest):**
- `loadGisScript` helper — idempotent (multiple calls resolve without duplicating the script tag).

**Component tests (RTL):**
- `GoogleSignInButton` — mock the GIS script + the nonce fetch + the auth POST fetch. Assert: nonce is fetched **on click** (not on mount); `initialize` is called with the fetched nonce; `prompt` is called after `initialize`; the `callback` POSTs `{ credential, nonce }` to `/api/auth/google`; success calls `router.push` with the dashboard route; 401 from the BFF renders the error message; missing `NEXT_PUBLIC_GOOGLE_CLIENT_ID` hides the button.
- `page.tsx` — renders `<GoogleSignInButton />` inside both the login and register views; toggling the view does not break GIS loading.

**E2E tests (Playwright):**
- **Confirm with the user before scaffolding** (per the `sdlc-tests` skill's e2e rule). Suggested critical flow: stub `/api/auth/google/nonce` and `/api/auth/google` (do **not** drive the real Google consent UI — Google blocks automation per ADR §9). Drive only the BFF side: click button → assert nonce was fetched → assert BFF was called with the right shape → simulated 200 → assert navigation to the dashboard. AC-3 path: simulated 401 → assert error visible.

**Test data needs:**
- Mock of `window.google.accounts.id.initialize` / `.prompt`.
- MSW handlers for `/api/auth/google/nonce` and `/api/auth/google`.
- Stub for `next/navigation`'s `useRouter`.

## 7. Notes & Considerations

- **Nonce fetched on mount, with transparent re-init on expiry.** Minting on mount enables One-Tap to render automatically without a click; the 300 s Redis TTL covers a typical auth-page session. If the nonce still expires (or was already consumed), the BFF returns `reason: NONCE_NOT_FOUND` and the service re-fetches once. Cap retries at 1 per component lifetime — a second `NONCE_NOT_FOUND` surfaces as a fatal toast.
- **Native `renderButton`, not a custom button.** Calling `gis.renderButton(container, options)` is what enables Google's own popup-flow + One-Tap behavior. Style via the `theme` / `size` / `text` / `shape` options Google exposes (Tailwind cannot reach inside the iframe). The button is keyboard-accessible by Google's own implementation.
- **`initialize` called on mount, and again on the single retry path.** GIS allows re-initialization; on `NONCE_NOT_FOUND` the service fetches a new nonce, calls `initialize` + `renderButton` + `prompt` again.
- **Sign-in and sign-up share one button.** The backend (T-002) decides create-vs-link-vs-returning based on the verified Google identity — the UI does not switch behavior based on which view the user came from.
- **Architecture split**: `googleAuthService.ts` (pure class) owns the GIS lifecycle, nonce refresh, and retry policy; `useGoogleSignIn.ts` is a thin React adapter that wires the service's callbacks to `useRouter` and the notifications module; `GoogleSignInButton.tsx` is a DOM container plus skeleton/error fallback. Tests are split accordingly: the bulk of acceptance criteria live in `googleAuthService.test.ts` (no React), the hook test asserts only React-state and adapter wiring, the component test covers render variants.
- ADR alignment: matches ADR-FEAT-007-02 §6 Tradeoffs (TTL=300s, `NONCE_NOT_FOUND` recovery) and §9 Consequences ("native button via `renderButton()` on mount + One-Tap via `prompt()`").
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is intentionally public. Do not import or read `GOOGLE_CLIENT_SECRET` anywhere in the client workspace.
- Do not request any scope beyond the default OpenID identity (NFR-3). Do not pass `prompt_parent_id` or extra scopes to `initialize`.
- Do not track the OAuth credential in any analytics event — it is a sensitive payload.

## 8. References

- Feature Spec: `01-feature-spec.md` — US-1, FR-1, FR-3, FR-4, FR-6, FR-7, NFR-3, AC-1, AC-2, AC-3, AC-4
- ADR: `03-adr.md` — ADR-FEAT-007-02 §5 (Decision), §7 Known Limitations (GIS CDN dependency), §9 Consequences "For the codebase"
- Related tasks: T-003 (BFF routes consumed here), T-002 (Nest endpoint behind the BFF)
