# Feature Spec: Auction Results Page

**Feature ID:** FEAT-001-auction-results-page
**Status:** Draft
**Author:** sdlc-ba
**Created:** 2026-05-15
**Last updated:** 2026-05-15

---

## 1. Problem Statement

After an auction concludes, there is no dedicated results page showing the final outcome. The admin is left on the live control panel with no summary, members receive no post-auction closure, and the public display screen stays on the bidding UI. All auction data (lot status, sold prices, buyer names) is persisted to PostgreSQL but never surfaced to any participant, making it impossible to review results without direct database access.

## 2. Users & Stakeholders

**Primary users:**
- **Auction admin** — needs an immediate, complete view of results (sold/unsold lots, final prices, buyer names) to follow up with winners and close out the event.
- **Members (bidders)** — need to see which lots sold and at what price for closure after participating in the auction.
- **Display screen operator / public attendees** — the screen shown in the auction venue needs to switch from live bidding view to a results summary when the auction ends.

**Secondary stakeholders:**
- **Auction platform team** — needs clean, reliable state transitions between auction lifecycle states (STARTED → FINISHED) reflected in the UI.

## 3. Goals

- All connected participants (admin, members, display) automatically transition to the results view when the auction finishes — no manual refresh or navigation required.
- The results page presents: auction metadata, summary statistics, and a per-lot breakdown with status, sold price, and buyer name.
- The CRM auction detail page reflects the finished state: "Start auction" button hidden, "View results" navigation available.
- Results remain accessible at a stable URL long after the auction room is closed (no dependency on live room state in Redis).

## 4. Non-Goals

- **Per-member personalized results** (e.g. "You won this lot" highlighting) — all viewers see identical results.
- **Email notification of results** to buyers or members — separate feature.
- **PDF/CSV export** of results — deferred to v2.
- **Editing lot outcomes** after auction finishes — not in scope.
- **External webhook / real-time broadcast** of results — not in scope.

## 5. User Stories

- **US-1:** As an **admin**, I want to be automatically redirected to the results page when I finish the auction so that I can review the full summary immediately without navigating manually.
- **US-2:** As a **member**, I want to be automatically redirected to the results page when the auction ends so that I can see which lots were sold and at what price.
- **US-3:** As a **display screen operator**, I want the public display to switch to the results view when the auction finishes so that attendees in the venue see the final outcome.
- **US-4:** As an **admin reviewing an auction in the CRM**, I want the "Start auction" button hidden and a "View results" button shown when the auction is finished so that I can navigate to results without confusion.
- **US-5:** As **any viewer** of the results page, I want to see summary statistics (total lots, sold count, unsold count, total value raised) so that I can understand overall auction performance at a glance.
- **US-6:** As **any viewer** of the results page, I want to see each lot's name, final status (SOLD/UNSOLD), sold price, and buyer name so that I can review individual lot outcomes.

## 6. Functional Requirements (FR)

| ID | Requirement | Related US |
|----|-------------|------------|
| FR-1 | The server shall broadcast the `auctionFinished` WebSocket event to all connected clients (admin, members, display) in the room when the admin triggers auction completion. | US-1, US-2, US-3 |
| FR-2 | The admin room client shall automatically redirect to the results page upon receiving the `auctionFinished` event. | US-1 |
| FR-3 | The member room client shall automatically redirect to the results page upon receiving the `auctionFinished` event. | US-2 |
| FR-4 | The public display page shall transition to results view upon receiving the `auctionFinished` event. | US-3 |
| FR-5 | The results page shall be accessible at a stable URL that does not require an active room (data served from PostgreSQL, not Redis). | US-1, US-2, US-3 |
| FR-6 | The results page shall display auction metadata: auction name, date, and owner. | US-5 |
| FR-7 | The results page shall display summary statistics: total number of lots, number sold, number unsold, and total value raised (sum of all sold prices). | US-5 |
| FR-8 | The results page shall display a list of all lots with: lot name, status badge (SOLD / UNSOLD), sold price (for sold lots), and buyer name (for sold lots). | US-6 |
| FR-9 | The CRM auction detail page shall hide the "Start auction" button when the auction status is FINISHED. | US-4 |
| FR-10 | The CRM auction detail page shall display a "View results" link/button pointing to the results page when the auction status is FINISHED. | US-4 |
| FR-11 | The server shall expose a results API endpoint that returns all lots with their final status, sold price, and buyer name for a given auction ID. | US-1, US-2, US-3 |

