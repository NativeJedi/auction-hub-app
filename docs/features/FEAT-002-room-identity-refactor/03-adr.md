# ADR: Room Identity Key Strategy

**Feature:** FEAT-002-room-identity-refactor
**ADR ID:** ADR-FEAT-002-01
**Status:** Proposed
**Date:** 2026-05-16
**Decision makers:** sdlc-adr

---

## 1. Context

The platform currently creates a live auction room by generating a random UUID (`roomId`), storing all room state in Redis under `room:{roomId}:*`, and persisting that UUID in the `auction.roomId` PostgreSQL column. This design introduces an unnecessary indirection: to access a room, every caller must first read `auction.roomId` from the database to discover the Redis key, then perform the Redis lookup. The UUID itself carries no domain meaning — the natural room identity is already the `auctionId`.

The approach also allows multiple room instances to exist for the same auction across restart cycles. After a reset, `auction.roomId` is cleared in the DB but no Redis cleanup is performed, meaning a stale room at the old key can silently linger. The `createRoom()` guard depends on `auction.roomId !== null` (a DB read), so any staleness window between the DB write and the Redis state creates an inconsistency vector.

This ADR decides how to key rooms in Redis and, consequently, whether to retain the `roomId` column in the `auction` table.

> **Assumption:** No feature spec exists for this refactor. Decisions are based on direct analysis of the current codebase (`room.service.ts`, `room.gateway.ts`, `auction.entity.ts`, `room.repository.ts`) and the stated requirements: 1:1 auction-to-room semantic, Redis-first existence check, clean reset behavior.

## 2. Decision Drivers

1. **Semantic correctness** — "the room for auction X" should be derivable from `auctionId` alone, without a DB lookup; the current UUID has no domain meaning beyond being a Redis key.
2. **Idempotent start flow** — `createRoom()` must check Redis as the source of truth; stale `auction.roomId` in the DB must not be able to produce phantom rooms or ghost errors.
3. **Reset correctness** — `resetAuction()` must fully clean up the prior room so that re-starting is always safe; the current design leaves Redis state orphaned on reset.
4. **Reduced DB coupling** — room lifecycle operations (create, finish, clear) should not require reading or writing a `roomId` column in PostgreSQL.
5. **Simplified token flow** — room-scoped JWTs currently carry a `roomId` payload; aligning that with `auctionId` removes a mapping step from every authenticated WebSocket operation.

## 3. Options Considered

### Option A: Status Quo + Stricter Enforcement

**Description:** Keep the randomly-generated `roomId` UUID as the room key in Redis. Add a partial unique index on `auction` (`auctionId` WHERE `status = 'started'`) and a DB-level constraint to ensure only one active room exists per auction. Fix the `resetAuction()` bug by explicitly clearing Redis on reset using the stored `roomId`.

**Pros:**
- No Redis key migration; existing room data is unaffected during the transition.
- `roomId` opacity protects room URLs from being guessable (minor security benefit).
- Incremental change — only adds a constraint and a bug fix, does not rename anything.

**Cons:**
- The DB is still the source of truth for room existence; race conditions between DB write and Redis state persist.
- `roomId` column in `auction` remains load-bearing, so every `createRoom()` still requires a DB write and every existence check still requires a DB read.
- Semantic problem is unresolved: the room identity remains an opaque UUID unrelated to the domain concept.
- `resetAuction()` fix requires knowing the old `roomId` at reset time (one extra DB read before clearing).

**Estimated effort:** ~1 day (constraint migration + one bug fix).

---

### Option B: auctionId as Room Key ✓ chosen

**Description:** Eliminate the generated `roomId` UUID entirely. Store all room data in Redis under `room:{auctionId}:*`. The `auction.roomId` column is dropped from PostgreSQL. Room existence is checked directly in Redis (`EXISTS room:{auctionId}:rooms`). The `Room.id` field is set to `auctionId`. JWT room tokens carry `auctionId` instead of `roomId`. `resetAuction()` deletes `room:{auctionId}:*` from Redis before resetting DB state.

