# T-001 — Fix lot winner selection

- **Task ID:** T-001
- **Feature:** FIX-001-room-flow-fixes
- **Status:** Todo
- **Priority:** Must-have
- **Depends on:** none

## 1. Context
The lot winner and final price are currently taken from the **lowest/first** bid instead of the highest/last. Bids are stored with `LPUSH`, so the newest (highest) bid is `bids[0]`, but `getActiveLotCurrentBid` returns `bids[length-1]` (the oldest). This silently sells every lot at its starting bid to whoever bid first.
Related findings: C1 (critical), D1, D3.

## 2. Description
Make all "current bid" reads agree on a single, correct definition — the most recent (highest) bid at `bids[0]`. After the fix, finishing a lot records the actual top bidder and amount.

## 3. Files to Touch
- **Modify:** `server/src/modules/room/room.repository.ts` — `getActiveLotCurrentBid` (return `bids[0]`, drop the dead `: bids[0]` branch), confirm `getLotCurrentBid` stays `bids[0]`.
- **Modify:** `server/src/modules/room/room.service.ts` — `finishActiveLot` (no logic change expected once repo is correct; verify it reads the top bid).
- **Read:** `server/src/modules/redis/repositories/list.repository.ts` — confirm `LPUSH` head semantics.
- **Create:** `server/src/modules/room/room.repository.spec.ts` (scaffold).

## 4. Implementation Plan
1. In `getActiveLotCurrentBid`, return `bids[0]` (or `undefined` when empty); remove the redundant ternary branch.
2. Sanity-check every caller of both "current bid" helpers uses the highest bid consistently.
3. Verify `finishActiveLot` persists `activeBid.amount` / `activeBid.name` / `activeBid.email` from the top bid.
4. Add a unit test: given several ascending bids, the winner equals the last/highest.

## 5. Definition of Done
- [ ] Lint clean, no regressions in existing room tests.
- [ ] Test scaffold exists for the repository.
- [ ] Finishing a lot records the **highest** bid as sold price + buyer.
- [ ] `getActiveLotCurrentBid` and `getLotCurrentBid` return the same bid for the same lot.
- [ ] Follows existing repository conventions.

## 6. Test Plan
- **Unit (Jest):** ascending bids → winner = max; single bid → that bid; no bids → lot unsold.

## 7. Notes & Considerations
- No spec/ADR — this is a code-review remediation; traceability is to review finding C1.
- This task must land before T-003, which rewrites the same `setBid`/bid-read area.

## 8. References
- Source: room-flow code review (findings C1, D1, D3).
- Successor: T-003 (atomic bid placement).
