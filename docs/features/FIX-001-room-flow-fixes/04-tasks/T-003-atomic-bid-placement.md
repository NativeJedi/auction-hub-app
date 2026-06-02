# T-003 — Atomic bid placement

- **Task ID:** T-003
- **Feature:** FIX-001-room-flow-fixes
- **Status:** Todo
- **Priority:** Must-have
- **Depends on:** T-001

## 1. Context
`setBid` is a non-atomic read-modify-write: it reads the current top bid, derives `currentBid.amount + increment`, then `LPUSH`es. The client sends an *increment* computed from the price it last saw, so under concurrency two interleaved bids can (a) inflate a bidder past the amount they consented to and (b) leave the list in an order where the last-pushed `bids[0]` is not the highest — which corrupts the leader and the lot winner / sold price read in `room.service.ts`. This is an in-person, admin-led auction: bids are a faithful, consistently-ordered record and the admin announces the winner. The fix is to send the absolute price, store it as-is, and keep the bid collection consistently ordered with a Redis Sorted Set (atomic `ZADD`, no lost bids, no Lua). `createRoom` also has a check-then-act race.
Related findings: R1 (high), R2, R5.

## 2. Description
Make bid placement correct and consistent under concurrency. The client sends the absolute target price (current leading + chosen increment). The server stores it as-is in a Redis Sorted Set scored by amount, so the collection is always ordered and the highest bid (leader / winner) is always correct regardless of arrival order. The only amount validation is non-negative (already enforced by `@IsPositive`). Keep the active-lot guard so a bid cannot attach to a closed lot, and make room creation atomic via SET NX.

## 3. Files to Touch
- **Create:** `server/src/modules/redis/repositories/sorted-set.repository.ts` — `RedisSortedSetRepository<T>` (`add`/`getAllDesc`/`clear`), mirroring `list.repository.ts`.
- **Modify:** `server/src/modules/redis/redis.service.ts` — add `createSortedSetRepository<T>` factory.
- **Modify:** `server/src/modules/room/room.repository.ts` — `bids` → sorted set; `setBid` stores absolute `bid.amount` via `ZADD` (no derivation); `getLotBids` reads descending; `createRoom` atomic `SET … NX EX`.
- **Modify:** `server/src/modules/room/dto/bid.dto.ts` — `amount` doc → absolute price (validators unchanged).
- **Create:** `client/src/modules/room-engine/core/sortBids.ts` — `sortBidsByAmountDesc` helper.
- **Modify:** `client/src/modules/room-engine/member/MemberRoomEngine.ts` — `placeBid` sends absolute amount; `newBid` keeps list sorted desc.
- **Modify:** `client/src/modules/room-engine/admin/AdminRoomEngine.ts`, `client/src/modules/room-engine/public/PublicRoomEngine.ts` — `newBid` keeps list sorted desc.
- **Read:** `server/src/modules/redis/repositories/list.repository.ts`, `server/src/modules/room/room.service.ts`.
- **Create/Extend:** `server/src/modules/room/room.repository.spec.ts`, `server/src/modules/redis/repositories/sorted-set.repository.spec.ts`, `client/src/modules/room-engine/member/MemberRoomEngine.test.ts`, `client/src/modules/room-engine/core/sortBids.test.ts`.

## 4. Implementation Plan
1. Add `RedisSortedSetRepository<T>` (`add(key,item,score)` → `ZADD` + `EXPIRE`; `getAllDesc(key)` → `ZREVRANGE 0 -1` + parse; `clear(key)` → `DEL`) and the `createSortedSetRepository` factory.
2. In `RoomRepository`, back `bids` with the sorted set; `getLotBids` returns highest-first; `getLotCurrentBid`/`getActiveLotCurrentBid` keep `bids[0]` (now the true highest).
3. Rewrite `setBid`: keep active-lot guard; store `amount: bid.amount` via `bids.add(key, newBid, newBid.amount)`; no `current + increment`, no below-leading rejection.
4. Keep `createRoom` atomic via `SET … NX EX`; throw `ConflictException` when the key exists.
5. Add `sortBidsByAmountDesc`; client `placeBid` emits `{ amount: leadingAmount + bidIncrement, lotId }`; member/admin/public `newBid` handlers insert via the helper to stay sorted.
6. Update the `amount` DTO doc to absolute price.
7. Scaffold/extend the test files (it.todo only).

## 5. Definition of Done
- [ ] Lint clean (client + server), no regressions.
- [ ] Test scaffolds exist/extended for the repository, the sorted-set repo, the member engine, and the sort helper.
- [ ] Client `placeBid` sends the absolute target amount, not the increment.
- [ ] Server stores the absolute amount as-sent (no server-side derivation).
- [ ] Bids are stored in a sorted set; reads return highest-first.
- [ ] Two concurrent valid bids are both recorded and the highest is correctly the leader.
- [ ] A bid for a lot that is no longer active is rejected.
- [ ] Duplicate `createRoom` does not overwrite an existing room.

## 6. Test Plan
- **Unit (Jest, server):** `setBid` stores absolute amount via `ZADD`; `getLotBids`/`getLotCurrentBid` return highest-first; `createRoom` NX; sorted-set repo `add`/`getAllDesc`/`clear`.
- **Unit (Vitest, client):** `placeBid` emits `{ amount: leadingAmount + bidIncrement, lotId }`; `newBid` keeps the list sorted desc; `sortBidsByAmountDesc` sorts descending.

## 7. Notes & Considerations
- No spec/ADR — review remediation (R1/R2/R5). Consistency comes from the Redis Sorted Set (atomic `ZADD`), **not** from a Lua script (an earlier draft proposed `redis/scripts/place-bid.lua`; dropped as over-engineering).
- DTO semantics change: `CreateBidDto.amount` now means the **absolute** price, not an increment. Only `setBid` consumes it server-side.
- ZSET orders ties (equal amounts) lexicographically, not by time — "who reached the top amount first" is not preserved; the live admin reconciles ties.
- Display order becomes amount-ranked (highest first) rather than chronological — intended for the consistent list.
- Must run after T-001 (leading-bid getter the client reads).

## 8. References
- Source: room-flow code review (findings R1, R2, R5).
- Predecessor: T-001.
