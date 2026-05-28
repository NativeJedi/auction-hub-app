# Task T-004: Client Email-Confirmation Flow

**Task ID:** T-004
**Feature:** FEAT-008-email-confirmation
**Status:** Todo
**Priority:** Must-have
**Depends on:** T-002, T-003

---

## 1. Context

This task wires the client-side UX for email confirmation. After T-002 changes the server's
register response (no longer returning tokens) and adds the confirmation + resend endpoints,
and after T-003 ensures Google users are never blocked, this task adapts the client to
reflect the new flow. It covers three distinct surfaces: the post-registration state on the
auth page, the public `/confirm-email` page that the email link lands on, and the login
form's new error state for unverified accounts.

Related requirements: FR-3 (redirect to login after confirm), FR-6 ("check your email"
screen with resend), AC-1, AC-2, AC-3, AC-4

## 2. Description

Add a `pendingConfirmation` UI state to the existing auth page that shows after successful
registration. Create a public `/confirm-email` Next.js page that reads the `?token=` query
param, calls the confirmation endpoint, shows a success toast and redirects to the login
page, or shows a standard error toast on failure and redirects to the login page. Update the
login form to handle the new 403 `EMAIL_NOT_VERIFIED` error with a clear user-facing message
and an inline "Resend" option. Add the two new API client functions (`confirmEmail`,
`resendConfirmation`) and their BFF proxy routes.

**Component reuse is the primary directive for this task.** Before writing any UI element,
scan the existing codebase for a reusable component. If nothing fits, pull from shadcn/ui.
Writing a bespoke component from scratch is the last resort.

## 3. Files to Touch

**Create:**
- `client/app/confirm-email/page.tsx` — public Next.js page; reads `?token=`, calls the confirm endpoint, redirects
- `client/app/api/auth/confirm-email/route.ts` — BFF proxy for `GET /auth/confirm-email?token=` (only if existing BFF auth routes follow this pattern; inspect `client/app/api/auth/` first)
- `client/app/api/auth/resend-confirmation/route.ts` — BFF proxy for `POST /auth/resend-confirmation` (same condition)

**Modify:**
- `client/app/crm/auth/page.tsx` — add `pendingConfirmation` state (shown after register); update login error handling for `EMAIL_NOT_VERIFIED`
- `client/src/api/auctions-api-client/requests/auth.ts` — add `confirmEmail(token: string)` and `resendConfirmation(email: string)` functions

**Read for context (no changes expected):**
- `client/app/api/auth/` — existing BFF proxy routes to match pattern
- `client/app/crm/auth/page.tsx` — current register + login UI flows
- `client/src/modules/notifications/` — toast pattern to reuse for resend feedback

## 4. Implementation Plan

1. **Add API client functions.** In `client/src/api/auctions-api-client/requests/auth.ts`, add:
   - `confirmEmail(token: string): Promise<{ status: string }>` — calls `GET /auth/confirm-email?token=${token}` (via BFF or direct, matching existing patterns).
   - `resendConfirmation(email: string): Promise<{ status: string }>` — calls `POST /auth/resend-confirmation` with body `{ email }`.
   
   Inspect existing auth.ts functions (e.g. `login()`, `register()`) to match the exact Axios call pattern, error normalization, and response extraction used there.

2. **Create BFF proxy routes** (only if the existing `client/app/api/auth/` routes proxy to the NestJS server — verify first). If they do, add `confirm-email/route.ts` and `resend-confirmation/route.ts` following the same pattern (forwarding the request with server-side auth headers stripped, since these endpoints are public/unauthenticated).

3. **"Check your email" state via URL param.** After register returns `{ status: 'pending_confirmation' }`, redirect to `/crm/auth?pending=<encoded-email>` instead of setting React state. The auth page reads `?pending=` from the URL on mount (via `useSearchParams`) and renders the "check email" view when the param is present:
   - Heading: "Check your inbox"
   - Body: "We sent a confirmation link to **{email}**. Click it to activate your account. The link expires in 24 hours."
   - "Resend" button that calls `resendConfirmation(email)` (email decoded from the URL param) and shows a success toast ("New confirmation link sent") or a 429 toast ("Too many requests — please wait before trying again").
   
   Storing the state in the URL means the "check email" screen survives a page refresh and can be bookmarked or shared. The email value must be URL-encoded (`encodeURIComponent`) when writing and decoded when reading.

4. **Login `EMAIL_NOT_VERIFIED` error state.** In the login error handler in `client/app/crm/auth/page.tsx`, detect the 403 + `EMAIL_NOT_VERIFIED` response code and render a distinct inline message:
   - "Your email address hasn't been confirmed yet. Check your inbox or [Resend confirmation email]."
   - The "Resend confirmation email" link/button calls `resendConfirmation(email)` with the email the user typed in the login form.

5. **Create `client/app/confirm-email/page.tsx`.** This is a public route (no auth wrapper).
   - On mount (via `useEffect` or `useSearchParams`), read `?token=` from the URL.
   - If token is missing, show an error toast ("Confirmation link is invalid") and redirect to `/crm/auth`.
   - Call `confirmEmail(token)`.
   - On success: show a success toast ("Email confirmed! You can now log in.") and redirect to `/crm/auth`.
   - On error (403 or network): show a standard error toast ("The confirmation link is invalid or has expired.") and redirect to `/crm/auth`.
   - Show a loading state ("Confirming your email…") while the request is in-flight; avoid a flash of empty content.
   - Use the existing toast/notification system from `client/src/modules/notifications/` — do not introduce a new notification mechanism.

