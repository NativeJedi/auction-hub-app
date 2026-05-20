# Task T-004: CrmHeader (Global Nav) + CRM Layout

**Task ID:** T-004
**Feature:** FEAT-006-crm-navigation-ux
**Status:** Todo
**Priority:** Must-have
**Depends on:** T-002, T-003

---

## 1. Context

FR-4 and FR-6 require logout and language-switcher controls to be globally available on every CRM page without per-page opt-in. ADR Decision 2 chose to deliver this via a new top-bar component wired into the CRM layout. Because the existing `CrmHeader` name is taken by the per-page title+action bar, the naming resolution agreed during planning is: the old per-page component is renamed to `CrmPageHeader`, and the new global sticky bar takes the `CrmHeader` name. The new `CrmHeader` renders on ALL `/crm/*` pages — including `/crm/auth` — but without the logout button when the user is not authenticated.

Related requirements: FR-4, FR-6, NFR-3, NFR-4, AC-3, AC-5

## 2. Description

Rename the existing `CrmHeader` component to `CrmPageHeader` (content unchanged) and update all two import sites. Create a new `CrmHeader` — a sticky 52px top bar containing "AuctionHub CRM" brand text, `<LanguageSwitcher>`, and (conditionally) `<LogoutButton>`. Place `<CrmHeader>` in a new `app/crm/layout.tsx` that wraps all CRM pages. Logout visibility is determined server-side: if the `session_id` cookie is present, the layout passes `showLogout={true}` to `CrmHeader`; the auth page session cookie is absent, so logout is hidden automatically.

## 3. Files to Touch

**Create:**
- `client/src/layouts/CrmPageHeader.tsx` — copy of current `CrmHeader.tsx` content, renamed export
- `client/src/layouts/CrmHeader.tsx` — new global sticky nav bar (replaces old file)
- `client/src/layouts/CrmHeader.test.tsx` — test scaffold
- `client/app/crm/layout.tsx` — CRM root layout rendering `<CrmHeader>`

**Modify:**
- `client/app/crm/auctions/page.tsx` — update import: `CrmHeader` → `CrmPageHeader`
- `client/app/crm/auctions/[auctionId]/page.tsx` — update import: `CrmHeader` → `CrmPageHeader`

**Read for context (no changes expected):**
- `client/src/services/session/constants.ts` — `SESSION_COOKIE_NAME = 'session_id'`
- `client/app/layout.tsx` — root layout structure (no changes needed)
- `client/src/components/LanguageSwitcher.tsx` — from T-002
- `client/src/components/LogoutButton.tsx` — from T-003

## 4. Implementation Plan

1. **Rename:** copy `client/src/layouts/CrmHeader.tsx` to `client/src/layouts/CrmPageHeader.tsx`; update the export name from `CrmHeader` to `CrmPageHeader` inside the file. Delete (or overwrite) the original `CrmHeader.tsx`.
2. **Update import sites:** in `auctions/page.tsx` and `auctions/[auctionId]/page.tsx`, replace `import CrmHeader from '@/src/layouts/CrmHeader'` → `import CrmPageHeader from '@/src/layouts/CrmPageHeader'` and update JSX usage accordingly.
3. **Create new `CrmHeader`** (`client/src/layouts/CrmHeader.tsx`):
   - Server Component.
   - Props: `showLogout: boolean`.
   - Render: `<header className="sticky top-0 z-50 h-[52px] border-b bg-background flex items-center justify-between px-6">` with brand `<span>AuctionHub CRM</span>` on the left, and `<div className="flex items-center gap-2">` containing `<LanguageSwitcher />` and `{showLogout && <LogoutButton />}` on the right.
4. **Create `app/crm/layout.tsx`** (Server Component):
   - Import `cookies` from `next/headers` and `SESSION_COOKIE_NAME` from `@/src/services/session/constants`.
   - `const isAuthenticated = !!(await cookies()).get(SESSION_COOKIE_NAME)?.value`.
   - Return: `<><CrmHeader showLogout={isAuthenticated} /><main>{children}</main></>`.
5. Verify no TypeScript errors — run `cd client && npx tsc --noEmit`.

## 5. Definition of Done

- [ ] All code in "Files to Touch" is written and lints cleanly.
- [ ] Test scaffold exists for the new `CrmHeader`.
- [ ] No regressions in existing tests.
- [ ] Code follows existing project conventions and patterns.
- [ ] `CrmPageHeader` is functionally identical to the old `CrmHeader` (same props, same render — NFR-4).
- [ ] New `CrmHeader` renders on `/crm/auctions` and `/crm/auctions/[id]` with brand + language switcher + logout button visible (AC-3, AC-5).
- [ ] New `CrmHeader` renders on `/crm/auth` with brand + language switcher but **no logout button**.
- [ ] `CrmPageHeader` usages on both CRM pages are not broken.
- [ ] `app/crm/layout.tsx` is a Server Component (no `'use client'` directive).

## 6. Test Plan

**Component tests (RTL):**
- `CrmHeader` with `showLogout={true}`: renders brand text, `LanguageSwitcher`, and `LogoutButton`.
- `CrmHeader` with `showLogout={false}`: renders brand text and `LanguageSwitcher`; no `LogoutButton`.
- `CrmPageHeader` renders title and action slot unchanged (regression guard).

**Unit tests (Vitest):** none — no pure logic.

**E2E tests (Playwright):**
- Authenticated: `/crm/auctions` shows CrmHeader with logout button.
- Unauthenticated: `/crm/auth` shows CrmHeader without logout button.

**Test data needs:**
- Mock for `SESSION_COOKIE_NAME` presence / absence when testing layout behaviour.

## 7. Notes & Considerations

- `LogoutButton` is a `'use client'` component. `CrmHeader` is a Server Component. In Next.js App Router, a Server Component can render a Client Component — no issues.
- The `showLogout` prop avoids importing cookies() inside `CrmHeader` itself, keeping the component testable without a Next.js request context.
- `CrmPageHeader` is functionally identical to the old `CrmHeader` — the only difference is the file name and export name. This satisfies NFR-4 (prop contract preserved) since callers are updated in the same task.
- Assumption (ADR Decision 2 §6): the sticky top bar height is 52px and uses `border-b` on `bg-background`. Match the prototype's visual separation between the top bar and per-page content.

## 8. References

- Feature Spec: `01-feature-spec.md` — §6 FR-4/FR-6, §7 NFR-3/NFR-4, §9 AC-3/AC-5
- ADR: `03-adr.md` — Decision 2 §5 (Option A: CrmTopBar in layout), §9 (consequences for codebase)
- Related tasks: T-002 (LanguageSwitcher), T-003 (LogoutButton), T-005 (detail page redesign)
