# Code Review — FEAT-009: Landing Page (T-001, T-002, T-003)

**Feature:** FEAT-009-landing-page
**Tasks:** T-001 (route + auth-aware render) · T-002 (marketing sections + adaptive header) · T-003 (SEO surface)
**Reviewer:** sdlc-review (inline — `sdlc-code-reviewer` subagent not invoked)
**Diff base:** `d58426e..2c07b49` (feature commit `HEAD`)
**Diff scope:** 39 files, +1500 / −27 (combined feature review — the three tasks are tightly coupled and share `app/page.tsx`)
**Date:** 2026-05-31

---

## Summary

The landing surface is well-built and faithful to the ADR: `/` renders a dynamic Server Component that reads the session cookie and threads `isAuthenticated` into an adaptive header (ADR D2, Option A), and the middleware gets the exact-match `/` allow it needs (ADR D1 §7). The biggest issue is **B-1**: the middleware matcher still intercepts `/robots.txt` and `/sitemap.xml`, so an unauthenticated crawler is redirected to `/crm/auth` and never reaches the SEO surface that T-003 exists to add. Separately, the commit bundles three unrelated changes (server auction/lot limits, the logout cookie fix, an env refactor) that fall outside every FEAT-009 task's Files-to-Touch (S-1).

**Verdict:** Request changes — 1 blocking
**Counts:** Blocking: 1 · Significant: 2 · Nits: 2

---

## Definition-of-Done check

**T-001 — route + auth-aware render**
- [x] `/` reachable, renders landing, no redirect for unauth — satisfied: `client/app/page.tsx:25-32`, `client/middleware.ts:13`.
- [x] Authed `/` renders landing with `isAuthenticated` true (no app redirect) — satisfied: `client/app/page.tsx:28-31`.
- [x] Other protected routes still redirect when unauthenticated — satisfied: `client/middleware.ts:15-25`.

**T-002 — marketing sections + adaptive header**
- [x] Hero + five steps + capabilities render (AC-2) — satisfied: `LandingPage.tsx:14-26`, `HowItWorks.tsx`, `Capabilities.tsx`.
- [x] Register/Login one-click to correct screen (AC-3/FR-6) — satisfied: `Hero.tsx:33-41`, `LandingHeader.tsx:26-39`.
- [x] Authed visitor sees "Go to dashboard" (AC-4/FR-7) — satisfied: `LandingHeader.tsx:26-28`.
- [~] WCAG 2.1 AA / responsive (NFR-1/NFR-2) — partial: landmarks, heading order and focus-visible look correct; not independently audited here. One mobile gap noted (N-1).

**T-003 — SEO surface**
- [ ] `/robots.txt` allows crawling & references sitemap; `/sitemap.xml` includes `/` — **not satisfied**: the files are correct in isolation but unreachable to anonymous crawlers (see **B-1**).
- [x] Landing route exposes title/description/Open Graph — satisfied: `client/app/page.tsx:8-23`.

---

## Files-to-Touch contract check

In-contract landing files (all present, all OK):

| Path | Task | In diff? | Notes |
|---|---|---|---|
| `client/app/page.tsx` | T-001/T-003 | Yes | OK |
| `client/middleware.ts` | T-001 | Yes | OK for `/`; see B-1 for robots/sitemap |
| `client/src/modules/landing/LandingPage.tsx` | T-001/T-002 | Yes | OK |
| `client/src/modules/landing/components/*` | T-002 | Yes | OK (Hero, HowItWorks, Capabilities, ClosingCta, LandingFooter, LandingHeader) |
| `client/app/sitemap.ts`, `robots.ts` | T-003 | Yes | OK in isolation |
| `*.test.*` (landing) | T-001/2/3 | Yes | Filled by sdlc-tests; see Test scaffold coverage |

Out-of-contract files in the diff (none appear in any FEAT-009 task — see **S-1**):

| Path | In any contract? | Notes |
|---|---|---|
| `client/src/components/Logo.tsx` | No | Reasonable extraction used by both headers; justified |
| `client/src/layouts/HeadedLayout.tsx`, `SiteHeader.tsx` | No | CRM header refactor (sticky, shared `max-w-6xl` container, `logoHref`) — adjacent, sensible |
| `client/app/{confirm-email,crm/auth,room}/layout.tsx`, `results/[auctionId]/page.tsx` | No | `robots: { index:false }` metadata — defensible T-003 extension, but undeclared |
| `client/app/crm/auth/page.tsx` | No | Adds `logoHref="/"` so the auth logo points at the landing — sensible |
| `client/app/api/auth/logout/route.ts` (+test) | No | Logout cookie-clear bug fix — correct, but unrelated to FEAT-009 |
| `server/.../auctions.service.ts`, `lots.service.ts` (+specs) | No | Per-owner limits (100 auctions / 50 lots) — tested, but unrelated; see S-1 |
| `.env.example`, `docker-compose.yml` | No | `CLIENT_DOMAIN`-derived env — unrelated; see open questions |

