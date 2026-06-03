# ADR: Live-room session teardown on auction reset

**Feature:** FEAT-010-auction-reset-teardown
**ADR ID:** ADR-FEAT-010-01
**Status:** Proposed
**Date:** 2026-06-01
**Decision makers:** sdlc-adr

---

## 1. Context

Resetting an auction (`POST /room/:auctionId/reset` → `RoomService.resetAuction`) wipes the live room state in Redis (`clearRoom`: room, members, lots, `activeLotId`, bids, invites) and sets the Postgres auction status back to `CREATED`. The problem: **reset is silent to everyone connected.**

Unlike `finish`, which publishes `auctionFinished`, the reset endpoint emits no socket event. So when an admin resets mid-auction:

- Connected member/public sockets keep a stale live view; bids then fail with `NotFoundException('No active lot')` (a generic `error` toast, not a clean "auction reset" state).
- The room-scoped JWT (`room:${auctionId}:token`) is **stateless** — `handleConnection` and `WSRoomRolesGuard` validate only the token signature/role, never Redis membership. Reset does not revoke it. After the auction is restarted (lot IDs are reused from the auction definition), a pre-reset participant whose socket is still open — or who reconnects with the old token — could place bids in the new session despite having been "removed" by the reset.

The architectural question: **how should a reset terminate the live session so that (a) connected clients learn about it and react gracefully, and (b) participants removed by the reset can no longer act — without introducing stateful token-revocation infrastructure?**

> Assumption: this feature currently has only this ADR — no formal `01-feature-spec.md`. It was extracted from the room-flow review (FIX-001) because the reset-teardown decision has lasting, cross-cutting consequences and warrants its own record. Drivers below are derived from the review's connection-lifecycle & auth findings and the design discussion, not from FR/NFR IDs.
> Related: this interacts with the bid-storage change in `FIX-001-room-flow-fixes` T-003 (bids in a Redis Sorted Set), which is where the clearRoom-vs-in-flight-bid orphan race surfaces.

## 2. Decision Drivers

In order of importance:

- **Evict already-connected participants on reset.** A reset must terminate live sessions, not just clear data behind them.
- **A stale room token must not be able to act in a restarted session.** Reset is conceptually a "removal" of all participants; security depends on enforcing that.
- **Graceful client UX** — no silent freeze; the client should show "auction was reset" and stop bidding.
- **KISS / reuse** — prefer the existing `publishRoomEvent` pattern (as used by `finish`) and the existing `members` data; avoid new infrastructure, migrations, or a stateful revocation store.
- **Cost on the hot path** — bids are far more frequent than connections; avoid per-bid overhead where a per-connection check suffices.
- **Single gateway, Redis-backed fanout** — there is no multi-service token-consumer that would require cryptographic, stateless revocation.

## 3. Options Considered

Baseline (status quo): reset clears Redis and DB but emits nothing and re-checks nothing. Rejected — it is exactly the bug under repair (silent stale clients; stale token can act after restart).

### Option A: Broadcast `auctionReset` + connect-time membership check + force-disconnect

**Description:** On reset, after `clearRoom`, the gateway force-disconnects every socket in the room (`server.in(roomKey).disconnectSockets(true)`) and publishes an `auctionReset` event. `handleConnection` gains a role-scoped check: a `MEMBER` token is accepted only if the member still exists in the Redis `members` hash (`ADMIN` is unaffected). Clients listen for `auctionReset`, clear their stored room token, and render a "reset" state. Force-disconnect pushes every live socket back through `handleConnection`, where the membership check now fails (members were cleared), so already-connected participants cannot continue and stale-token reconnects are rejected.

**Pros:**
- Closes the "already-connected" case: eviction + forced re-handshake through the connect check.
- Reuses existing building blocks (`publishRoomEvent`, the `members` hash, socket.io rooms). No new storage, no migration, no token-format change.
- Check runs at connect (rare), not per bid (frequent) — negligible hot-path cost.
- Role-scoped naturally (only two roles: `ADMIN`, `MEMBER`).

**Cons:**
- The room JWT remains cryptographically valid until its TTL — participants are blocked *behaviorally* (no membership) rather than the token being truly revoked.
- Correctness depends on ordering (clear members before disconnect) and on force-disconnect actually traversing all sockets.
- socket.io auto-reconnect means clients will retry; the `auctionReset` + token-clear handling is required to avoid a reconnect loop.

**Estimated effort:** ~1–1.5 days (server: event + disconnect + connect check; client: 2–3 engines listen + token clear + UI state).

### Option B: Per-message membership check (+ broadcast + client token-clear)

**Description:** Keep connection as-is, but verify membership in the `placeBid` path (guard or `setBid`) on every bid: reject if the member is absent from the `members` hash. Combine with the `auctionReset` broadcast and client token-clear for UX.

**Pros:**
- Strongest behavioral guarantee for bidding specifically — re-checked on every action, independent of connection lifecycle.
- No reliance on force-disconnect traversal.

**Cons:**
- Adds a Redis read to the hot path (every bid).
- Only guards the bid action; other member-only actions would each need the same check.
- Already-connected sockets stay open (still receive broadcasts, still occupy the room) unless also force-disconnected — so it does not remove the socket, only blocks the action.

**Estimated effort:** ~1 day.

### Option C: Per-auction token epoch (stateless revocation)

**Description:** Store a monotonic epoch per auction (Postgres column or a Redis key excluded from `clearRoom`), embed it in the room token at issue time, bump it on reset, and compare token-epoch to the current epoch in `handleConnection`. Old tokens fail validation.

**Pros:**
- True revocation semantics — a pre-reset token is cryptographically stale, not just data-orphaned.
- Works across multiple gateways/services if the project ever scales horizontally.

