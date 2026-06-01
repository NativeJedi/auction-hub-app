# T-006 — Harden WS connection

- **Task ID:** T-006
- **Feature:** FIX-001-room-flow-fixes
- **Status:** Todo
- **Priority:** Should-have
- **Depends on:** none

## 1. Context
The gateway uses `cors: true` (reflects any origin); authenticates inside async `handleConnection` (events can arrive before `client.data.user` is set, causing spurious disconnects); never unsubscribes Redis channels on disconnect (slow leak, `subscribedRooms` only grows); and `socket.join` happens only on an explicit `'join'` message while the Redis subscribe happens at connect.
Related findings: S3, R3, R4, D2.

## 2. Description
Tighten the socket entry point: restrict CORS to known origins, authenticate before any event is processed, join the socket.io room at connection time, and release Redis subscriptions when the last client of a room leaves.

## 3. Files to Touch
- **Modify:** `server/src/modules/room/room.gateway.ts` — CORS allowlist; `io.use()` auth middleware; `socket.join` in `handleConnection`; `handleDisconnect` with per-room subscriber counting + `UNSUBSCRIBE`.
- **Read:** `server/src/config/app-config.service.ts` — `CLIENT_URL` for the allowlist.
- **Create:** `server/src/modules/room/room.gateway.spec.ts` (extend scaffold from T-004).

## 4. Implementation Plan
1. Replace `cors: true` with an origin allowlist from `CLIENT_URL`.
2. Move token validation into an `io.use()` middleware so `client.data.user` exists before any handler/guard runs.
3. Join the room/user socket.io rooms inside `handleConnection`.
4. Track subscriber counts per room; on `handleDisconnect`, decrement and `UNSUBSCRIBE` when zero; use distinct key namespaces for room vs user subscriptions.

## 5. Definition of Done
- [ ] Lint clean, no regressions.
- [ ] Test scaffold exists for the gateway.
- [ ] Connections from disallowed origins are refused.
- [ ] A bid sent immediately after connect is not spuriously rejected.
- [ ] Redis subscriptions drop to zero after the last client of a room disconnects.

## 6. Test Plan
- **Unit (Jest):** auth middleware sets `client.data.user`; disconnect bookkeeping unsubscribes at zero.

## 7. Notes & Considerations
- No spec/ADR — review remediation (S3/R3/R4/D2).
- `io.use()` also removes the need for the `!user` disconnect branch inside the roles guard.

## 8. References
- Source: room-flow code review (findings S3, R3, R4, D2).
- Sibling: T-005 (invite/throttling).
