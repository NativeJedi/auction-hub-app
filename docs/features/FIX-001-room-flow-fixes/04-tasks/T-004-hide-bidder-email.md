# T-004 — Hide bidder email in WS broadcast

- **Task ID:** T-004
- **Feature:** FIX-001-room-flow-fixes
- **Status:** Todo
- **Priority:** Must-have
- **Depends on:** none

## 1. Context
`handleBid` publishes the full `BidDto` (including `email`) to the whole room channel — there is even a `// TODO: hide email for members channel`. Every participant receives every bidder's email. The REST path already strips email; the WS path does not.
Related findings: S1 (high, PII leak).

## 2. Description
Broadcast only public bid fields (`id`, `userId`, `name`, `amount`) over the room socket channel, so member emails never leave the server.

## 3. Files to Touch
- **Modify:** `server/src/modules/room/room.gateway.ts` — map the bid to a public shape before `publishRoomEvent('newBid', …)`.
- **Modify:** `server/src/modules/room/dto/bid.dto.ts` — add/confirm a `PublicBidDto` (omit `email`).
- **Read:** `server/src/modules/room/room.service.ts` — `placeBid` return shape.
- **Create:** `server/src/modules/room/room.gateway.spec.ts` (scaffold).

## 4. Implementation Plan
1. Define a `PublicBidDto` with `id`, `userId`, `name`, `amount`.
2. In `handleBid`, project the new bid to `PublicBidDto` before broadcasting.
3. Remove the obsolete TODO comment.
4. Confirm the client `newBid` type already expects the public shape.

## 5. Definition of Done
- [ ] Lint clean, no regressions.
- [ ] Test scaffold exists for the gateway.
- [ ] `newBid` payload contains no `email` field.
- [ ] Bid still shows bidder `name` and `amount` to the room.

## 6. Test Plan
- **Unit (Jest):** the broadcast payload omits `email` and keeps `name`/`amount`/`userId`.

## 7. Notes & Considerations
- No spec/ADR — review remediation (S1).
- Also check any user-channel emits for the same leak.

## 8. References
- Source: room-flow code review (finding S1).
