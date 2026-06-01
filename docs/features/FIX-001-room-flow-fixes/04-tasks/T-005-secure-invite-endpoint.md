# T-005 — Secure invite endpoint

- **Task ID:** T-005
- **Feature:** FIX-001-room-flow-fixes
- **Status:** Todo
- **Priority:** Must-have
- **Depends on:** none

## 1. Context
`POST /room/:auctionId/invite` has no guard. Anyone who knows an `auctionId` can send invite emails to arbitrary addresses through the app's SMTP (spam relay), with `name` injected into the email body. There is also no rate limiting on invites or on WS bid/lot events.
Related findings: S2 (high), S4.

## 2. Description
Restrict the invite endpoint to the authenticated room owner and add throttling to the abuse-prone surfaces (invite sending, WS `placeBid`/`placeLot`).

## 3. Files to Touch
- **Modify:** `server/src/modules/room/room.controller.ts` — add `AuthGuard` (+ owner check) to `sendRoomInvite`.
- **Modify:** `server/src/modules/room/room.service.ts` — verify caller owns the room before sending.
- **Modify:** `server/src/modules/room/room.gateway.ts` — apply throttling to `placeBid`/`placeLot`.
- **Read:** `server/src/modules/auth/auth.guard.ts`, existing `@nestjs/throttler` setup in the auth module.
- **Create:** `server/src/modules/room/room.controller.spec.ts` (scaffold).

## 4. Implementation Plan
1. Guard `sendRoomInvite` with `AuthGuard` and assert `room.ownerId === user.sub`.
2. Reuse the existing throttler config (from auth) for the invite route.
3. Add a per-socket throttle/guard for `placeBid` and `placeLot`.
4. Ensure `name`/`email` remain validated/escaped before going into the email body.

## 5. Definition of Done
- [ ] Lint clean, no regressions.
- [ ] Test scaffold exists for the controller.
- [ ] Unauthenticated / non-owner invite requests are rejected (401/403).
- [ ] Invite sending is rate-limited.
- [ ] WS bid/lot flooding is throttled.

## 6. Test Plan
- **Unit (Jest):** invite without auth → rejected; non-owner → rejected; owner → 200.
- **e2e (optional):** invite rate-limit returns 429 after threshold.

## 7. Notes & Considerations
- No spec/ADR — review remediation (S2/S4).
- Reuse the existing throttler rather than introducing a new mechanism.

## 8. References
- Source: room-flow code review (findings S2, S4).
- Sibling: T-006 (gateway hardening).
