# Task T-001: Build Auction Results Page

**Task ID:** T-001
**Feature:** FEAT-001-auction-results-page
**Status:** Todo
**Priority:** Must-have
**Depends on:** none

---

## 1. Context

This task delivers the public-facing results page and the server endpoint that backs it. It covers the stable-URL results surface (FR-5, FR-6, FR-7, FR-8, FR-11): a publicly accessible page at `/auctions/[auctionId]/results` showing auction metadata, summary statistics, and a per-lot breakdown — readable by anyone without authentication. Redirect/transition logic (FR-1–FR-4) and CRM status changes (FR-9–FR-10) are separate tasks.

Related requirements: FR-5, FR-6, FR-7, FR-8, FR-11, NFR-1, NFR-2, NFR-3, AC-4, AC-5, AC-6, AC-8

## 2. Description

Add a `GET /api/v1/auctions/:id/results` NestJS endpoint that returns all lots with final status, sold price, and buyer name (buyer email is intentionally excluded — public route). Build a Next.js React Server Component page at `/auctions/[auctionId]/results` that fetches this data server-side and renders it using existing components. The route must be publicly accessible — no authentication redirect — and must load correctly when opened directly via a stable URL with no active room in Redis.

## 3. Files to Touch

**Create:**
- `server/src/modules/auctions/dto/auction-results.dto.ts` — typed response DTO for the results endpoint
- `client/app/api/auctions/[auctionId]/results/route.ts` — Next.js BFF proxy forwarding to NestJS
- `client/app/auctions/[auctionId]/results/page.tsx` — RSC entry point, fetches data, renders layout
- `client/app/auctions/[auctionId]/results/components/AuctionResultsHeader.tsx` — auction name, date, owner
- `client/app/auctions/[auctionId]/results/components/ResultsStats.tsx` — total/sold/unsold/value cards
- `client/app/auctions/[auctionId]/results/components/LotResultsTable.tsx` — lot-by-lot breakdown table

**Modify:**
- `server/src/modules/auctions/auctions.service.ts` — add `getAuctionResults(auctionId)` method
- `server/src/modules/auctions/auctions.controller.ts` — register `GET /auctions/:id/results` endpoint
- `client/middleware.ts` — add `/auctions/:auctionId/results` to the public route matcher (no auth redirect)

**Read for context (no changes expected):**
- `client/app/room/[roomId]/components/RoomCard.tsx` — section wrapper pattern to reuse
- `client/src/components/StatusBadge/StatusBadge.tsx` — lot SOLD/UNSOLD badge to reuse
- `client/app/crm/auctions/[auctionId]/components/LotsList.table.tsx` — lot row rendering pattern
- `client/app/crm/auctions/[auctionId]/components/Auction.status.tsx` — status badge conventions
- `client/src/ui-kit/ui/` — shadcn/ui Table, Card, Badge primitives
- `client/src/api/auctions-api/` — server-side fetch wrapper to use for data fetching in RSC
- `server/src/modules/lots/` — Lot entity for join query reference
- `server/src/modules/buyers/` — Buyer entity for join query reference

## 4. Implementation Plan

1. **NestJS DTO** — Create `auction-results.dto.ts` with `AuctionResultsDto` (auction metadata + stats) and `LotResultDto` (id, name, status, soldPrice, buyerName). Use `class-transformer` decorators consistent with existing DTOs.

2. **NestJS service method** — Add `getAuctionResults(auctionId: string)` to `auctions.service.ts`. Execute a single TypeORM query joining `Lot` with `Buyer`, filtered by `auctionId`. Compute stats (total, sold count, unsold count, total value) in the service layer. Return `AuctionResultsDto`.

3. **NestJS controller endpoint** — Add `@Get(':id/results')` to `auctions.controller.ts`. No auth guard — public endpoint. Add `@ApiOkResponse` Swagger decorator. Delegates to service.

