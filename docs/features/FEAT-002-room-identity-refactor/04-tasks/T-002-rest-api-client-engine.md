# Task T-002: REST API + Client Room Engine

**Task ID:** T-002
**Feature:** FEAT-002-room-identity-refactor
**Status:** Todo
**Priority:** Must-have
**Depends on:** T-001

---

## 1. Context

With the server internals (Redis keys, JWT payload, service logic) updated in T-001, this task surfaces those changes in two places: the server's REST API contract (controller route params and DTOs) and the client-side room engine (engine constructors, token storage keys, and socket auth). These two layers are bundled together because the client engine is tightly coupled to the API contract — updating one without the other leaves the system in a broken intermediate state.

Related requirements: ADR §4 (Option B consequences — REST endpoints and client token flow), ADR §5 (JWT token carries `auctionId`)

## 2. Description

Rename all `:roomId` route parameters in `RoomController` to `:auctionId` and update the DTOs to reflect the new field name. On the client, update the abstract `RoomEngine` base class and all three concrete engines (`AdminRoomEngine`, `MemberRoomEngine`, `PublicRoomEngine`) to accept and use `auctionId` instead of `roomId`. Update `local-storage.ts` so token keys are `room:${auctionId}:token`. Update all React context providers and hooks to pass `auctionId` through to engines.

## 3. Files to Touch

**Modify:**
- `server/src/modules/room/room.controller.ts` — rename `:roomId` params to `:auctionId` on all routes; update `@Param('roomId')` decorators
- `server/src/modules/room/dto/room.dto.ts` (and related DTO files) — rename `roomId` fields to `auctionId` in response shapes
- `client/src/modules/room-engine/core/RoomEngine.ts` — rename `roomId` constructor param and property to `auctionId`; update `getRoomToken(this.auctionId)` call
- `client/src/modules/room-engine/admin/AdminRoomEngine.ts` — rename constructor param; update `AdminRoomEngine.createRoom` static factory to store token by `auctionId`; update `fetchInitialData` API call
- `client/src/modules/room-engine/member/MemberRoomEngine.ts` — rename constructor param; update `confirmInvite` to store token by `auctionId`; update `fetchInitialData` API call
- `client/src/modules/room-engine/public/PublicRoomEngine.ts` — rename constructor param; update fetch calls and `sendInvite`
- `client/src/modules/room-engine/admin/AdminRoomContext.tsx` — update prop name `roomId` → `auctionId`; pass to `useAdminEngine`
- `client/src/modules/room-engine/member/MemberRoomContext.tsx` — same
- `client/src/modules/room-engine/public/PublicRoomContext.tsx` — same
- `client/src/modules/room-engine/admin/hooks/useAdminEngine.ts` — update param
- `client/src/modules/room-engine/member/hooks/useMemberEngine.ts` — update param
- `client/src/modules/room-engine/public/hooks/usePublicEngine.ts` — update param
- `client/src/utils/local-storage.ts` — `setRoomToken` / `getRoomToken` parameter type and key string: `room:${auctionId}:token`

**Read for context (no changes expected):**
- `server/src/modules/room/room.gateway.ts` — confirm token field name after T-001
- `client/src/modules/room-engine/core/types.ts`

## 4. Implementation Plan

1. **Update `RoomController` route params.** In `room.controller.ts`, rename every `@Param('roomId') roomId: string` to `@Param('auctionId') auctionId: string`. Update the corresponding route path strings from `:roomId` to `:auctionId` (`GET /room/:auctionId`, `GET /room/:auctionId/admin`, `POST /room/:auctionId/invite`, `POST /room/:auctionId/invite/confirm`). Pass `auctionId` to service calls.

2. **Update response DTOs.** In `room.dto.ts` (and any DTO that references `room.id` as `roomId`), rename the field to `auctionId`. Update `CreateRoomResponseDto`, `RoomInfoOwnerResponseDto`, and `RoomInfoResponseDto` where `roomId` appears as a named field. Ensure `@Expose()` / `@Transform()` decorators match the new field name.