## 7. Non-Functional Requirements (NFR)

| ID | Category | Requirement |
|----|----------|-------------|
| NFR-1 | Performance | Results page shall load in under 2 seconds; the results endpoint shall return in under 500 ms (single DB query with joins on lots and buyers). |
| NFR-2 | Accessibility | Results page UI shall meet WCAG 2.1 AA contrast and keyboard navigation requirements. |
| NFR-3 | Compatibility | Results page shall render correctly on the display screen's typical fixed viewport (e.g. 1920×1080 landscape). |

## 8. Product Tradeoffs

- **Single results page for all roles (admin, member, display):** simplifies implementation and avoids per-role page duplication; personalized member views deferred by explicit decision.
- **Results sourced from PostgreSQL, not from live room state:** ensures results are durable and accessible days after the auction — the trade-off is a backend query is required rather than reading from the room engine's in-memory state.
- **Immediate redirect on auction finish, no confirmation step:** the "Finish auction" button is already an intentional admin action; an additional confirmation before redirect would add friction without meaningful protection.

## 9. Acceptance Criteria

- [ ] **AC-1:** When admin clicks "Finish Auction" in the admin room view, the auction finishes and admin is automatically redirected to the results page.
- [ ] **AC-2:** All connected member clients receive the `auctionFinished` event and are redirected to the results page.
- [ ] **AC-3:** The public display page transitions from live bidding view to results view upon `auctionFinished` event, without requiring a page reload.
- [ ] **AC-4:** The results page displays auction name, date, and owner.
- [ ] **AC-5:** The results page displays summary statistics: total lots, sold count, unsold count, and total value raised.
- [ ] **AC-6:** The results page displays a row for each lot with: lot name, SOLD/UNSOLD status, sold price (for sold lots), and buyer name (for sold lots).
- [ ] **AC-7:** The CRM auction detail page hides the "Start auction" button and shows "View results" when auction status is FINISHED.
- [ ] **AC-8:** The results page loads correctly when accessed directly via its URL (stable link, no active room required).

## 10. Out of Scope (deferred to future versions)

- Per-member personalized results (highlighting lots the member won) — v2
- PDF/CSV export of results — v2
- Email results notification to buyers and members — separate feature
- Editing lot outcomes post-auction — not planned
- External webhook delivery of results — not planned

## 11. Open Questions

- **OQ-1:** Should buyer **email addresses** be shown on the results page, or only buyer names? Currently buyer name is confirmed; email visibility affects privacy and access control decisions.
- **OQ-2:** Should the results page require **authentication**, or be **publicly accessible** via a shareable URL? The public display screen needs to see results without auth, while buyer names are potentially sensitive.
- **OQ-3:** For the **display page transition** — does the display screen redirect to a new results URL, or does the existing `/room/[roomId]/page.tsx` render results in-place? Since the room is cleared from Redis on finish, a URL redirect requires the auctionId to be known at that moment.

## 12. References

- Room engine: `client/src/modules/room-engine/` — existing WebSocket event system to extend.
- Admin room page: `client/app/room/[roomId]/admin/page.tsx` — where the finish button lives.
- Public display page: `client/app/room/[roomId]/page.tsx` — to be updated for results transition.
- CRM auction detail: `client/app/crm/auctions/[auctionId]/page.tsx` + `StartAuction.button.tsx` — where CRM changes are needed.
- Server finish logic: `server/src/modules/room/room.service.ts` (`finishAuction`, `finishActiveLot`).
- Server gateway: `server/src/modules/room/room.gateway.ts` (`handleFinishAuction`, emits `auctionFinished`).
- Data models: `Lot` (status, soldPrice), `Buyer` (name, email), `Auction` (status: FINISHED) in `server/src/modules/`.
- ADR: to be created — technical decisions for results endpoint design and display page routing strategy.
