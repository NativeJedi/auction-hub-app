# Task T-002: Parallelize room engine connect

**Task ID:** T-002
**Feature:** FIX-002-performance
**Status:** Todo
**Priority:** Must-have
**Depends on:** none

---

## 1. Context

Entering any room runs `RoomEngine.connect()`, which `await`s the initial HTTP fetch and only then
opens the socket — two round-trips in series. The socket only needs the room token (read from
`localStorage`), not the fetched data, so the two can run concurrently. This shaves one round-trip
off every room entry, directly improving first render for `/room/*` routes.

Related requirements: RF-2 (see `00-performance-review.md`).

## 2. Description

Refactor `RoomEngine.connect()` so `fetchInitialData()` and `socket.connect(token)` run in parallel
rather than sequentially, while preserving current ordering guarantees: socket event handlers must
register only after both resolve, and `isLoading` must flip to `false` only when both are done.
Error handling must still surface a single failure via the existing catch path.

## 3. Files to Touch

**Modify:**
- `client/src/modules/room-engine/core/RoomEngine.ts` — parallelize fetch + socket connect in `connect()`

**Read for context (no changes expected):**
- `client/src/sockets/base-socket.ts` — `connect()` returns a Promise; confirms token-only dependency
- `client/src/modules/room-engine/admin/AdminRoomContext.tsx` — subclass usage of the engine
- `client/src/modules/room-engine/member/MemberRoomContext.tsx` — subclass usage of the engine
- `client/src/modules/room-engine/public/PublicRoomContext.tsx` — subclass usage of the engine

## 4. Implementation Plan

1. In `connect()`, read the room token first (`RoomEngine.getRoomToken(this.auctionId)`).
2. Kick off both promises without awaiting: `const dataP = this.fetchInitialData()` and `const socketP = this.socket.connect(token ?? '')`.
3. `await Promise.all([dataP, socketP])`; apply `this.setState(data)` from the resolved fetch result.
4. Call `this.registerSocketEvents()` after both resolve (unchanged ordering relative to socket readiness).
5. Set `{ isLoading: false }` on success; keep the existing `catch` that logs and sets `{ isLoading: false, error }`.
6. Verify subclasses don't rely on `setState` happening strictly before the socket connects (data and socket are independent).

## 5. Definition of Done

The task is complete when:

- [ ] `connect()` runs fetch and socket connect concurrently and lints cleanly.
- [ ] Socket event handlers still register only after the socket is connected.
- [ ] `isLoading` flips to `false` only after both fetch and socket complete; a failure of either still sets `error` once.
- [ ] No regressions in existing tests.
- [ ] Code follows existing project conventions and patterns.
- [ ] Member, admin, and public room views still load and receive live updates.

## 6. Test Plan

**Unit tests (Vitest):**
- `connect()` resolves after both fetch and socket resolve; state is populated from fetch.
- If `fetchInitialData()` rejects, `error` is set and `isLoading` is `false` (and vice-versa for socket failure).
- `registerSocketEvents` is invoked exactly once on success.

**Component tests (RTL):** none required (logic lives in the engine class).

**E2E tests (Playwright):** none required for this task.

**Test data needs:**
- Mock `BaseSocket` whose `connect` resolves/rejects on demand; stubbed `fetchInitialData`.

## 7. Notes & Considerations

- Out of scope: SSR-hydrating initial room state (larger refactor) — only the parallelization is in scope.
- Keep the public API of `connect()` unchanged (still `Promise<void>`).
- Remove the `console.log` connect/disconnect noise in `base-socket.ts` only if trivial and in-pass; otherwise leave it.

## 8. References

- Source: `00-performance-review.md` (RF-2)
- Related tasks: T-001 (other first-render fix, independent)