4. **BFF proxy route** — Create `client/app/api/auctions/[auctionId]/results/route.ts` following the same pattern as existing BFF proxies (forward to `http://localhost:3000/api/v1/auctions/:id/results`). Pass auth header if present but do not require it.

5. **Middleware update** — In `client/middleware.ts`, add `/auctions/:auctionId/results` to the public route matcher so unauthenticated users are not redirected to `/crm/auth`. Follow the existing matcher convention exactly.

6. **RSC page + components** — Build `page.tsx` as a React Server Component that calls the server-side fetcher and passes data to:
   - `AuctionResultsHeader` — renders auction name, ISO date, owner using shadcn/ui `Card`
   - `ResultsStats` — four stat cards (total lots / sold / unsold / value raised) using shadcn/ui `Card`
   - `LotResultsTable` — uses shadcn/ui `Table` + reuses `StatusBadge` with `{ SOLD: 'success', UNSOLD: 'secondary' }` mapping; mirrors column structure from `LotsList.table.tsx`

## 5. Definition of Done

- [ ] All code in "Files to Touch" is written and lints cleanly.
- [ ] Test files exist (scaffolded — actual tests filled in by `sdlc-tests`).
- [ ] No regressions in existing tests.
- [ ] Code follows existing project conventions and patterns.
- [ ] `GET /api/v1/auctions/:id/results` returns auction metadata, stats, and lot list (status, soldPrice, buyerName — no email).
- [ ] Page renders at `/auctions/[auctionId]/results` without authentication — direct URL access causes no redirect to `/crm/auth`.
- [ ] `StatusBadge` is reused for SOLD/UNSOLD lot status — no ad-hoc inline styling.
- [ ] Summary statistics are correct: sold count + unsold count = total lots; total value = sum of soldPrice for SOLD lots only (AC-5).
- [ ] Page loads in <2 seconds; endpoint responds in <500 ms on a single DB round-trip (NFR-1).
- [ ] Page renders correctly at 1920×1080 landscape (NFR-3).

## 6. Test Plan

**Unit tests (Jest — server):**
- `getAuctionResults` service method: verify stats computation (sold count, unsold count, total value) given a fixture set of lots with mixed statuses

**Component tests (RTL):**
- `LotResultsTable`: renders SOLD row with price and buyer name; renders UNSOLD row with no price and no buyer name; uses `StatusBadge` with correct variant per status
- `ResultsStats`: displays correct numeric values for each of the four stat cards

**E2E tests (Playwright):**
- Navigate to `/auctions/[auctionId]/results` without an auth session — page loads, no redirect to `/crm/auth`
- Verify auction name, summary stats, and at least one lot row are visible

**Test data needs:**
- Fixture: finished auction with 3 SOLD lots (each with a buyer record) and 1 UNSOLD lot

## 7. Notes & Considerations

- **Public route — no email exposure:** Buyer email is intentionally excluded from `LotResultDto` and the API response. The page is unauthenticated, so only `buyerName` is surfaced (OQ-1 resolved: name-only).
- **No ADR:** All choices follow existing patterns — TypeORM join query, Next.js RSC + BFF proxy, shadcn/ui primitives. No new libraries or integration shapes are introduced.
- **`StatusBadge`, not `Auction.status`:** `Auction.status.tsx` maps auction-level statuses. For lot status use `StatusBadge` directly with a `{ SOLD: 'success', UNSOLD: 'secondary' }` variant map.
- **RSC data fetching:** Use the server-side fetch wrapper from `client/src/api/auctions-api/` — not the Axios client-side instance — consistent with how CRM RSC pages fetch data.
- **Middleware:** Read `client/middleware.ts` first and extend the existing public route regex/matcher — do not introduce a second matching strategy.

## 8. References

- Feature Spec: `01-feature-spec.md`
- Prototype: `02-prototype.html` (visual layout and component references)
- No ADR (feature uses existing patterns throughout)
- Related tasks: FR-1–FR-4 redirect/transition task (not yet created), FR-9–FR-10 CRM task (not yet created)
