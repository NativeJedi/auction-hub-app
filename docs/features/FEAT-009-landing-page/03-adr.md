# ADR: Landing Page — Routing & Auth-Aware Rendering

**Feature:** FEAT-009-landing-page
**ADR ID:** ADR-FEAT-009-01
**Status:** Proposed
**Date:** 2026-05-29
**Decision makers:** sdlc-adr

---

This ADR covers two tightly coupled decisions for FEAT-009. Both concern the application's root route (`/`): Decision 1 chooses *where the landing lives* relative to the existing root redirect, and Decision 2 chooses *how it renders* given that the header must adapt to auth state without sacrificing SEO. They share the same file (`client/app/page.tsx`) and the same edge gate (`client/middleware.ts`), so splitting them into separate files would obscure their interdependency.

> **Spec conflict (must be back-ported to the spec):** `01-feature-spec.md` **FR-7** states that "an authenticated visitor reaching the landing route shall be redirected into the app." The prototype's stakeholder note (2026-05-29) and the confirmed direction for this ADR override this: the landing is shown to **everyone**, and when the visitor is authenticated the header adapts (a "Go to dashboard" action instead of Login/Register) rather than redirecting. **FR-7 should be revised via `sdlc-ba`** to describe adaptive header behavior, not a redirect, before implementation is marked complete.

---

## Decision 1 — Landing Route Placement & Root-Redirect Refactor

### 1. Context

Per FR-1, the landing page must be "the public entry route of the site for unauthenticated visitors," and per the closing CTAs (FR-3/FR-6) it must be the natural place a first-time visitor arrives and shares.

Today the root route is a pure redirect dispatcher, not a renderable page:

- [`client/app/page.tsx`](../../../client/app/page.tsx) reads the session cookie and `redirect()`s — no session → `/crm/auth`, session → `/crm/auctions`.
- [`client/middleware.ts`](../../../client/middleware.ts) gates every non-allowlisted path; `/` is **not** in `publicRoutes`, so an unauthenticated hit on `/` is bounced to `/crm/auth` at the edge *before* `page.tsx` even runs.

Introducing a landing page means deciding which URL it owns and what happens to that dispatch logic. The confirmed direction is that the landing should own `/` (the canonical, shareable URL).

### 2. Decision Drivers

- **Canonical, shareable URL** — a marketing entry point shared by word of mouth should live at the bare domain root, not a sub-path.
- **SEO / discoverability** (user-confirmed) — the indexable entry point should be `/`.
- **Reuse the existing auth model** — the session-cookie + middleware allowlist is the project-wide gate (consistent with how `/crm/auth`, `/room`, `/results`, `/confirm-email` are already handled). Do not introduce a parallel mechanism.
- **Minimal blast radius (KISS)** — this is one marketing page; avoid restructuring the app's route tree.

### 3. Options Considered

#### Option A: Landing replaces `/` (relocate the dispatch)

`client/app/page.tsx` stops redirecting and renders the landing. The root path is added to the middleware allowlist so it is reachable without a session. The old "authed → `/crm/auctions`" auto-bounce is removed; authenticated users also land here and re-enter via the adaptive header (Decision 2).

**Pros:**
- Landing owns the canonical root URL — best for sharing and SEO.
- One file changes its responsibility (`page.tsx`); no new route tree.
- The "send me into the app" path becomes an explicit CTA rather than an invisible redirect — clearer for returning organizers.

**Cons:**
- The middleware allowlist uses `path.includes(slice)`; the empty/root slice cannot be added naively (it would match every path). Requires an **exact-match** rule for `/` (see §9).
- Removes the convenience auto-redirect authed users got at `/` — a deliberate behavioral change (the FR-7 resolution).

**Estimated effort:** ~0.5 day (rewrite `page.tsx`, adjust one middleware rule).

#### Option B: Dedicated landing route (e.g. `/welcome` or a `(marketing)` group)

