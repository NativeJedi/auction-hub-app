# T-007 — Client socket resilience

- **Task ID:** T-007
- **Feature:** FIX-001-room-flow-fixes
- **Status:** Todo
- **Priority:** Must-have
- **Depends on:** none

## 1. Context
On any disconnect, `BaseSocket` sets `this.socket = null`, which breaks placing bids after a reconnect and risks a duplicate `io()` connection; the engine never re-syncs state on reconnect, so bids missed during a network blip are lost; transport is `websocket`-only (no polling fallback for mobile/proxy networks); and there is no resync when a phone wakes from background.
Related findings: W1, W2, W3, W5, W6, W7.

## 2. Description
Make the client survive transient disconnects: keep the socket instance, rely on socket.io auto-reconnect, refetch the room snapshot on reconnect, allow a polling fallback, resync on tab visibility, and acknowledge bids.

## 3. Files to Touch
- **Modify:** `client/src/sockets/base-socket.ts` — stop nulling `socket` on disconnect; add `reconnect` handling; `transports: ['websocket','polling']`; bid `emit` with ack callback.
- **Modify:** `client/src/modules/room-engine/core/RoomEngine.ts` — re-run `fetchInitialData()` on reconnect; scope `clearAllRoomTokens` to `room:*` keys only.
- **Read:** `client/src/modules/room-engine/member/MemberRoomEngine.ts`, `.../member/MemberRoomContext.tsx` — confirm cleanup and resync wiring.
- **Create:** `client/src/sockets/base-socket.test.ts` (scaffold).

## 4. Implementation Plan
1. Remove `this.socket = null` from the `disconnect` handler; expose reconnect events.
2. On reconnect, have the engine call `fetchInitialData()` and reconcile state.
3. Add `polling` as a transport fallback.
4. Add a `visibilitychange → visible` handler that forces reconnect + refetch.
5. Send `placeBid` with an ack callback (optimistic state + retry on timeout).
6. Scope `clearAllRoomTokens` to iterate `room:*` keys instead of `localStorage.clear()`.

## 5. Definition of Done
- [ ] Lint clean, no regressions.
- [ ] Test scaffold exists for the socket wrapper.
- [ ] After a transient disconnect, the client reconnects and the visible state matches the server (no lost bids).
- [ ] Placing a bid works after a reconnect (no "Socket is not connected").
- [ ] `clearAllRoomTokens` removes only room tokens.

## 6. Test Plan
- **Unit (Vitest):** reconnect triggers a refetch; `clearAllRoomTokens` leaves non-room keys intact.
- **Component (RTL):** bid disabled while reconnecting, re-enabled after resync.

## 7. Notes & Considerations
- No spec/ADR — review remediation (W1/W2/W3/W5/W6/W7).
- Bid ack (W6) pairs well with the server `error` events already emitted by the gateway.

## 8. References
- Source: room-flow code review (findings W1, W2, W3, W5, W6, W7).
