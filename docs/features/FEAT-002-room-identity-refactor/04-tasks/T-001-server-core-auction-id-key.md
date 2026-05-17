# Task T-001: Server Core — Entity, Redis Namespace, Service, Gateway, JWT

**Task ID:** T-001
**Feature:** FEAT-002-room-identity-refactor
**Status:** Todo
**Priority:** Must-have
**Depends on:** none

---

## 1. Context

This task delivers the foundational server-side changes for the room-identity refactor. It is separated from the REST API and client work because everything downstream depends on the internal key strategy and token shape being settled first.

The current system stores a randomly-generated `roomId` UUID in `auction.roomId` (PostgreSQL) and uses it as the Redis key prefix (`room:{roomId}:*`) and as the JWT token identifier. Replacing it with `auctionId` eliminates the semantic mismatch, makes the start flow idempotent, and simplifies the reset flow.

Related requirements: ADR §4 (chosen option B), ADR §5 (consequences), ADR §9 (impact on DB, Redis, and JWT)

## 2. Description

Remove the `roomId` column from the `Auction` entity and generate a migration to drop it from PostgreSQL. Update `auctions.service.ts` so `startAuction` no longer writes `roomId` and `resetAuction` clears the Redis room instead of nulling the column. Rename all Redis key namespaces in `room.repository.ts` from `room:{roomId}:*` to `room:{auctionId}:*` so the repository operates on `auctionId` throughout. Update `room.service.ts` to accept `auctionId` in `createRoom`, switch room-existence checks from a DB column read to a Redis `EXISTS` call, and update `room.gateway.ts` pub/sub channel names to use `auctionId`. Change the JWT room-token payload field from `roomId` to `auctionId`.

## 3. Files to Touch

**Create:**
- `server/src/migrations/<timestamp>-drop-auction-room-id.ts` — TypeORM migration to drop `roomId` column from `auction` table
- `server/src/modules/room/room.service.spec.ts` — test scaffold (already exists as untracked; fill scaffold entries for new logic)

**Modify:**
- `server/src/modules/auctions/entities/auction.entity.ts` — remove `roomId` column decorator and property
- `server/src/modules/auctions/auctions.service.ts` — remove `roomId` arg from `startAuction`; update `resetAuction` to clear Redis room state instead of setting `roomId = null`
- `server/src/modules/auctions/auctions.service.spec.ts` — update `startAuction` and `resetAuction` test cases
- `server/src/modules/room/room.repository.ts` — rename all key namespaces; update method signatures to accept `auctionId` instead of `roomId`
- `server/src/modules/room/entities/room.entity.ts` — clarify that `Room.id` now carries `auctionId` semantics
- `server/src/modules/room/room.service.ts` — `createRoom(auctionId)` signature; room-existence check via Redis `EXISTS`; remove call to `auctionsService.startAuction(…, roomId)`
- `server/src/modules/room/room.gateway.ts` — pub/sub channel names (`room:{auctionId}`, `room:{auctionId}:{userId}`); JWT token validation guard reads `auctionId` field

**Read for context (no changes expected):**
- `server/src/modules/redis/redis.service.ts`
- `server/src/modules/redis/repositories/simple.repository.ts`
- `server/src/modules/auth/` — token service interface before changing the JWT payload field

## 4. Implementation Plan

1. **Remove `roomId` from Auction entity.** In `auction.entity.ts` delete the `@Column({ type: 'varchar', nullable: true, default: null }) roomId: string | null` property. Run `npm run migration:generate -- -n drop-auction-room-id` to produce the migration file; review it confirms only a `DROP COLUMN roomId` on the `auction` table.

2. **Update `auctions.service.ts`.** In `startAuction(auctionId)` remove the second `roomId` parameter and the `save({ roomId })` call — the auction status is still set to `STARTED` but no column is written for the room. In `resetAuction(auctionId)` replace the `update({ roomId: null })` with a call to `roomService.clearRoom(auctionId)` (inject `RoomService` or use a shared Redis key helper if circular dependency is a concern — prefer injecting the Redis repository directly).

3. **Rename Redis key namespaces in `room.repository.ts`.** Replace every occurrence of the `roomId`-based key prefix with `auctionId`. Update all public method signatures (`createRoom(auctionId, …)`, `getRoom(auctionId)`, `setActiveLot(auctionId, …)`, etc.) to accept `auctionId: string`. The Redis key strings change from `rooms:{roomId}` → `rooms:{auctionId}`, `lotsList:{roomId}` → `lotsList:{auctionId}`, `activeLotId:{roomId}` → `activeLotId:{auctionId}`, `members:{roomId}` → `members:{auctionId}`, `invites:{roomId}` → `invites:{auctionId}`, `bids:{roomId}:{lotId}` → `bids:{auctionId}:{lotId}`.