`/` keeps its redirect-dispatcher role; the landing renders at a separate path added to the allowlist.

**Pros:**
- Zero change to existing root-redirect behavior — lowest risk to current auth flow.
- The marketing surface is cleanly isolated from the app shell.

**Cons:**
- The marketing page does **not** own the root URL — visitors typing the bare domain still hit a redirect, defeating FR-1's "public entry route" intent and weakening SEO/shareability.
- Two "entry" concepts (`/` dispatch + `/welcome` marketing) is more surface to reason about, not less.

**Estimated effort:** ~0.5 day.

#### Option C: Status quo — no landing route; link to it from the auth screen

Keep `/` as the dispatcher; surface marketing copy only as a section on `/crm/auth`.

**Pros:**
- No routing or middleware change at all.

**Cons:**
- Fails FR-1 (no public entry route) and FR-2/FR-4/FR-5 (no hero / flow / capabilities surface). Effectively does not deliver the feature.
- A first-time visitor still lands on an auth form with no context.

**Estimated effort:** n/a — does not satisfy the spec; listed as the honest do-nothing baseline.

### 4. Comparison

| Criterion | Option A (replace `/`) | Option B (dedicated route) | Option C (status quo) |
|-----------|------------------------|----------------------------|-----------------------|
| Owns canonical root URL | Yes | No | n/a |
| SEO / shareability | Strong | Weak | None |
| Satisfies FR-1 | Yes | Partially | No |
| Risk to existing auth flow | Low | Lowest | None |
| Route-tree complexity added | None | One route | None |

### 5. Decision

**Chosen option: A — landing replaces `/`.**

**Rationale:** The *canonical-URL* and *SEO* drivers are decisive: FR-1 calls the landing "the public entry route," which means the bare domain root. Option B's lower risk does not outweigh leaving the root as a redirect that a shared link or a crawler hits first. Option C is the do-nothing baseline and does not deliver the feature. The cost — an exact-match fix in middleware and the removal of the authed auto-bounce — is small and bounded, and the auto-bounce removal is exactly the FR-7 resolution this ADR exists to record.

### 6. Tradeoffs

**Gained:**
- A single, canonical, shareable, indexable entry point at `/`.
- The "into the app" path becomes an explicit, visible action rather than a silent redirect.

**Sacrificed:**
- The convenience auto-redirect that previously took an authenticated visitor straight from `/` to `/crm/auctions`. Returning organizers now click "Go to dashboard" (one extra interaction) — accepted per the stakeholder direction.

### 7. Known Limitations

- The middleware's `publicRoutes.some(slice => path.includes(slice))` check cannot express "root only" — `/` must be handled as an exact match (`path === '/'`), not appended to the slice list, or it will whitelist the entire site. This is a real edit, not a config tweak.
- Deep-link redirect-after-login (`?from=`) is unaffected, but the root no longer participates in that flow — acceptable, since `/` is now a destination, not a gate.

### 8. Future Optimization Opportunities

- **Route group for a growing marketing surface** — when the deferred FAQ / pricing / bidder-messaging pages (spec §9) arrive, introduce a `(marketing)` route group with a shared layout so they share header/footer with the landing. Trigger: second public marketing page.

### 9. Consequences

**For the codebase:**
- [`client/app/page.tsx`](../../../client/app/page.tsx) changes from a redirect-only Server Component to one that renders the landing (see Decision 2 for the render strategy).
- [`client/middleware.ts`](../../../client/middleware.ts) gains an exact-match allow for `/` — e.g. `path === '/'` returns `NextResponse.next()` before the slice-based `publicRoutes` check, so the root is never gated.
- The `redirect('/crm/auctions')` / `redirect('/crm/auth')` dispatch is deleted from the root.

**For operations:** none — no new infra.

**For testing:** add coverage that an unauthenticated request to `/` returns the landing (not a 307 to `/crm/auth`), and that other protected routes still redirect when unauthenticated (guard against the `/` exact-match accidentally widening the allowlist).

