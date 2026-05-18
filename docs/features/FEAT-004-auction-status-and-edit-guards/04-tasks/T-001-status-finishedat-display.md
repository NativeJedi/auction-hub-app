# Task T-001: Show Status and finishedAt on Auction Detail Page

**Task ID:** T-001
**Feature:** FEAT-004-auction-status-and-edit-guards
**Status:** Todo
**Priority:** Must-have
**Depends on:** none

---

## 1. Context

The `/crm/auctions/[auctionId]` detail page currently renders auction metadata (name,
description, createdAt) and lifecycle buttons but shows no status badge. The server
entity carries a `finishedAt` timestamp that is set when an auction is finished, but
this field is never surfaced in the `AuctionDto` or the client type, so the UI cannot
display it.

This task covers the full data + display slice: expose the field from the server, add it
to the client type, then render both the status badge and the finishedAt date on the
detail page. It is a prerequisite for T-003, which uses the auction status on the same
page to control button states.

Related requirements: REQ-1 (status display), REQ-2 (finishedAt display)

## 2. Description

Add `finishedAt` to the server `AuctionDto` and mirror it in the client `Auction` type.
On the detail page, render the existing `<AuctionStatus>` badge (already used on the
auctions list page) and, when the auction is FINISHED, display the formatted `finishedAt`
date alongside it.

## 3. Files to Touch

**Modify:**
- `server/src/modules/auctions/dto/auction.dto.ts` — add `finishedAt: Date | null` to `AuctionDto`
- `client/src/api/dto/auction.dto.ts` — add `finishedAt: string | null` to `Auction` type
- `client/app/crm/auctions/[auctionId]/page.tsx` — render status badge and conditional finishedAt

**Read for context (no changes expected):**
- `server/src/modules/auctions/entities/auction.entity.ts` — field definition reference
- `client/app/crm/auctions/Auction.status.tsx` — existing badge component to import

## 4. Implementation Plan

1. In `server/src/modules/auctions/dto/auction.dto.ts`, add `finishedAt: Date | null` to the `AuctionDto` class. Ensure the field is included when mapping the entity to the DTO in `auctions.service.ts` (check the mapper/select statement).
2. In `client/src/api/dto/auction.dto.ts`, add `finishedAt: string | null` to the `Auction` type.
3. In `client/app/crm/auctions/[auctionId]/page.tsx`, import `AuctionStatus` from `../Auction.status.tsx` and render it next to or below the auction name.
4. Below the status badge, conditionally render the `finishedAt` date (formatted with `toLocaleDateString` or similar) only when `auction.status === AuctionStatus.FINISHED`.

## 5. Definition of Done

- [ ] All code lints cleanly.
- [ ] Test files exist (scaffolded).
- [ ] No regressions in existing tests.
- [ ] Code follows existing project conventions.
- [ ] `AuctionDto` on the server includes `finishedAt` (null for non-finished auctions).
- [ ] Client `Auction` type includes `finishedAt: string | null`.
- [ ] Status badge renders on the detail page for all three auction statuses.
- [ ] `finishedAt` date is visible on the detail page only when status is `FINISHED`.

## 6. Test Plan

**Unit tests (Vitest):**
- `auctions.service.ts` — `findOne` returns an auction with `finishedAt` populated when status is `FINISHED`; returns `null` for `finishedAt` when status is `CREATED`

**Component tests (RTL):**
- `page.tsx` renders the status badge for each `AuctionStatus` value
- `page.tsx` shows the `finishedAt` date when status is `FINISHED` and hides it otherwise

**E2E tests (Playwright):**
- None required for this task (covered by T-003 e2e flow).

**Test data needs:**
- Fixture auction objects for each status: `CREATED` (no finishedAt), `STARTED` (no finishedAt), `FINISHED` (finishedAt set)

## 7. Notes & Considerations

- The `AuctionStatus` badge component at `client/app/crm/auctions/Auction.status.tsx` already handles all three statuses — just import and pass `status`.
- The server `auctions.service.ts` mapper/select may need to explicitly include `finishedAt` if it is using a column selection — check whether the field is already fetched from the DB.
- No migration is needed: `finishedAt` already exists on the entity and DB column.

## 8. References

- Feature: FEAT-004-auction-status-and-edit-guards
- Related tasks: T-003 (consumes auction status from this task's detail page changes)
