# Task T-002: Backend Guard — Reject Edits When Auction Is Started

**Task ID:** T-002
**Feature:** FEAT-004-auction-status-and-edit-guards
**Status:** Todo
**Priority:** Must-have
**Depends on:** none

---

## 1. Context

The backend exposes `PATCH /auctions/:id` and `PATCH /auctions/:auctionId/lots/:lotId`
endpoints, as well as lot image upload/delete routes. Currently none of these check
whether the auction is in a mutable state before applying changes — an admin could
edit auction details or lot data even mid-auction, which would corrupt in-progress state.

This task adds a status guard at the service layer so that any mutation on an auction
(or its lots) that arrives when the auction is `STARTED` or `FINISHED` is rejected with
a `400 Bad Request`.

Related requirements: REQ-3 (backend guard for edit operations)

## 2. Description

Add an auction-state check to `auctions.service.ts#updateOne` and to the relevant lot
mutation methods in `lots.service.ts`. When the auction status is not `CREATED`, throw
a `BadRequestException` with a clear message before any write operation is performed.
The guard lives at the service layer so it applies regardless of which controller or
future integration path calls these methods.

## 3. Files to Touch

**Modify:**
- `server/src/modules/auctions/auctions.service.ts` — add status check at the start of `updateOne`
- `server/src/modules/lots/lots.service.ts` — add auction status check in `updateLot` and lot image operations

**Read for context (no changes expected):**
- `server/src/modules/auctions/entities/auction.entity.ts` — `AuctionStatus` enum
- `server/src/modules/lots/lots.controller.ts` — route surface to confirm which operations need guarding
- `server/src/modules/room/room.service.ts` — reference for how existing state guards are phrased

## 4. Implementation Plan

1. In `auctions.service.ts#updateOne`, immediately after loading the existing auction (before the `preload`/`save` call), check `if (auction.status !== AuctionStatus.CREATED)` and throw `new BadRequestException('Auction cannot be edited after it has started')`.
2. In `lots.service.ts`, identify all methods that write to a lot: `updateLot` and any image upload/delete helpers. For each, fetch the parent auction status (either via `AuctionsService.findOne` or a direct repository call using `auctionId`). Throw `new BadRequestException('Auction cannot be edited after it has started')` if status is not `CREATED`.
3. Ensure no circular dependency is introduced if `LotsService` references `AuctionsService` — use the existing repository or inject `AuctionsService` via `forwardRef` if needed.
4. Verify the error message is consistent across both services.

## 5. Definition of Done

- [ ] All code lints cleanly.
- [ ] Test files exist (scaffolded).
- [ ] No regressions in existing tests.
- [ ] Code follows existing project conventions.
- [ ] `PATCH /auctions/:id` returns `400` when auction status is `STARTED` or `FINISHED`.
- [ ] `PATCH /auctions/:auctionId/lots/:lotId` returns `400` when auction status is `STARTED` or `FINISHED`.
- [ ] Lot image upload/delete operations return `400` under the same condition.
- [ ] All three endpoints remain fully functional for `CREATED` auctions.
- [ ] Error response body contains a clear, human-readable message.

## 6. Test Plan

**Unit tests (Vitest):**
- `auctions.service.ts#updateOne` — throws `BadRequestException` when auction is `STARTED`; throws when `FINISHED`; succeeds when `CREATED`
- `lots.service.ts#updateLot` — throws `BadRequestException` when parent auction is `STARTED` or `FINISHED`; succeeds when `CREATED`

**Component tests (RTL):**
- None (backend-only task).

**E2E tests (Playwright):**
- None required (unit coverage sufficient for guard logic).

**Test data needs:**
- Mock auction entities in each status for service unit tests

## 7. Notes & Considerations

- `room.service.ts` already has examples of status guards (`finishAuction`, `resetAuction`) — follow the same `BadRequestException` pattern for consistency.
- The `lots.service.ts` currently calls `this.findLot(userId, auctionId, lotId)` which loads the lot. The auction status is not yet fetched there — you'll need an additional load or join.
- If `LotsService` does not already inject `AuctionsService`, check for circular dependency risk before injecting. An alternative is a direct `auctionsRepository` query for just the status field to keep it lightweight.
- Do not add the guard to state-transition methods (`startAuction`, `finishAuction`, `resetAuction`) — those are already protected by `RoomService` logic.

## 8. References

- Feature: FEAT-004-auction-status-and-edit-guards
- Related tasks: T-003 (frontend complement to this guard)
- Pattern reference: `server/src/modules/room/room.service.ts` — `finishAuction` and `resetAuction` status checks