### 10. References

- Feature Spec: [`01-feature-spec.md`](01-feature-spec.md) (FR-1, FR-2, FR-6, FR-7)
- Prototype: [`02-prototype.html`](02-prototype.html)
- See also: Decision 2 (below) — rendering strategy depends on this placement.
- Related ADRs: [`FEAT-007-google-sign-in/03-adr.md`](../FEAT-007-google-sign-in/03-adr.md), [`FEAT-008-email-confirmation/03-adr.md`](../FEAT-008-email-confirmation/03-adr.md) (session/cookie auth model these reuse).

---

## Decision 2 — Auth-Aware Rendering Strategy

### 1. Context

Per the confirmed FR-7 resolution, the landing is shown to everyone and the header **adapts to auth state**: Login/Register for anonymous visitors, "Go to dashboard" for authenticated ones. Per the user-confirmed SEO driver, the page must also be crawlable and fast.

These two pull in opposite directions. Auth state lives in the session cookie (`SESSION_COOKIE_NAME`, read server-side via `cookies()` everywhere in this codebase). A *fully static* page cannot read that cookie at request time, so it cannot adapt the header server-side — yet adapting the header is now a requirement, and doing it after hydration risks a visible flash of the wrong CTAs. The decision is *where* the auth read happens.

### 2. Decision Drivers

- **Correct first paint / no flash** — an authenticated visitor must not briefly see Login/Register before a client swap (UX + avoids layout shift for NFR-1 a11y).
- **SEO / crawlability** (user-confirmed) — an unauthenticated crawler (no cookie) must receive the full marketing content with the public CTAs, server-rendered.
- **Reuse the existing session read** — `cookies()` + `SESSION_COOKIE_NAME` is the established pattern; the session cookie is server-only (httpOnly), so the client cannot read it directly.
- **Simplicity (KISS)** — prefer the option with the fewest moving parts and no new cross-cutting state.

### 3. Options Considered

#### Option A: Dynamic Server Component reads the cookie and renders the correct header

`page.tsx` stays a Server Component, calls `cookies()`, and server-renders Login/Register when no session is present, "Go to dashboard" when it is. The route becomes dynamic (rendered per request) rather than statically cached.

**Pros:**
- No flash — the correct header is in the initial HTML.
- Crawlers send no session cookie, so they receive the public variant with full marketing content — ideal for SEO.
- Reuses the exact `cookies()` + `SESSION_COOKIE_NAME` read already used by `page.tsx` and `middleware.ts`. No new state, no client JS for auth.

**Cons:**
- The route is no longer statically cached — every request runs a (cheap) cookie read + static JSX render. Negligible at this app's scale; cacheable later (§8).

**Estimated effort:** ~0.5 day.

#### Option B: Static page + client-side auth detection (post-hydration swap)

Render the page statically with the anonymous header, then a Client Component detects auth after hydration and swaps to "Go to dashboard." Because the session cookie is httpOnly, detection requires an API round-trip (e.g. a `/api/me` call).

**Pros:**
- The page itself stays statically cacheable / CDN-friendly.

**Cons:**
- **Flash of wrong header** for authenticated users until the API call resolves — fails the no-flash driver and causes layout shift.
- Adds a client-side fetch, a loading state, and an endpoint dependency for a one-line header difference — violates KISS.

**Estimated effort:** ~1 day.

#### Option C: Static page + a non-httpOnly "hint" cookie read on the client

Set a lightweight, client-readable `has_session` cookie at login alongside the httpOnly session cookie; a Client Component reads it synchronously to pick the header, keeping the page static.

**Pros:**
- Static page, and no API round-trip (the hint is readable synchronously, minimizing flash).

**Cons:**
- Introduces a **second cookie** and a change to the login/logout flow to keep it in sync — new cross-cutting state and a desync risk (hint says authed, session expired).
- A client-readable auth hint is a small new surface to reason about for marginal benefit over Option A.

