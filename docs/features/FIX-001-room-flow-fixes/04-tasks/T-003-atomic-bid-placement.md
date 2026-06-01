# T-003 — Atomic bid placement

- **Task ID:** T-003
- **Feature:** FIX-001-room-flow-fixes
- **Status:** Todo
- **Priority:** Must-have
- **Depends on:** T-001

## 1. Context
`setBid` is a non-atomic read-modify-write: it reads the current top bid, computes the new amount, then `LPUSH`es. Two concurrent bids read the same baseline and both apply their increment, so raises are lost. There is also a window where a bid lands on a lot that was just closed, and `createRoom` has a check-then-act race.
Related findings: R1 (high), R2, R5.

## 2. Description
Make bid placement atomic so concurrent bids serialize correctly and a bid can never attach to an already-finished lot. Apply the same check-then-act safety to room creation.

## 3. Files to Touch
- **Modify:** `server/src/modules/room/room.repository.ts` — `setBid` (atomic compute-and-push), `createRoom` (atomic create).
- **Create:** `server/src/modules/redis/scripts/place-bid.lua` (or an inline `client.eval`) — read head, validate active lot + monotonic amount, `LPUSH` in one step.
- **Read:** `server/src/modules/redis/redis.service.ts` — Redis client access for `eval`.
- **Create:** `server/src/modules/room/room.repository.spec.ts` (extend scaffold from T-001).

## 4. Implementation Plan
1. Move the bid compute+append into a single Lua script (or `WATCH/MULTI`) keyed by `(roomId, lotId)`.
2. In the script, re-read the active lot id and reject if `bid.lotId` no longer matches.
3. Enforce strict monotonic increase (and the minimum step) inside the atomic op.
4. Use `SET NX` for room creation so a double "start" cannot overwrite a live room.
5. Add a concurrency test simulating two simultaneous bids.

## 5. Definition of Done
- [ ] Lint clean, no regressions.
- [ ] Test scaffold exists / extended for the repository.
- [ ] Two concurrent valid bids both apply (no lost increment); final top bid reflects both.
- [ ] A bid for a lot that is no longer active is rejected.
- [ ] Duplicate `createRoom` does not overwrite an existing room.

## 6. Test Plan
- **Unit (Jest):** concurrent bids serialize; stale-lot bid rejected; `createRoom` NX behavior.

## 7. Notes & Considerations
- No spec/ADR — review remediation (R1/R2/R5).
- Must run after T-001 so the "current bid" semantics are already correct before adding atomicity.

## 8. References
- Source: room-flow code review (findings R1, R2, R5).
- Predecessor: T-001.
