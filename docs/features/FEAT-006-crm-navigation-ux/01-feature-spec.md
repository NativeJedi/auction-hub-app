# Feature Spec: CRM Navigation UX

**Feature ID:** FEAT-006-crm-navigation-ux
**Status:** Draft
**Author:** sdlc-ba
**Created:** 2026-05-20
**Last updated:** 2026-05-20

---

## 1. Problem Statement

Authenticated auction managers navigating the CRM section (`/crm/*`) have no visual indication of where they are within the application hierarchy. Moving from the auctions list into an auction detail page provides no breadcrumb trail and no one-click way to return to the list — users must rely on the browser back button or manually edit the URL. Additionally, there is no visible logout action anywhere in the CRM, and no UI slot reserved for future language switching, making it harder to extend the product to multilingual audiences.

## 2. Users & Stakeholders

**Primary users:**
- **Auction Manager** — an authenticated user who creates and manages auctions and their lots; needs clear orientation within the CRM hierarchy and fast access to logout.

**Secondary users / stakeholders:**
- **Product team** — needs the language-switcher slot established now so that future i18n work has a defined UI anchor without requiring a CRM layout redesign.

## 3. Goals

What success looks like for this feature:

- The CRM header on every protected page provides a logout action that the user can find without hunting.
- A breadcrumb bar gives the user their exact location in the `Auctions → Auction Detail` hierarchy and lets them jump back in one click.
- A language-switcher control is visible in the CRM header, establishing the UI slot for future localisation work even though it is non-functional in v1.

## 4. Non-Goals

What this feature explicitly does **not** do:

- **i18n implementation** — no translation files, locale routing, or string extraction in this feature; the language switcher is a visual placeholder only.
- **Navigation in room pages** (`/room/*`) — room pages operate in a separate user context (admin, member, public) and have their own navigation concerns.
- **Results page navigation** (`/results/*`) — out of scope; that page already has a back link for admin users.
- **Mobile-specific navigation patterns** (hamburger menu, bottom navigation bar) — deferred; the CRM is desktop-first.

## 5. User Stories

- **US-1:** As an Auction Manager on the auction detail page, I want to see a breadcrumb showing my position in the hierarchy so that I can navigate back to the auctions list in one click without using the browser back button.
- **US-2:** As an Auction Manager, I want a logout button accessible from any CRM page so that I can end my session quickly without navigating to a dedicated settings page.
- **US-3:** As a Product stakeholder, I want a language-switcher control visible in the CRM header so that the UI slot is established and future i18n work does not require a layout redesign.

## 6. Functional Requirements (FR)

| ID | Requirement | Related US |
|----|-------------|------------|
| FR-1 | The system shall render a breadcrumb navigation bar on every protected CRM page (`/crm/auctions` and `/crm/auctions/[id]`). | US-1 |
| FR-2 | On `/crm/auctions`, the breadcrumb shall display a single non-clickable root segment labelled "Auctions". | US-1 |
| FR-3 | On `/crm/auctions/[id]`, the breadcrumb shall display two segments: a clickable "Auctions" link (navigating to `/crm/auctions`) and a non-clickable current segment showing the auction's name. | US-1 |
| FR-4 | The system shall render a Logout button in the CRM header on every protected CRM page. | US-2 |
| FR-5 | Clicking Logout shall issue a POST request to `/api/auth/logout`, clear any client-side room tokens from `localStorage`, and redirect the user to `/crm/auth`. | US-2 |
| FR-6 | The system shall render a language-switcher control (e.g. a button or dropdown labelled with the current locale, "EN") in the CRM header on every protected CRM page. The control shall be visible but non-functional in v1 (stub). | US-3 |

## 7. Non-Functional Requirements (NFR)

| ID | Category | Requirement |
|----|----------|-------------|
| NFR-1 | Accessibility | The breadcrumb shall use semantic markup: `<nav aria-label="Breadcrumb">` wrapping an `<ol>` list with `<li>` items; the current page segment shall carry `aria-current="page"`. |
| NFR-2 | Security | The logout action shall use a POST request (not a link/GET) to prevent session termination via URL prefetching or link sharing. |
| NFR-3 | Consistency | The language-switcher and logout controls shall use existing shadcn/ui primitives (Button, DropdownMenu, or Select) to remain visually consistent with the rest of the CRM. |
| NFR-4 | Compatibility | The new controls shall not break the existing `CrmHeader` prop contract; pages that pass a custom `action` slot shall continue to work unchanged. |

## 8. Product Tradeoffs

- **Language switcher as a non-functional stub in v1:** shipping a visible but inactive control allows the layout and visual language to be decided now, before the i18n investment. The alternative — hiding it until i18n is ready — risks a disruptive layout change later. Accepted risk: users may click the switcher and find it does nothing; mitigated by a tooltip or disabled state indicating "coming soon".
- **No mobile navigation in v1:** the CRM is used on desktop; building a responsive hamburger/bottom-nav now would add scope without a current user need. Deferred to a dedicated mobile pass.
- **Breadcrumbs only for the two-level CRM hierarchy:** the current CRM depth is shallow (`Auctions → Detail`); a full dynamic breadcrumb system would be over-engineered for v1.

## 9. Acceptance Criteria

The feature is considered done when:

- [ ] AC-1: On `/crm/auctions`, a breadcrumb containing exactly one segment "Auctions" is visible below the CRM header.
- [ ] AC-2: On `/crm/auctions/[id]`, a breadcrumb showing "Auctions > {auction name}" is visible; clicking "Auctions" navigates to `/crm/auctions`.
- [ ] AC-3: A Logout button is present in the CRM header on both `/crm/auctions` and `/crm/auctions/[id]`.
- [ ] AC-4: Clicking Logout ends the session on the server, clears client state, and redirects the user to `/crm/auth`; a subsequent attempt to visit `/crm/auctions` redirects back to `/crm/auth`.
- [ ] AC-5: A language-switcher control labelled "EN" is visible in the CRM header; it renders without errors and does not perform any navigation or locale change.
- [ ] All FRs above are satisfied and verifiable.
- [ ] All NFRs above are met and measured.

## 10. Out of Scope (deferred to future versions)

- Full i18n implementation (translation files, locale routing, string extraction) — target: v2 / dedicated i18n feature
- Room page navigation improvements (`/room/*`) — target: separate feature
- Mobile-responsive CRM navigation (hamburger menu, drawer) — target: backlog
- User profile / account settings accessible from the header — target: backlog

## 11. Open Questions

- [ ] **Language switcher disabled state UX:** should the control show a tooltip ("Coming soon") or simply be visually disabled? Decide before implementation; either is acceptable per product.
- [ ] **Breadcrumb placement:** rendered inside `CrmHeader` or as a separate component below it? Affects how pages need to be updated; decide in ADR or implementation kickoff.

## 12. References

- Related features: FEAT-001 (auction results page — has an existing back-link pattern in `AuctionResultsHeader`)
- Existing logout endpoint: `client/app/api/auth/logout/route.ts`
- Existing CRM header: `client/src/layouts/CrmHeader.tsx`
- Related ADRs: to be created