**Estimated effort:** ~1 day (touches the auth flow, out of this feature's natural scope).

### 4. Comparison

| Criterion | Option A (dynamic RSC) | Option B (client + API) | Option C (hint cookie) |
|-----------|------------------------|-------------------------|------------------------|
| Flash of wrong header | None | Yes | Minimal |
| SEO (full server-rendered content for crawler) | Yes | Yes | Yes |
| Reuses existing session read | Yes | No (new endpoint) | No (new cookie) |
| New cross-cutting state | None | Loading state | Second cookie + flow change |
| Statically cacheable | No (dynamic) | Yes | Yes |
| Simplicity | Highest | Low | Low |

### 5. Decision

**Chosen option: A — dynamic Server Component reading the session cookie.**

**Rationale:** The *no-flash* and *reuse-existing-session-read* drivers are decisive. Option A delivers the correct header in the first byte for both audiences and reuses the established `cookies()` pattern with zero new state. SEO is fully preserved because an anonymous crawler (no cookie) gets the complete server-rendered marketing page with public CTAs. The only thing sacrificed — static caching of the route — is the *least* important driver here given the app's scale, and it is recoverable later (§8) without changing the component model. Options B and C buy back static caching at the cost of a flash, an extra round-trip or cookie, and a violation of KISS.

### 6. Tradeoffs

**Gained:**
- Correct, flicker-free header on first paint for every visitor.
- Single source of auth truth (the existing httpOnly session cookie); no client auth logic.

**Sacrificed:**
- Full static caching of `/`. The page now renders per request (a cookie read + static JSX) — cheap, but no longer a pure CDN asset.

### 7. Known Limitations

- The route opts out of static optimization by reading `cookies()`; Next.js will mark it dynamic. This is intended, not a regression.
- The page reflects auth state only at request time; if a session expires while the page is open, the header is not live-updated. Acceptable for a static marketing surface.

### 8. Future Optimization Opportunities

- **Cache the anonymous variant** — when landing traffic grows, serve a cached/ISR version of the no-cookie variant from the CDN and only render dynamically when a session cookie is present. Trigger: landing becomes a measurable share of traffic. Lift: near-static delivery for the common (anonymous) case with no component rewrite.
- **Analytics/event tracking** — the spec's Open Question (§10) about measuring "product clarity" can be answered by adding event tracking to the CTAs here; deferred until a v1 metric is chosen.

### 9. Consequences

**For the codebase:**
- [`client/app/page.tsx`](../../../client/app/page.tsx) is a Server Component that reads `SESSION_COOKIE_NAME` via `cookies()` and passes an `isAuthenticated` boolean into the landing's header.
- Landing UI is built with the existing shadcn/ui primitives and the OKLCH tokens / Geist Mono already in [`client/app/globals.css`](../../../client/app/globals.css) — mirroring the prototype; no new design system.
- Add SEO surface that does not exist today: `app/sitemap.ts`, `app/robots.ts`, and `generateMetadata` on the landing for title/description/Open Graph.

**For operations:** none — no new infra; one route shifts from static to dynamic rendering.

**For testing:** unit/component coverage for both header variants (authenticated → "Go to dashboard"; anonymous → Login/Register), and that both CTAs route to `/crm/auth` (AC-3). Accessibility check for the landing per NFR-1.

### 10. References

- Feature Spec: [`01-feature-spec.md`](01-feature-spec.md) (FR-3, FR-7, NFR-1, NFR-2; Open Question §10)
- Prototype: [`02-prototype.html`](02-prototype.html) (header adapt note, lines 7–9)
- See also: Decision 1 (above) — this strategy assumes the landing owns `/`.
- Related ADRs: [`FEAT-007-google-sign-in/03-adr.md`](../FEAT-007-google-sign-in/03-adr.md) (session-cookie auth model reused here).
