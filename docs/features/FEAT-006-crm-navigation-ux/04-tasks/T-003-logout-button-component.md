# Task T-003: LogoutButton Component

**Task ID:** T-003
**Feature:** FEAT-006-crm-navigation-ux
**Status:** Todo
**Priority:** Must-have
**Depends on:** none

---

## 1. Context

FR-4 and FR-5 require a Logout button accessible from every protected CRM page. Clicking it must issue a POST (not GET — NFR-2) to the existing `/api/auth/logout` route, clear all room tokens from `localStorage`, and redirect to `/crm/auth`. A confirmation step prevents accidental logouts. This component is a self-contained client-side unit that can be built and tested independently before being mounted in `CrmHeader`.

Related requirements: FR-4, FR-5, NFR-2, NFR-3, AC-3, AC-4

## 2. Description

Build a `<LogoutButton>` client component that renders a destructive-outline `Button`. Clicking it shows an inline confirmation state ("Log out?" with Confirm / Cancel buttons). Confirming triggers a `fetch` POST to `/api/auth/logout`, clears all `localStorage` keys matching `room:*:token`, and then calls `router.push('/crm/auth')`. Cancelling returns to the default state. The component manages its own `isConfirming` and `isPending` states.

## 3. Files to Touch

**Create:**
- `client/src/components/LogoutButton.tsx` — client component with confirm flow
- `client/src/components/LogoutButton.test.tsx` — test scaffold

**Read for context (no changes expected):**
- `client/app/api/auth/logout/route.ts` — existing POST handler (reads `session_id` cookie, calls `logoutServer()`, deletes session)
- `client/src/utils/local-storage.ts` — existing `setRoomToken`/`getRoomToken` using key pattern `room:${auctionId}:token`

## 4. Implementation Plan

1. Create `'use client'` component. Import `useState`, `useRouter` from Next.js, `Button` from `@/ui-kit/ui/button`.
2. Implement a `clearRoomTokens()` helper inside the file: iterate `Object.keys(localStorage)`, remove any key matching `/^room:.+:token$/`.
3. Implement `handleConfirm()`:
   - Set `isPending = true`.
   - `await fetch('/api/auth/logout', { method: 'POST' })`.
   - Call `clearRoomTokens()`.
   - `router.push('/crm/auth')`.
   - On error: set `isPending = false`, show error toast (use `useNotification` from `@/src/modules/notifications/NotifcationContext`).
4. Render logic:
   - `isConfirming === false`: render `<Button variant="outline" className="border-destructive text-destructive ...">Log out</Button>` — click sets `isConfirming = true`.
   - `isConfirming === true`: render "Log out?" label + `<Button variant="destructive" disabled={isPending}>Confirm</Button>` + `<Button variant="ghost">Cancel</Button>`.
5. Export as default.

## 5. Definition of Done

- [ ] All code in "Files to Touch" is written and lints cleanly.
- [ ] Test scaffold file exists.
- [ ] No regressions in existing tests.
- [ ] Code follows existing project conventions and patterns.
- [ ] Logout uses `fetch` POST — never a link or GET request (NFR-2, AC-4).
- [ ] All `localStorage` keys matching `room:*:token` are removed after logout (FR-5).
- [ ] User is redirected to `/crm/auth` after successful logout (FR-5, AC-4).
- [ ] Confirmation step prevents single-click logout (prototype spec).
- [ ] Button uses shadcn/ui `Button` with destructive styling (NFR-3).

## 6. Test Plan

**Component tests (RTL):**
- Default state: renders "Log out" button, no confirmation visible.
- After click: confirmation state shows "Log out?", Confirm, and Cancel buttons.
- Cancel: returns to default state.
- Confirm (mock fetch + router): calls `fetch POST /api/auth/logout`, removes localStorage room tokens, calls `router.push('/crm/auth')`.
- Error state: when fetch rejects, does NOT redirect; shows error notification.

**Unit tests (Vitest):**
- `clearRoomTokens()` (if extracted to a utility): removes keys matching `room:*:token`, leaves other keys untouched.

**E2E tests (Playwright):**
- Full logout flow: authenticated user on `/crm/auctions` clicks Logout → confirms → lands on `/crm/auth` → navigating to `/crm/auctions` redirects back to `/crm/auth` (AC-4).

**Test data needs:**
- `localStorage` fixture with `room:abc:token`, `room:xyz:token`, and an unrelated key `some-other-key`.

## 7. Notes & Considerations

- `client/src/utils/local-storage.ts` only has `setRoomToken` / `getRoomToken` for a single auctionId. The logout needs to clear ALL room tokens without knowing their IDs — implement the clearing logic inline in `LogoutButton` rather than extending the utility (minimal impact principle).
- The existing logout route (`/app/api/auth/logout/route.ts`) returns 401 if there is no `session_id` cookie. The component should handle a non-2xx response gracefully (show error, don't redirect).
- `useRouter` from `next/navigation` (App Router) — not from `next/router` (Pages Router).
- Prototype shows the confirmation as inline inline sibling buttons, not a modal dialog — keep it inline to match.

## 8. References

- Feature Spec: `01-feature-spec.md` — §6 FR-4/FR-5, §7 NFR-2/NFR-3, §9 AC-3/AC-4
- ADR: `03-adr.md` — Decision 2 §9 (logout calls `POST /api/auth/logout`, clears localStorage, redirects to `/crm/auth`)
- Related tasks: T-004 (mounts this component inside the new CrmHeader)