## 5. Definition of Done

The task is complete when:

- [ ] All code in "Files to Touch" is written and lints cleanly.
- [ ] Test files exist (scaffolded — actual tests filled in by `sdlc-tests`).
- [ ] No regressions in existing tests (`npm run build` in client passes; no TypeScript errors).
- [ ] Code follows existing project conventions and patterns (shadcn/ui, Tailwind, Zod + React Hook Form).
- [ ] No bespoke component was written where an existing codebase component or shadcn/ui primitive would suffice — each new UI element is justified in the PR description.
- [ ] After successful registration, the client redirects to `/crm/auth?pending=<email>` and the auth page renders the "check your email" screen (survives page refresh).
- [ ] Clicking the confirmation link in the email (simulated via direct URL) shows a success toast and redirects to the login page.
- [ ] An expired or missing token on `/confirm-email` shows a standard error toast and redirects to the login page.
- [ ] Login with an unverified account shows the `EMAIL_NOT_VERIFIED` message and a functional resend option.
- [ ] Resend button shows success toast on 200 and a distinct "too many requests" toast on 429.
- [ ] Google Sign-In users are unaffected (no "check email" screen; login proceeds as before).

## 6. Test Plan

Tests that `sdlc-tests` should write for this task:

**Unit tests (Vitest):**
- `confirmEmail(token)` API function — calls the correct endpoint with the token; returns the response data.
- `resendConfirmation(email)` API function — calls the correct endpoint with `{ email }` body.

**Component tests (RTL):**
- Auth page (register flow) — when `register()` resolves with `{ status: 'pending_confirmation' }`, the router pushes to `/crm/auth?pending=<email>`; when `?pending=` is present in the URL, the "check your email" view is rendered with the decoded email and a visible "Resend" button.
- Auth page (login flow) — when `login()` rejects with 403 `EMAIL_NOT_VERIFIED`, the specific error message is rendered; the "Resend" link is present.
- Confirm-email page — renders loading state on mount; after `confirmEmail` resolves, a success toast is shown and router pushes to `/crm/auth`; after rejection, an error toast is shown and router pushes to `/crm/auth`.

**E2E tests (Playwright):**
- Full registration → "check email" screen → click confirmation link → login succeeds with success banner (critical path, covers AC-1 and AC-2).
- Login with unverified account → see EMAIL_NOT_VERIFIED error → click resend → success toast (covers AC-3 and AC-4).

**Test data needs:**
- Mock for `confirmEmail` resolving and rejecting.
- Mock for `resendConfirmation` resolving, and rejecting with 429.
- A valid `?token=abc123` query param fixture for the confirm-email page tests.

## 7. Notes & Considerations

- **OQ-1 resolved.** Invalid or expired confirmation links show a standard error toast and redirect to `/crm/auth` — no dedicated error page, no query-param banners. Use the existing notification system from `client/src/modules/notifications/`.
- **`/confirm-email` is a public route.** It must not be wrapped by any auth middleware or layout that redirects unauthenticated users. Verify the Next.js layout hierarchy (e.g. if `client/app/crm/` has an auth guard in its `layout.tsx`, `/confirm-email` must live outside that segment, which the proposed path already achieves).
- **BFF proxy vs direct call.** If the existing `client/app/api/auth/` routes show that auth endpoints are proxied server-side, follow that pattern. If auth calls go directly to the NestJS server from the browser (Axios), follow that pattern instead. Do not mix patterns.
- **No Zod schema change for the register form.** The form shape (email + password) is unchanged. Only the submit handler's response branch changes.
- **Loading state on `/confirm-email`.** The page makes a network call on mount. Avoid rendering `null` or an empty page while in-flight — reuse an existing spinner/skeleton component from the codebase; if none exists, use shadcn/ui `Skeleton` or a simple text "Confirming your email…".
- **Component reuse checklist — apply before writing any new UI:**
  1. Search `client/src/` for an existing component that covers the need (buttons, alerts, cards, loaders, form fields).
  2. If not found in the codebase, check the shadcn/ui registry (`npx shadcn@latest add <component>`) — `Button`, `Alert`, `Card`, `Badge`, `Separator` are all candidates for this task.
  3. Only write a new component if neither option covers the need.
  Never duplicate markup that already exists elsewhere in the app just to avoid importing.

## 8. References

- Feature Spec: `docs/features/FEAT-008-email-confirmation/01-feature-spec.md` (FR-3, FR-6, AC-1, AC-2, AC-3, AC-4, §10 Out of Scope — no HTML email templates, no admin panel)
- ADR: `docs/features/FEAT-008-email-confirmation/03-adr.md` (ADR-FEAT-008-02 — §9 Consequences: register no longer returns tokens; login throws `EMAIL_NOT_VERIFIED`)
- Related tasks: T-002 (prerequisite — provides all server endpoints this task calls), T-003 (prerequisite — ensures Google users are never blocked, so the client flow is only triggered for email/password registrants)