**Pros:**
- Single source of truth: Redis is authoritative for room existence; no DB read required to find or validate a room.
- No indirection: any code that knows `auctionId` can address the room directly.
- `resetAuction()` becomes atomic: clear Redis + reset DB in one operation, no lookup step.
- Removes `roomId` column from `auction` table, simplifying the schema.
- WebSocket tokens are directly tied to the auction domain object.

**Cons:**
- All Redis keys, pub/sub channel names, JWT payloads, and client-side localStorage keys must be renamed — a broad but mechanical refactor.
- `auctionId` is a known (non-secret) identifier; room keys are now predictable. This is acceptable in a private/authenticated platform but would be a concern in a public system.
- No per-session history in Redis: if an auction is run twice (reset + re-start), the first session's Redis data is gone. (Postgres records for lots/buyers are unaffected.)

**Estimated effort:** ~3–4 days (rename across server + client, migration, token changes).

---

### Option C: Versioned Composite Key

**Description:** Store rooms under `room:{auctionId}:{sessionVersion}:*` where `sessionVersion` is an integer incremented on each reset (stored in `auction.sessionVersion` column). This allows reading current and historical sessions from Redis, and preserves per-run bidding history beyond the TTL.

**Pros:**
- Per-session Redis snapshots survive resets; useful for audit or replay.
- Multiple historical rooms can coexist without overwriting each other.

**Cons:**
- Introduces `sessionVersion` as a new DB column and a new concept in every caller — significantly higher complexity than Option B.
- Redis TTL still expires old sessions; historical data is not reliably durable. If auditability is needed, the correct place is PostgreSQL, not Redis.
- All the same rename work as Option B, plus version tracking everywhere.
- Overkill for the stated goal: the requirement is 1:1 semantics, not session history.

**Estimated effort:** ~5–7 days.

---

## 4. Comparison

| Criterion | A: Status quo + index | B: auctionId key | C: Versioned key |
|---|---|---|---|
| Removes DB coupling from room lifecycle | No | **Yes** | Partial |
| Redis as single source of truth | No | **Yes** | Yes |
| Reset correctness (atomic) | Partial (still needs roomId lookup) | **Yes** | Yes |
| Rename scope | Minimal | Medium (mechanical) | Large |
| Schema simplification | No | **Yes** (drops column) | No (adds column) |
| Semantic clarity | No change | **Yes** | Partial |
| Historical room data in Redis | No | No | Yes (but not durable) |

---

## 5. Decision

**Chosen option:** B — auctionId as room key

**Rationale:** The top three drivers — semantic correctness, idempotent start flow, and reset correctness — are all fully satisfied only by Option B. Option A leaves the DB as the authoritative source for room existence and does not fix the fundamental indirection. Option C solves the same problem as B but adds versioning complexity that is not justified by any stated requirement; per-session auditability is already covered by the PostgreSQL records for lots and buyers. The rename work in Option B is broad but entirely mechanical: every change is a find-and-replace of `roomId` → `auctionId` in a well-defined set of files. The auctionId-predictability tradeoff (con of B) is acceptable because room access is already guarded by authenticated JWT tokens.