**Cons:**
- Most code and surface area: token payload + signing site change, a persistent monotonic store (likely a migration), connect-time comparison, bump-on-reset.
- The epoch must survive `clearRoom` (or reset to 0 collides old/new tokens) — easy to get subtly wrong.
- Still checked at connect → **does not** stop already-connected sockets on its own; needs force-disconnect or a per-message check anyway. So it adds cost without uniquely solving the core driver.

**Estimated effort:** ~3–4 days (incl. migration + token changes).

## 4. Comparison

| Criterion | Option A | Option B | Option C |
|-----------|----------|----------|----------|
| Stops already-connected member | Yes (via disconnect→reconnect→reject) | Partial (blocks bid only, socket stays) | No (needs A or B too) |
| Hot-path cost | None (per-connect) | Per-bid Redis read | Per-connect |
| New storage / migration | None | None | Yes (epoch store) |
| Token-format change | None | None | Yes |
| True token revocation | No (behavioral) | No (behavioral) | Yes |
| Reuses existing patterns | High | High | Low |
| Implementation effort | Low–Med | Low | High |

## 5. Decision

**Chosen option:** A — Broadcast `auctionReset` + connect-time membership check + force-disconnect.

**Rationale:** The top driver (evict already-connected participants) is satisfied precisely by force-disconnect, which pushes every live socket back through `handleConnection`, where the role-scoped membership check rejects participants the reset removed. It reuses what already exists (`publishRoomEvent`, the `members` hash, socket.io rooms) with no new storage, migration, or token-format change, and it puts the check on the rare connect path rather than the frequent bid path. Option B was deprioritized because it only blocks the bid action and leaves the socket attached, still requiring a disconnect to truly evict. Option C (token epoch) is the only one offering true cryptographic revocation, but that driver does not apply here (single gateway, Redis-backed fanout); it is the most code, needs a migration, and *still* cannot stop an already-connected socket without the force-disconnect from Option A — so it loses on cost-for-value. The accepted sacrifice is that the token is blocked behaviorally rather than revoked; acceptable until the deployment topology changes (see §8).

## 6. Tradeoffs

**Gained:**
- Connected participants are evicted on reset and learn about it (graceful UX).
- Stale-token reconnects are rejected without any token-revocation infrastructure.
- Minimal, pattern-consistent change; no migration; no hot-path cost.

**Sacrificed:**
- No true token revocation — the JWT stays cryptographically valid until TTL; enforcement is via missing membership, not signature.
- Correctness leans on operation ordering (clear-then-disconnect) and on force-disconnect traversing all room sockets.
- Adds reset-specific lifecycle handling to three client engines.

## 7. Known Limitations

- **Behavioral, not cryptographic, revocation.** A captured pre-reset token remains signature-valid until expiry; it is stopped only because membership is gone. Not sufficient for a multi-service token consumer.
- **Connect-scoped check.** Membership is verified at connect, relying on force-disconnect to route live sockets through it; a socket that is never disconnected would not be re-checked. Mitigated by `disconnectSockets(true)` on reset.
- **Race orphan is out of scope here.** The `clearRoom`-vs-in-flight-`ZADD` orphan `bids:` key (and its potential resurfacing after restart due to reused lot IDs) is a separate concern, best neutralized by an idempotent bids clear on auction start (see §8). This ADR governs session teardown, not that race.
- **Public/viewer.** Only `ADMIN` and `MEMBER` roles exist; the membership check is scoped to `MEMBER`. If a distinct public/viewer token is introduced later, this scoping must be revisited.

## 8. Future Optimization Opportunities

- **Token epoch (Option C)** — adopt when the room token is consumed by more than the single gateway (horizontal scale / additional services), where true stateless revocation becomes necessary.
- **Per-message membership check (Option B)** — add on top if a stronger per-action guarantee is required for other member-only operations beyond bidding.
- **Idempotent bids clear on auction start** — have `createRoom`/start clear each lot's `bids` key so any reset-race orphan can never resurface in a restarted session; closes the §7 race independently of this decision.

## 9. Consequences

**For the codebase:**
- `room.controller.ts` reset handler publishes `publishRoomEvent(auctionId, 'auctionReset', {})` after `roomService.resetAuction`, mirroring the `finish` handler.
- `RoomGateway` exposes a force-disconnect for a room (e.g. `this.server.in(this.getRoomKey(auctionId)).disconnectSockets(true)`); reset calls it **after** `clearRoom`.
- `handleConnection` adds a role-scoped membership check: for `RoomRole.MEMBER`, reject/disconnect if the member is absent from the Redis `members` hash; `ADMIN` unaffected.
- Client engines `MemberRoomEngine` and `PublicRoomEngine` (and optionally `AdminRoomEngine`) subscribe to `auctionReset` → clear state, drop the stored `room:${auctionId}:token`, and render a "reset" screen.

**For the team:**
- No new technology; reuses existing socket/Redis/JWT patterns.

**For operations:**
- No new infrastructure to run or monitor.

**For testing:**
- Gateway: a `MEMBER` connect is rejected after reset (members cleared); an `ADMIN` connect still succeeds.
- Reset evicts connected sockets (force-disconnect) and emits `auctionReset`.
- E2E (optional, Playwright): admin reset mid-auction → member view flips to "reset" and bidding is blocked.

## 10. References

- Feature: `docs/features/FEAT-010-auction-reset-teardown/` (extracted from the room-flow review; no `01-feature-spec.md` yet).
- Related: `docs/features/FIX-001-room-flow-fixes/04-tasks/T-003-atomic-bid-placement.md` (bid storage / `clearRoom` interplay), and the existing `finish` → `auctionFinished` broadcast pattern in `server/src/modules/room/room.controller.ts`.
- Source: room-flow code review (connection-lifecycle & auth findings).
