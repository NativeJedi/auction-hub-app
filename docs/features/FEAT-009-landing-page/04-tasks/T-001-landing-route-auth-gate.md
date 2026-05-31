# Task T-001: Open `/` as the public landing route with auth-aware rendering

**Task ID:** T-001
**Feature:** FEAT-009-landing-page
**Status:** Todo
**Priority:** Must-have
**Depends on:** none

---

## 1. Context

Today `/` is a pure redirect dispatcher (`client/app/page.tsx` → `/crm/auth` or `/crm/auctions`) and the root is *not* in the middleware allowlist, so an unauthenticated hit on `/` is bounced at the edge before the page renders. This task removes that dispatch, makes `/` reachable to everyone, and turns the root into a Server Component that reads the session cookie and exposes an `isAuthenticated` flag to the landing shell. It is the routing/auth foundation every other landing task renders through.

Related requirements: FR-1, FR-7, AC-1, AC-4

## 2. Description

Make `/` the canonical public entry route. The root Server Component reads `SESSION_COOKIE_NAME` via `cookies()`, derives `isAuthenticated`, and renders a `<LandingPage isAuthenticated={…} />` shell instead of redirecting. The middleware gains an exact-match allow for `/` so the root is never gated, while every other protected route still redirects when unauthenticated. No redirect happens for authenticated visitors — they see the landing and re-enter via the adaptive header (built in T-002).

## 3. Files to Touch

**Create:**
- `client/src/modules/landing/LandingPage.tsx` — minimal landing container that accepts `isAuthenticated: boolean`; renders a placeholder shell that T-002 fills with real sections.
- `client/app/page.test.tsx` — scaffold: unauth `/` renders the landing (not a 307), authed `/` renders the landing with the flag set.
- `client/middleware.test.ts` — scaffold: `/` is allowed without a session; a protected route still redirects without a session.

**Modify:**
- `client/app/page.tsx` — remove the `redirect()` dispatch; read `SESSION_COOKIE_NAME`, compute `isAuthenticated`, render `<LandingPage>`.
- `client/middleware.ts` — add exact-match `path === '/'` → `NextResponse.next()` **before** the slice-based `publicRoutes.some(...)` check.

**Read for context (no changes expected):**
- `client/src/services/session/constants.ts` — `SESSION_COOKIE_NAME`.
- `client/app/confirm-email/page.tsx` — RSC + `cookies()`/router conventions.

## 4. Implementation Plan

1. In `client/middleware.ts`, add `if (req.nextUrl.pathname === '/') return NextResponse.next();` ahead of the `isPublicRoute` computation. Do **not** append `/` to `publicRoutes` (the `path.includes` check would whitelist the entire site — ADR §7).
2. Create `client/src/modules/landing/LandingPage.tsx` exporting a component with an `isAuthenticated: boolean` prop and a minimal placeholder body (sections arrive in T-002).
3. Rewrite `client/app/page.tsx`: keep it an async Server Component, read the session cookie via `cookies()`, set `const isAuthenticated = Boolean(sessionId)`, delete both `redirect()` calls, and return `<LandingPage isAuthenticated={isAuthenticated} />`.
4. Scaffold `client/app/page.test.tsx` and `client/middleware.test.ts` with the cases listed in the Test Plan (empty bodies / `it.todo`).

## 5. Definition of Done

The task is complete when:

- [ ] All code in "Files to Touch" is written and lints cleanly.
- [ ] Test files exist (scaffolded — actual tests filled in by `sdlc-tests`).
- [ ] No regressions in existing tests.
- [ ] Code follows existing project conventions and patterns.
- [ ] An unauthenticated request to `/` renders the landing page and does **not** redirect to `/crm/auth` (AC-1).
- [ ] An authenticated request to `/` renders the landing page (no redirect into the app) with `isAuthenticated` true (AC-4 foundation; the "Go to dashboard" control itself lands in T-002).
- [ ] Other protected routes still redirect to `/crm/auth` when unauthenticated (the `/` exact-match did not widen the allowlist).

## 6. Test Plan

**Unit tests (Vitest):**
- Middleware: `/` passes through without a session; `/crm/auctions` (or similar protected path) redirects to `/crm/auth` without a session; a known public slice still passes.

**Component tests (RTL):**
- `page.tsx` (or `LandingPage`): renders the landing shell for both `isAuthenticated` true and false.

**E2E tests (Playwright):**
- None — no Playwright harness in `client/`; route behavior is covered at the middleware/unit level.

**Test data needs:**
- Mock for `cookies()` returning a session value present / absent.

## 7. Notes & Considerations

- **Compactness exception:** parallelization gate failed (work is effectively a single sequential unit); created on user request as documentation.
- ADR D1 §5 (chosen: landing replaces `/`) and §7/§9 — the middleware change is a real exact-match edit, not a config tweak.
- ADR D2 §5 (chosen: dynamic Server Component reading the cookie, Option A) — reading `cookies()` opts the route out of static optimization; this is intended, not a regression.
- FR-7 conflict is already resolved in the spec (FR-7 line describes the adaptive header, not a redirect) — no `sdlc-ba` action needed.

## 8. References

- Feature Spec: `01-feature-spec.md` (FR-1, FR-7, AC-1, AC-4)
- ADR: `03-adr.md` (Decision 1 §5/§7/§9 routing & middleware; Decision 2 §5 dynamic RSC)
- Related tasks: T-002 (landing sections rendered through this shell), T-003 (SEO surface on this route)