Deprioritized: session history in Redis (Option C's main advantage) — not a stated requirement; if needed later it belongs in PostgreSQL.

---

## 6. Tradeoffs

**Gained:**
- Room lookup requires no DB read — `auctionId` is sufficient to address any room data directly.
- `createRoom()` and `resetAuction()` are fully decoupled from the `auction.roomId` column; room lifecycle is managed entirely in Redis.
- `auction` table schema is simpler (one fewer nullable column with no FK semantics).
- Token validation in the WebSocket gateway no longer needs to map `roomId` back to an `auctionId` for any downstream operation.

**Sacrificed:**
- Per-run Redis history: after a reset and re-start, the previous session's Redis data is overwritten. Bids and lot outcomes are still preserved in PostgreSQL; only the ephemeral Redis state is lost.
- The opacity of a random UUID is gone: room Redis keys are now guessable from the `auctionId`. Acceptable behind auth, but worth noting.
- A one-time migration cost: JWT secret rotation may be needed if the token `sub`/payload shape changes (depends on whether existing issued tokens need to be invalidated).

---

## 7. Known Limitations

- **No room session versioning.** This decision does not support querying "what was the state of the room during auction X's second run". If that becomes a requirement, a new ADR is needed.
- **In-flight rooms at migration time.** Any rooms in Redis at the time of deployment will use the old `room:{uuid}:*` key format and will be unreachable after the rename. A maintenance window or deployment drain is required.
- **auctionId is now the WebSocket room namespace.** If two concurrent Socket.IO servers publish to `room:{auctionId}` without Redis pub/sub, they will desync. This is already handled by the existing Redis pub/sub fanout in `RoomGateway` — no new risk introduced, but the channel name changes.

---

## 8. Future Optimization Opportunities

- **Per-run audit log** — if regulators or operators need a history of who bid what in each run of an auction, add a `auction_run` table in PostgreSQL with a `runNumber` FK, and populate it from `completeAuction()`. Redis remains ephemeral; durability moves to Postgres where it belongs.
- **Room TTL based on auction schedule** — currently TTL is a static config value (`JWT_ROOM_TTL`). When auction scheduling is introduced, set the Redis TTL to `scheduledEndTime + buffer`, preventing premature expiry on long auctions.
- **Distributed lock on `createRoom()`** — if horizontal scaling to multiple NestJS instances is needed, replace the current single-Redis-check with a `SET room:{auctionId}:lock NX EX 10` guard to prevent a race condition where two instances both pass the existence check simultaneously.

---

## 9. Consequences

**For the codebase:**
- `room.repository.ts` (or equivalent Redis repository): change all key namespace constructors from `room:{roomId}` to `room:{auctionId}`.
- `room.service.ts`: `createRoom()` checks `EXISTS room:{auctionId}:rooms` in Redis instead of `auction.roomId !== null`; `completeAuction()` no longer calls `auctionsService.startAuction(auctionId, roomId)`.
- `room.gateway.ts`: pub/sub channel subscription strings `room:{roomId}` and `room:{roomId}:{userId}` become `room:{auctionId}` and `room:{auctionId}:{userId}`; token payload field renamed.
- `auction.entity.ts`: remove `roomId` field; update `AuctionDto` and any serialization that references it.
- `auctions.service.ts`: `startAuction()` no longer accepts or writes `roomId`; `resetAuction()` receives `auctionId` and calls `roomRepository.clearRoom(auctionId)` before resetting DB state.
- Auth / token service: rename `roomId` to `auctionId` in the room JWT payload interface; update guards and extractors.
- New migration: `DROP COLUMN "roomId" FROM "auction"`.
- Client `room.dto.ts`: `Room.id` now equals `auctionId`; update all `roomId`-keyed localStorage reads/writes to use `auctionId`.
- Client room-engine (`RoomEngine.ts`, `AdminRoomEngine.ts`, `MemberRoomEngine.ts`): update socket connection params and token storage key.

**For the team:**
- The concept of "roomId" is eliminated from the vocabulary. All code, comments, and documentation should use `auctionId` when referring to the live session.

**For operations:**
- Deployment requires a maintenance window: active rooms at deploy time will be unreachable under the new key scheme. Drain in-flight auctions before deploying, or accept that running auctions must be restarted.
- No new infrastructure required; Redis and PostgreSQL are unchanged.

**For testing:**
- Unit tests for `RoomService` and `RoomGateway` that assert on Redis key patterns must be updated.
- E2E test: start auction → verify Redis key is `room:{auctionId}:rooms` → finish → verify key is deleted → reset → verify clean re-start is possible.
- Existing Testcontainers e2e suite (`npm run test:e2e` in `/server`) should cover the DB migration path.

---

## 10. References

- No Feature Spec exists for this refactor (preemptive architectural decision; see §1 assumption note).
- Codebase analysed: `server/src/modules/room/`, `server/src/modules/auctions/`, `server/src/migrations/1774366665437-Auto.ts`, `client/src/modules/room-engine/`, `client/src/api/dto/room.dto.ts`.
- Related ADRs: none (first ADR for this project; FEAT-001 has no ADR on file).