4. **Update `room.service.ts`.** Change `createRoom(auctionId: string)` to use `auctionId` as the Redis room key directly (pass `auctionId` to `roomRepository.createRoom`). Replace the room-existence guard from `if (auction.roomId !== null)` to `if (await this.roomRepository.roomExists(auctionId))` — add a `roomExists(auctionId)` helper on the repository that calls Redis `EXISTS` on the rooms key. Remove the call to `auctionsService.startAuction(…, roomId)` and instead call `auctionsService.startAuction(auctionId)` with no room-ID arg.

5. **Update `room.gateway.ts`.** Rename pub/sub subscription channels: `room:{roomId}` → `room:{auctionId}` and `room:{roomId}:{userId}` → `room:{auctionId}:{userId}`. Update the `handleConnection` guard to read `auctionId` from the JWT payload instead of `roomId`. Propagate `auctionId` where `roomId` was used for room-socket joins and Redis publishes.

6. **Rename JWT token payload field.** In the auth token service (wherever `roomMemberToken` and `roomAdminToken` are generated), rename the payload field from `roomId` to `auctionId`. Update the token-validation guard accordingly. Both the token generator and the guard must agree on the field name.

7. **Update tests.** In `auctions.service.spec.ts` update `startAuction` and `resetAuction` test cases to reflect the removed `roomId`. Add/update entries in `room.service.spec.ts` to cover: (a) `createRoom` uses `auctionId` as Redis key, (b) room-existence check is Redis-first, (c) duplicate `createRoom` call returns existing room (idempotent).

## 5. Definition of Done

- [ ] All code in "Files to Touch" is written and lints cleanly (`cd server && npm run lint`).
- [ ] Test files exist (scaffolded).
- [ ] No regressions in existing tests (`cd server && npm run test`).
- [ ] Code follows existing NestJS + TypeORM conventions.
- [ ] `auction` table no longer has a `roomId` column after `npm run migration:run`.
- [ ] All Redis keys for a room are prefixed `room:{auctionId}:*` (verify via `redis-cli KEYS "room:*"` after starting a room).
- [ ] JWT room token payload contains `auctionId` field; `roomId` field is absent (verify with jwt.io decode).
- [ ] Calling `createRoom(auctionId)` twice returns the existing room without error (idempotent start).
- [ ] `resetAuction` clears Redis state; no `roomId` column write occurs.

## 6. Test Plan

**Unit tests (Jest):**
- `AuctionsService.startAuction` — does not write `roomId`; sets status to `STARTED`
- `AuctionsService.resetAuction` — calls Redis clear helper; does not update `roomId` column
- `RoomService.createRoom` — passes `auctionId` to repository; calls `auctionsService.startAuction(auctionId)`
- `RoomService.createRoom` (idempotent) — if `roomExists(auctionId)` returns true, throws `ConflictException` (or returns existing room, per ADR decision)
- `RoomRepository.roomExists` — returns true when Redis key exists, false when absent
- JWT token payload shape — generated token contains `auctionId`, not `roomId`

**E2E tests (Playwright):**
- Not in scope for this task; covered by T-003 end-to-end flow.

**Test data needs:**
- Mock `auctionId` UUID for repository unit tests
- Mock Redis client with `EXISTS` support in room service tests

## 7. Notes & Considerations

- **Circular dependency risk:** `AuctionsService` calling `RoomService.clearRoom` (or vice versa) may create a circular DI graph. Prefer injecting the `RoomRepository` directly into `AuctionsService.resetAuction`, or use `ModuleRef` for lazy resolution. The existing codebase avoids circular imports — check before wiring.
- **Migration is destructive (ADR §9):** Dropping `roomId` is irreversible if any live code still writes it. Ensure this migration runs only after the service changes are deployed. Deployment order: deploy code first, then run migration.
- **In-flight rooms (ADR §5):** Any room started before deployment will have stale Redis keys under `room:{oldUUID}:*`. Those rooms will be unreachable after deployment. This is an accepted consequence per the ADR (maintenance window required).
- **TTL unchanged:** Redis key TTL is driven by `JWT_ROOM_TTL` config. The TTL value does not change — only the key prefix changes.

## 8. References

- ADR: `03-adr.md` — §4 (Decision: Option B), §5 (Consequences), §7 (Known Limitations), §9 (Impact table)
- Related tasks: T-002 (REST API + client engine, depends on this task), T-003 (Next.js BFF + pages, depends on T-002)
