# Task T-004: CRM Google sign-in button (UI)

**Task ID:** T-004
**Feature:** FEAT-007-google-sign-in
**Status:** Todo
**Priority:** Must-have
**Depends on:** T-003

---

## 1. Context

This task delivers the user-facing surface for FEAT-007: a "Continue with Google" button on the CRM auth page, placed alongside the existing email-password form. It loads Google Identity Services, fetches a nonce from `GET /api/auth/google/nonce`, renders the Google button with that nonce bound, and on consent POSTs the resulting `{ credential, nonce }` to `POST /api/auth/google`. On success the user lands on the CRM dashboard (the same destination as the password flow). On `email_verified: false`, the error from the BFF is displayed inline.

Related requirements: FR-1, FR-3 (error display), FR-6, FR-7

## 2. Description

Modify `client/app/crm/auth/page.tsx` (or extract a `GoogleSignInButton` sibling component) to load the GIS script, initialize `google.accounts.id` with our `GOOGLE_CLIENT_ID` and the fetched nonce, render the official Google button next to the existing form, and wire the consent callback to the BFF route. The existing email-password form must remain unchanged in behavior and visual position.

## 3. Files to Touch

**Create:**
- `client/app/crm/auth/GoogleSignInButton.tsx` — client component (`"use client"`). On mount: fetch nonce, inject the GIS script (idempotent), call `google.accounts.id.initialize({ client_id, nonce, callback })`, render the button. The `callback` POSTs to `/api/auth/google` and on success calls `router.push('/crm')` (or whichever dashboard route the password flow lands on — match it).
- `client/app/crm/auth/GoogleSignInButton.test.tsx` — scaffold (Vitest + RTL) with `it.todo()` placeholders.
- `client/src/lib/gis-loader.ts` (or similar small helper) — loads `https://accounts.google.com/gsi/client` once per page, returns a Promise that resolves when `window.google.accounts.id` is available. Only create this if no equivalent already exists; otherwise reuse.

**Modify:**
- `client/app/crm/auth/page.tsx` — embed `<GoogleSignInButton />` above (or below — pick whichever matches existing visual convention) the existing `LoginForm`. Do not change the existing form.

**Read for context (no changes expected):**
- `client/app/crm/auth/page.tsx` — current layout and post-login navigation target.
- `client/app/crm/auth/FormChangeViewButton.tsx` — sibling pattern for an inline auth control.
- `client/src/components/LogoutButton.test.tsx` — RTL test convention.
- `client/app/api/auth/google/route.ts`, `client/app/api/auth/google/nonce/route.ts` — confirm the response shapes the UI consumes.

## 4. Implementation Plan