---

## Findings

### Blocking

#### B-1 — Middleware redirects `/robots.txt` and `/sitemap.xml`, so crawlers never reach the SEO surface
**Where:** `client/middleware.ts:13-25` and `:30-32` (matcher)
**What:** The matcher `'/((?!api|_next/static|_next/image|.*\\.png$).*)'` does not exclude `/robots.txt` or `/sitemap.xml`, so middleware runs on both. Neither equals `/` (the only exact-match allow) and neither matches a `publicRoutes` slice (`/crm/auth`, `/room`, `/results`, `/confirm-email`). An anonymous request therefore falls through to the `if (!sessionId)` branch and is **307-redirected to `/crm/auth`**. A search-engine crawler sends no session cookie, so it receives the redirect instead of the robots/sitemap body.
**Why blocking:** This defeats T-003's Definition of Done ("`/robots.txt` allows crawling and references the sitemap", "`/sitemap.xml` includes the landing root") and the ADR's central SEO driver (ADR D1 §2, D2 §1 — "an unauthenticated crawler must receive the full server-rendered landing… crawlable and shareable"). Owning `/` for indexability is the whole reason this feature exists.
**Suggested fix:** Allow the two generated endpoints the same way `/` is allowed:
```ts
// option A — extend the exact-match guard in middleware():
if (path === '/' || path === '/robots.txt' || path === '/sitemap.xml') {
  return NextResponse.next();
}
// option B — exclude them in the matcher negative-lookahead:
matcher: ['/((?!api|_next/static|_next/image|robots\\.txt|sitemap\\.xml|.*\\.png$).*)'],
```
Then add a `middleware.test.ts` case: `/robots.txt` (and `/sitemap.xml`) pass through without a session.

### Significant

#### S-1 — Four unrelated concerns bundled into one FEAT-009 commit
**Where:** N/A — diff-wide (`server/**`, `client/app/api/auth/logout/**`, `.env.example`, `docker-compose.yml`)
**What:** The commit mixes the landing feature with (a) server-side per-owner auction/lot limits, (b) the logout cookie-clear fix, and (c) the `CLIENT_DOMAIN` env refactor. None is in any FEAT-009 task's Files-to-Touch. Each of (a)–(c) looks individually reasonable (the limits even ship with Jest specs, the logout fix is correct), but they never had their own task, ADR scope, or review boundary.
**Why:** Breaks the Files-to-Touch contract for all three tasks (skill §2 — out-of-contract files are at least Significant) and couples unrelated risk: B-1 cannot be reverted without also touching server-limit / logout / env work in the same commit.
**Suggested fix:** No code change required to the bundled work itself; going forward land these as separate commits/tasks so each gets its own review and revert boundary.

#### S-3 — "How an auction works" step order contradicts FR-4 / the product flow
**Where:** `client/src/modules/landing/components/HowItWorks.tsx:3-25`
**What:** The rendered order is Create → Add lots → **Start auction → Invite bidders** → Manage live bidding. FR-4 lists "create room → add lots → **invite participants → run live bidding** → finish", i.e. invite *before* bidding goes live; the product flow is also "invite (QR) → start". Showing "Start auction" before "Invite bidders" tells a first-time visitor to open the sale before anyone can scan in.
**Why:** AC-2 requires the *ordered* auction-flow steps and traces to FR-4's ordering; teaching the correct flow (US-2) is the section's job. The current order misrepresents it.
**Suggested fix:** Reorder so invite precedes going live (Create → Add lots → Invite bidders → Start auction → Manage live bidding). If the real runtime flow genuinely starts before inviting, confirm with the product owner and back-port FR-4 via `sdlc-ba`.

### Nits

#### N-1 — Header "Log in" is hidden on mobile for anonymous visitors
**Where:** `client/src/modules/landing/components/LandingHeader.tsx:32` (`hidden sm:inline-flex`)
**What:** On phones the anonymous header shows only "Get started"; the login link is hidden.
**Why nit:** Login stays one-click via the Hero ("I already have an account") and ClosingCta ("Log in"), so AC-3/FR-3 are still met — but a returning organizer on mobile loses the top-of-page login affordance.
**Suggested fix:** Optional — keep "Log in" visible on mobile, or accept the Hero/ClosingCta paths.