3. **Update `local-storage.ts`.** Change `setRoomToken(id: Room['id'], token)` and `getRoomToken(id: Room['id'])` so the key is `room:${id}:token` where `id` is now understood to be `auctionId`. The function signatures can keep `id` as the parameter name or be renamed to `auctionId` for clarity — either is acceptable as long as callers are updated.

4. **Update `RoomEngine` base class.** In `RoomEngine.ts`, rename the `roomId` constructor parameter and protected property to `auctionId`. Update the `connect()` method to call `getRoomToken(this.auctionId)`. Update any other internal references to the old `roomId` property.

5. **Update concrete engines.** In each of `AdminRoomEngine`, `MemberRoomEngine`, and `PublicRoomEngine`:
   - Rename the constructor parameter `roomId` → `auctionId`; call `super(auctionId)`
   - Update `fetchInitialData()` to use `this.auctionId` in API URL (e.g. `/room/${this.auctionId}`, `/room/${this.auctionId}/admin`)
   - In `AdminRoomEngine.createRoom(auctionId)`: after the API call returns `room`, call `setRoomToken(room.id, token)` — `room.id` now equals `auctionId` so this is consistent
   - In `MemberRoomEngine.confirmInvite(inviteToken)`: after confirm, call `setRoomToken(this.auctionId, token)`

6. **Update context providers and hooks.** In each context (`AdminRoomContext.tsx`, `MemberRoomContext.tsx`, `PublicRoomContext.tsx`), rename the `roomId` prop to `auctionId` and pass it to the corresponding `useXxxEngine(auctionId)` hook. Update the three `useXxxEngine.ts` hook files to accept `auctionId` as their parameter.

## 5. Definition of Done

- [ ] All code in "Files to Touch" is written and lints cleanly (`cd server && npm run lint`; `cd client && npm run lint`).
- [ ] No regressions in existing tests.
- [ ] Code follows existing conventions.
- [ ] `GET /room/:auctionId` and `GET /room/:auctionId/admin` respond correctly when called with an `auctionId` UUID (verify manually or via existing e2e tests).
- [ ] `RoomEngine` instances constructed with an `auctionId` retrieve the correct token from localStorage key `room:${auctionId}:token`.
- [ ] `AdminRoomEngine.createRoom(auctionId)` stores token under `room:${auctionId}:token`.
- [ ] `MemberRoomEngine.confirmInvite` stores token under `room:${auctionId}:token`.
- [ ] TypeScript compiles with no errors across both workspaces (`cd client && npm run build`).

## 6. Test Plan

**Unit tests (Jest — server):**
- `RoomController` route param binding — `auctionId` param is extracted and passed to service

**Unit tests (Vitest — client):**
- `getRoomToken(auctionId)` returns value stored under `room:${auctionId}:token`
- `AdminRoomEngine.createRoom` stores token keyed by `auctionId`
- `MemberRoomEngine.confirmInvite` stores token keyed by `auctionId`

**Component tests (RTL):**
- Not required for this task — context providers are pure pass-through wrappers.

**E2E tests (Playwright):**
- Not in scope for this task; covered by T-003.

**Test data needs:**
- Mock `auctionId` UUID for localStorage tests
- Mock API responses matching the updated DTO shapes

## 7. Notes & Considerations

- **`Room.id` still exists in the Redis entity** — after T-001, `Room.id` equals `auctionId`. Client code that reads `room.id` from API responses will therefore already receive the `auctionId` value; no mapping is needed on the client side if the server serializes the room entity correctly.
- **Swagger docs** — `@ApiParam('roomId')` decorators in the controller (if present) should be renamed to `auctionId`. Swagger UI at `/api/v1/docs` should reflect the new parameter name.
- **`x-room-token` header** — the server-side BFF (`client/src/api/auctions-api/requests/room.ts`) passes a token via the `x-room-token` header. The header name does not change in this task; only the value it carries changes (a token that now contains `auctionId` in its payload). The actual cookie key changes are handled in T-003.

## 8. References

- ADR: `03-adr.md` — §4 (Option B), §5 (Consequences: REST endpoint params and client token flow)
- Related tasks: T-001 (server core, prerequisite), T-003 (Next.js BFF + pages, depends on this task)
