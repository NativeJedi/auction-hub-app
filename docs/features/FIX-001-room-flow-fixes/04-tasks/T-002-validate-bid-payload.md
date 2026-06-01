# T-002 — Validate bid payload

- **Task ID:** T-002
- **Feature:** FIX-001-room-flow-fixes
- **Status:** Todo
- **Priority:** Must-have
- **Depends on:** none

## 1. Context
`CreateBidDto.amount` has no validators, and the global `ValidationPipe` runs with `whitelist: true` only (no `transform`, no `forbidNonWhitelisted`). A member can emit `placeBid { amount: -100 }`, `0`, or a non-number and corrupt the lot price.
Related findings: C2 (high).

## 2. Description
Enforce that a bid increment is a positive number on the server, fail fast on bad payloads, and surface validation errors back over the socket instead of swallowing them.

## 3. Files to Touch
- **Modify:** `server/src/modules/room/dto/bid.dto.ts` — add `@IsNumber()` / `@IsPositive()` (and a sane `@Max` if desired) to `amount`, `@IsString()`/`@IsNotEmpty()` to `lotId`.
- **Modify:** `server/src/main.ts` — `ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true })`.
- **Create:** `server/src/modules/room/filters/ws-exception.filter.ts` — emit validation errors as a socket `error` event.
- **Modify:** `server/src/modules/room/room.gateway.ts` — apply the WS exception filter.
- **Create:** `server/src/modules/room/dto/bid.dto.spec.ts` (scaffold).

## 4. Implementation Plan
1. Add class-validator decorators to `CreateBidDto`.
2. Enable `transform` + `forbidNonWhitelisted` in the global pipe.
3. Add a `WsExceptionFilter` that maps `BadRequestException` to a `client.emit('error', …)`.
4. Wire the filter on the gateway (`@UseFilters`).
5. Confirm the global pipe applies to `@MessageBody()` on WS handlers.

## 5. Definition of Done
- [ ] Lint clean, no regressions.
- [ ] Test scaffold exists for the DTO.
- [ ] `placeBid` with non-positive or non-numeric `amount` is rejected and the client receives an `error` event.
- [ ] Unknown extra fields are rejected (`forbidNonWhitelisted`).
- [ ] Follows existing DTO/validation conventions.

## 6. Test Plan
- **Unit (Jest):** DTO validation accepts positive numbers; rejects `0`, negatives, strings, missing `lotId`.

## 7. Notes & Considerations
- No spec/ADR — review remediation; traceability is to finding C2.
- Minimum bid step (server-enforced increment) is a related concern; keep it in T-003 if it needs Redis state.

## 8. References
- Source: room-flow code review (finding C2).
- Sibling: T-003 (atomic placement / min-increment).