1. Add a typed wrapper around `window.google.accounts.id` (small `interface` co-located with the button — do not pull in `@types/google.accounts` unless trivial). Keep the surface narrow: `initialize`, `renderButton`.
2. Read `NEXT_PUBLIC_GOOGLE_CLIENT_ID` from the client env (the public twin of the server's `GOOGLE_CLIENT_ID`). Fail loud (render an error chip in dev) if missing; in prod, hide the button to degrade gracefully (FR-7 — email-password still works).
3. On component mount: `await loadGisScript()`. Then `fetch('/api/auth/google/nonce')` — on failure, hide the button and log to console (do not block the email-password form).
4. Call `google.accounts.id.initialize({ client_id, nonce, callback: onCredential })`. Call `google.accounts.id.renderButton(buttonRef.current, { theme: 'outline', size: 'large', text: 'continue_with' })` (or whichever variant matches our brand — check the prototype if one exists; otherwise use sensible defaults).
5. `onCredential(response)`:
   - `POST /api/auth/google` with `{ credential: response.credential, nonce }`. (`sessionId` comes from cookies automatically.)
   - On 2xx → `router.push('<dashboard route>')` (match the password flow's `router.push` target exactly).
   - On 4xx → render the BFF's error message inline above the Google button. Specifically, the `email_verified: false` 401 must produce a visible message (AC-3).
   - On 5xx → render a generic "Sign-in failed, please try again" message.
6. Ensure the GIS script is loaded only once per page (idempotent loader). On unmount, do not detach (the script is cheap to leave in place).
7. Scaffold `GoogleSignInButton.test.tsx` with `it.todo()` placeholders for: button renders after nonce fetch, callback POSTs to `/api/auth/google` with the credential and nonce, success navigates to dashboard, 401 shows error.

## 5. Definition of Done

- [ ] All code compiles with `cd client && npm run build` and lints cleanly (`npm run lint`).
- [ ] Test scaffold exists with `it.todo()` placeholders.
- [ ] Visual: "Continue with Google" button appears on `/crm/auth` next to the existing email-password form (FR-1).
- [ ] Manual smoke (dev, real Google account): button renders, clicking it triggers Google consent, on consent the user lands on the same CRM dashboard route as a password login (FR-6 / AC-1).
- [ ] Manual smoke: an existing email-password user signing in with Google for the first time lands on the dashboard and on a subsequent visit can still sign in with their original password (AC-2 — depends on T-002 link path being correct).
- [ ] Manual smoke: when the Google account's email is unverified, the inline error message is shown and the user is not signed in (AC-3 / FR-3).
- [ ] Email-password form continues to work unchanged — same fields, same validation, same destination (FR-7 / AC-4).
- [ ] If `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is missing or the GIS script is unreachable, the page still renders the email-password form (graceful degradation per ADR §7).
- [ ] No regressions across the rest of the CRM auth surface.

## 6. Test Plan

**Unit tests (Vitest):**
- `loadGisScript` helper — idempotent (multiple calls resolve to the same script tag).

**Component tests (RTL):**
- `GoogleSignInButton` — mock the GIS script + the nonce fetch + the auth POST fetch. Assert: nonce is fetched on mount and passed to `initialize`; the `callback` POSTs `{ credential, nonce }` to `/api/auth/google`; success calls `router.push` with the dashboard route; 401 from the BFF renders the error message; missing `NEXT_PUBLIC_GOOGLE_CLIENT_ID` hides the button.

**E2E tests (Playwright):**
- **Confirm with the user before scaffolding** (per the `sdlc-tests` skill's e2e rule). Suggested critical flow: stub `/api/auth/google/nonce` and `/api/auth/google` (do **not** drive the real Google consent UI — Google blocks automation per ADR §9). Drive only the BFF side: click button → assertion that the BFF was called with the right shape → simulated 200 → assert navigation to the dashboard. AC-3 path: simulated 401 → assert error visible.

**Test data needs:**
- Mock of `window.google.accounts.id.initialize` / `.renderButton`.
- MSW handlers for `/api/auth/google/nonce` and `/api/auth/google`.
- Stub for `next/navigation`'s `useRouter`.

## 7. Notes & Considerations

- **Compactness exception:** parallelization gate failed; created on user request.
- ADR alignment: matches ADR-FEAT-007-02 §9 Consequences ("New BFF route on `client/app/crm/auth/page.tsx` …"). Visual style should pick up the existing CRM auth design — use Tailwind + shadcn primitives already in the project (no DaisyUI per project memory).
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is intentionally public (it is the same value Google embeds in any redirect URL anyway). It is **not** the client secret. Do not import or read `GOOGLE_CLIENT_SECRET` anywhere in the client workspace — none should exist (ADR-FEAT-007-02 picked the no-secret flow).
- The nonce flow has one observable subtlety: each render of the button consumes one nonce. If the user opens the page, walks away, and returns after 5 minutes, the nonce is expired — the click will 401. Detect the 401 and re-fetch a fresh nonce, then prompt the user to click again with a message like "Session expired, please try again". This is preferable to silently re-issuing the nonce.
- Do not request any scope beyond the default OpenID identity (NFR-3). GIS `initialize` is scope-agnostic — just do not opt into `prompt_parent_id` or extra scopes.
- The Google button must be keyboard-accessible and screen-reader-labelled. GIS handles this natively; just do not wrap it in a click-only div.
- If the project has a global GA/analytics layer, do not track the OAuth credential in any event — it is a sensitive payload.

## 8. References

- Feature Spec: `01-feature-spec.md` — FR-1, FR-3, FR-6, FR-7, NFR-3, AC-1, AC-2, AC-3, AC-4
- ADR: `03-adr.md` — ADR-FEAT-007-02 §5 (Decision), §7 Known Limitations (GIS CDN dependency, nonce session requirement), §9 Consequences "For the codebase"
- Related tasks: T-003 (BFF routes consumed here), T-002 (Nest endpoint behind the BFF)
