# Feature Spec: Landing Page

**Feature ID:** FEAT-009-landing-page
**Status:** Draft
**Author:** sdlc-ba
**Created:** 2026-05-29
**Last updated:** 2026-05-29

---

## 1. Problem Statement

The app has no public entry point. A first-time visitor lands directly on auth screens with no explanation of what the product does or how an auction is run. Prospective organizers cannot understand the value or the workflow before committing to sign up.

## 2. Users & Stakeholders

**Primary users:**
- Prospective auction organizer — wants to understand the product and the run-an-auction flow before registering.
- Returning organizer — wants a fast path back into the app (login).

## 3. Goals

- A first-time visitor can explain, unprompted, what the product does and the create→invite→bid→finish flow.
- Visitors reach registration or login in one click from the landing page.

## 4. Non-Goals

- Marketing site with blog, careers, or multi-page navigation.
- Pricing, billing, or plan comparison content.

## 5. User Stories

- **US-1:** As a prospective organizer, I want to read what the product does so that I can decide if it fits my needs.
- **US-2:** As a prospective organizer, I want to see the step-by-step auction flow so that I understand how to use it before signing up.
- **US-3:** As a prospective organizer, I want to see the key capabilities so that I can judge the product's value.
- **US-4:** As a new visitor, I want a one-click path to register so that I can start creating an auction.
- **US-5:** As a returning organizer, I want a one-click path back into the app — log in, or go straight to my dashboard if I'm already signed in — so that I can resume work quickly.

## 6. Functional Requirements (FR)

| ID | Requirement | Related US |
|----|-------------|------------|
| FR-1 | The landing page shall be the public entry route of the site, shown to all visitors regardless of auth state. | US-1, US-4 |
| FR-2 | The page shall present a hero section stating the product's purpose in one headline. | US-1 |
| FR-3 | The hero shall show a primary "Register" call-to-action and a secondary "Login" action. | US-4, US-5 |
| FR-4 | The page shall present the auction flow as ordered steps: create room → add lots → invite participants → run live bidding → finish. | US-2 |
| FR-5 | The page shall present a key-capabilities section (e.g. real-time bidding, QR invites, CRM). | US-3 |
| FR-6 | "Register" shall navigate to the registration screen; "Login" shall navigate to the login screen. | US-4, US-5 |
| FR-7 | An authenticated visitor reaching the landing route shall see the landing page with a "Go to dashboard" action replacing the Login/Register controls — not a redirect. | US-5 |

## 7. Non-Functional Requirements (NFR)

| ID | Category | Requirement |
|----|----------|-------------|
| NFR-1 | Accessibility | WCAG 2.1 AA for all landing-page content and controls. |
| NFR-2 | Compatibility | Renders correctly on mobile and desktop, last 2 major versions of Chrome/Safari/Firefox. |

## 8. Acceptance Criteria

- [ ] AC-1: Visiting the public entry route as an unauthenticated user shows the landing page.
- [ ] AC-2: The page contains the hero, the ordered auction-flow steps, and the key-capabilities section.
- [ ] AC-3: "Register" and "Login" each navigate to the correct screen in one click.
- [ ] AC-4: An authenticated user visiting the landing route sees the landing page with a "Go to dashboard" action (not a redirect), and that action lands them in the app in one click.
- [ ] All FRs above are satisfied and verifiable.

## 9. Out of Scope (deferred to future versions)

- FAQ section — target: backlog.
- Participant/bidder-oriented messaging and CTA — target: backlog.
- Pricing and plan content — target: backlog.

## 10. Open Questions

- [ ] Measuring "product clarity" success is qualitative — is any analytics/event tracking expected in v1, or deferred?

## 11. References

- Related features: FEAT-007-google-sign-in, FEAT-008-email-confirmation
- Related ADRs: ADR-FEAT-009-01 (`03-adr.md`) — FR-7 revised here per its Decision 2 (adaptive header, no redirect)