#### N-2 — Limit violations return 400 and have a benign check-then-act race
**Where:** `server/src/modules/auctions/auctions.service.ts:53-58` (`MAX_AUCTIONS_PER_OWNER = 100`), `server/src/modules/lots/lots.service.ts:66-73` (`MAX_LOTS_PER_AUCTION = 50`)
**What:** Exceeding a quota throws `BadRequestException` (400); `ForbiddenException` (403) / `ConflictException` (409) communicates "limit reached" better. Both checks are `count()` → `throw` → `save()`, a TOCTOU window where two concurrent creates could both pass.
**Why nit:** Messages are clear and user-facing; the race is low-stakes at 100/50 and these are soft caps.
**Suggested fix:** Consider 403/409; leave the race unless the caps become hard guarantees (then enforce in a transaction or via a DB constraint). Out of FEAT-009 scope — bundle with the limits' own task per S-1.

---

## Alignment with the ADR

- ✅ **D1 §5** — landing replaces `/`; `page.tsx` renders instead of redirecting (`page.tsx:25-32`).
- ✅ **D1 §7/§9** — `/` handled as an exact match before the slice check (`middleware.ts:13`); the slice allowlist was not naively widened.
- ❌ **D2 §1 (SEO) / D1 §2** — the SEO endpoints are unreachable to crawlers (**B-1**); here the allowlist is *too narrow* for `/robots.txt` and `/sitemap.xml`.
- ✅ **D2 §5** — dynamic Server Component reads the cookie and server-renders the correct header; no flash, no client auth round-trip (`page.tsx:26-31`, `LandingHeader.tsx`).
- ✅ **D2 §9** — built on existing shadcn/ui primitives (`Button`, `Card`, `Badge`) and `globals.css` tokens; no new design system. SEO surface (`sitemap.ts`, `robots.ts`, `metadata`) added as required — modulo B-1. The per-route `robots: { index:false }` layers on top of robots.txt `disallow`, which is correct belt-and-suspenders (a `disallow` does not guarantee de-indexing).

---

## Test scaffold coverage

The Test Plans asked only for scaffolds; `sdlc-tests` has since filled them. Cross-reference:

- T-001: `middleware.test.ts` (4), `app/page.test.tsx` (3) — present and passing. **Gap relative to B-1:** no case asserting `/robots.txt`/`/sitemap.xml` pass through — add it as part of the B-1 fix.
- T-002: `LandingHeader.test.tsx` (3), `Hero.test.tsx` (2), plus an added `LandingPage.test.tsx` (3) for AC-2 — matches the Test Plan.
- T-003: `robots.test.ts` (3), `sitemap.test.ts` (2) — assert the pure functions' *output* but not route *reachability*; the unit tests pass while the live route would redirect, which is exactly why B-1 slipped through.

The bundled server work also added Jest specs (`auctions.service.spec.ts`, `lots.service.spec.ts`) covering the new limits — good, though out of FEAT-009 scope.

---

## Open questions for the user

- **Env interpolation (out of scope):** `.env.example` now uses nested references — `CLIENT_URL=${CLIENT_DOMAIN}:3001`, `NEXT_PUBLIC_SITE_URL=${CLIENT_URL}`, `STORAGE_PUBLIC_URL=${CLIENT_DOMAIN}:9000`. The derivation design is sound (one source of truth, storage keeps port 9000), but plain `.env` files don't always expand one variable inside another's value depending on the loader. Worth a quick check that `CLIENT_URL`/`NEXT_PUBLIC_SITE_URL` actually resolve at runtime rather than landing as literal `${CLIENT_DOMAIN}:3001` strings.
- **S-3:** is the live product flow genuinely "start, then invite", or is the landing copy wrong? Your answer decides reorder-section vs back-port-FR-4.
- **S-1:** do you want the bundled server-limit / logout / env work split into their own tasks retroactively, or is one-off bundling acceptable here?

---

## Out of scope for this review

- Deep security audit (the new server limits, logout cookie handling, env exposure) → `sdlc-security`.
- Test *logic* correctness — only scaffold/coverage shape is checked here → `sdlc-tests`.
- Diagram updates for the new `/` flow and SEO endpoints → `sdlc-docs`.
