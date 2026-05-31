# Task T-002: Build the landing marketing sections and adaptive header

**Task ID:** T-002
**Feature:** FEAT-009-landing-page
**Status:** Todo
**Priority:** Must-have
**Depends on:** T-001

---

## 1. Context

With `/` reachable and the `isAuthenticated` flag available (T-001), this task builds the actual marketing surface: the adaptive header, hero, ordered auction-flow steps, key-capabilities section, closing CTA, and footer. It delivers the bulk of the feature's user-facing value and mirrors the approved prototype using the project's existing shadcn/ui primitives and tokens.

Related requirements: FR-2, FR-3, FR-4, FR-5, FR-6, NFR-1, NFR-2, AC-2, AC-3, AC-4

## 2. Description

Flesh out `LandingPage` with composed section components built on `@/ui-kit/ui` primitives and the OKLCH tokens / Geist Mono already in `globals.css`. The header adapts to `isAuthenticated`: anonymous visitors see Login + Register; authenticated visitors see a "Go to dashboard" control instead. The hero states the product purpose with primary "Register" and secondary "Login" CTAs; a "How an auction works" section presents the five ordered steps; a capabilities section presents the key features. All CTAs route to the correct screens. Layout is responsive and meets WCAG 2.1 AA.

## 3. Files to Touch

**Create:**
- `client/src/modules/landing/components/LandingHeader.tsx` — sticky header; adaptive CTAs from `isAuthenticated`.
- `client/src/modules/landing/components/Hero.tsx` — headline, subcopy, primary/secondary CTAs (FR-2/FR-3).
- `client/src/modules/landing/components/HowItWorks.tsx` — ordered five-step flow (FR-4).
- `client/src/modules/landing/components/Capabilities.tsx` — key-capabilities cards (FR-5).
- `client/src/modules/landing/components/ClosingCta.tsx` — closing call-to-action.
- `client/src/modules/landing/components/LandingFooter.tsx` — footer.
- `client/src/modules/landing/components/LandingHeader.test.tsx` — scaffold: header variants + CTA routes.
- `client/src/modules/landing/components/Hero.test.tsx` — scaffold: CTA routes.

**Modify:**
- `client/src/modules/landing/LandingPage.tsx` — compose the sections; pass `isAuthenticated` into the header.

**Read for context (no changes expected):**
- `docs/features/FEAT-009-landing-page/02-prototype.html` — section structure, copy, icons.
- `client/src/ui-kit/ui/{button,card,badge}.tsx` — primitives to reuse.
- `client/app/globals.css` — tokens.
- `client/src/components/AuctionPageHeader.tsx` — existing header/Link conventions.

## 4. Implementation Plan

1. Build `LandingHeader` with the brand mark and a CTA group that branches on `isAuthenticated`: anonymous → "Log in" (ghost) + "Get started"/Register (primary); authenticated → "Go to dashboard" (primary) linking to `/crm/auctions`.
2. Build `Hero` with the headline, subcopy, primary "Register" and secondary "Login" CTAs; both navigate via `next/link` / router.
3. Build `HowItWorks` as a semantic ordered list of the five steps (create auction → add lots → start → invite/QR → manage live bidding).
4. Build `Capabilities` cards (bid-from-phone, QR invites, buyers/CRM) and `ClosingCta` + `LandingFooter`.
5. Compose all sections in `LandingPage`, threading `isAuthenticated` to the header; wire CTAs so Register → registration and Login → login on `/crm/auth`.
6. Verify responsive behavior (mobile/desktop) and a11y (landmarks, heading order, focus-visible, contrast); scaffold the listed test files.

## 5. Definition of Done

The task is complete when:

- [ ] All code in "Files to Touch" is written and lints cleanly.
- [ ] Test files exist (scaffolded — actual tests filled in by `sdlc-tests`).
- [ ] No regressions in existing tests.
- [ ] Code follows existing project conventions and patterns.
- [ ] The page renders the hero, the five ordered auction-flow steps, and the key-capabilities section (AC-2).
- [ ] "Register" and "Login" each navigate to the correct screen in one click (AC-3, FR-6).
- [ ] An authenticated visitor sees a "Go to dashboard" control replacing Login/Register, landing them in the app in one click (AC-4, FR-7).
- [ ] Layout renders correctly on mobile and desktop (NFR-2) and meets WCAG 2.1 AA — landmarks, heading order, focus-visible, contrast (NFR-1).

## 6. Test Plan

**Unit tests (Vitest):**
- None beyond component-level (sections are presentational).

**Component tests (RTL):**
- `LandingHeader`: anonymous variant shows Login + Register; authenticated variant shows "Go to dashboard"; each control links to the expected route.
- `Hero`: primary CTA targets registration, secondary targets login.

**E2E tests (Playwright):**
- None — no Playwright harness in `client/`.

**Test data needs:**
- None new; render with `isAuthenticated` true/false props.

## 7. Notes & Considerations

- **Compactness exception:** parallelization gate failed (work is effectively a single sequential unit); created on user request as documentation.
- ADR D2 §9 — build with existing shadcn/ui primitives and `globals.css` tokens; no new design system.
- Prototype headline copy is flagged as a placeholder (`OPEN` comment) — keep, but it is product copy that may be refined; not a blocker.
- Registration vs login currently share `/crm/auth`; route both CTAs there per existing auth surface unless a distinct register route exists.

## 8. References

- Feature Spec: `01-feature-spec.md` (FR-2, FR-3, FR-4, FR-5, FR-6, NFR-1, NFR-2, AC-2, AC-3, AC-4)
- ADR: `03-adr.md` (Decision 2 §5/§9 adaptive header & UI conventions)
- Prototype: `02-prototype.html`
- Related tasks: T-001 (provides the route + `isAuthenticated`), T-003 (SEO surface)
