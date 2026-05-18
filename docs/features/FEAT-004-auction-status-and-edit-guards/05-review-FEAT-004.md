# Code Review — FEAT-004: Auction Status Guards and Lot Mutation Lock

**Feature:** FEAT-004-auction-status-and-edit-guards
**Tasks:** T-001, T-002, T-003 (combined — all in one commit)
**Reviewer:** sdlc-review (inline)
**Diff base:** `main..working-tree` (committed `b1dc41b` + in-progress unstaged refactoring)
**Diff scope:** 19 files committed (+368 / -23 lines); 5 server files unstaged (+217 / -41 lines)
**Date:** 2026-05-18

> **Note on diff base:** The committed changes (`b1dc41b`) represent the bulk of the feature. Five server files have unstaged changes that refactor the guard (moving `assertAuctionEditable` from `lots.service.ts` to a new `checkEditableStatus` in `auctions.service.ts`) and fill the test scaffolds. This review covers the full working-tree state — the combined intent of the branch.

---

## Summary

Request changes — 4 Significant findings, 2 Nits. The T-001 and T-003 implementations are clean and satisfy their DoD items completely. T-002's functional requirements are also met (all three endpoint types return 400 for non-CREATED auctions), but the refactoring in-progress introduces two concerns: the guard was moved from the service layer to the controller layer (directly contradicting T-002's stated architectural principle), and the `POST /lots` create endpoint remains unguarded at the backend while the frontend disables the button. Additionally, every guarded mutation now triggers two sequential auction fetches, and the controller-level guard integration has no test coverage.

**Verdict:** Request changes

**Counts:** Blocking: 0 · Significant: 4 · Nits: 2

---

## Definition-of-Done check

### T-001

- [x] `AuctionDto` on the server includes `finishedAt` (null for non-finished) — `server/src/modules/auctions/dto/auction.dto.ts:25`
- [x] Client `Auction` type includes `finishedAt: string | null` — `client/src/api/dto/auction.dto.ts:13`
- [x] Status badge renders on detail page — `client/app/crm/auctions/[auctionId]/page.tsx:33`
- [x] `finishedAt` visible only when status is `FINISHED` — `page.tsx:64-66`
- [x] Test scaffolds exist — `page.test.tsx`, `auctions.service.spec.ts` `findOne` describe block
- [x] All code lints cleanly — no evidence of violations
- [x] No regressions in existing tests — guard tests are additive
- [x] Code follows existing project conventions — ✅

### T-002

- [x] `PATCH /auctions/:id` returns 400 when started/finished — inline check in `auctions.service.ts:117-119`
- [x] `PATCH /auctions/:auctionId/lots/:lotId` returns 400 — controller calls `checkEditableStatus` at `lots.controller.ts:89`
- [x] Image upload/delete return 400 — controller calls `checkEditableStatus` at `lots.controller.ts:114,127,141`
- [~] Guard lives at the service layer — **partial**: see S-1. The in-progress refactoring moves the guard to the controller; `lots.service.ts` no longer contains the check.
- [~] Test coverage for `updateLot` guard behavior — **partial**: see S-4. Guard is tested in `auctions.service.spec.ts` but no integration test verifies the controller calls it or that the rejection propagates.
- [x] All three endpoints functional for `CREATED` auctions — logic is correct
- [x] Error message is clear and consistent — `'Auction cannot be edited after it has started'`

### T-003

- [x] All three mutation buttons disabled when locked — `CreateLot.button.tsx:43`, `DeleteLot.button.tsx:50`, `ManageLotImages.button.tsx:32`
- [x] Buttons remain rendered in both states (no conditional mount) — ✅
- [x] No confirmation modal opens when disabled — `disabled` on `<Button>` blocks click events before handlers fire
- [x] Test scaffolds exist — `CreateLot.button.test.tsx`, `DeleteLot.button.test.tsx`, `ManageLotImages.button.test.tsx`

---

## Files-to-Touch contract check

| Path | In contract? | In diff? | Notes |
|---|---|---|---|
| `server/src/modules/auctions/dto/auction.dto.ts` | T-001 Modify | Yes | OK |
| `client/src/api/dto/auction.dto.ts` | T-001 Modify | Yes | OK |
| `client/app/crm/auctions/[auctionId]/page.tsx` | T-001 + T-003 Modify | Yes | OK |
| `server/src/modules/auctions/auctions.service.ts` | T-002 Modify | Yes (unstaged) | OK |
| `server/src/modules/lots/lots.service.ts` | T-002 Modify | Yes | OK |
| `client/app/crm/auctions/[auctionId]/CreateLot.button.tsx` | T-003 Modify | Yes | OK |
| `client/app/crm/auctions/[auctionId]/DeleteLot.button.tsx` | T-003 Modify | Yes | OK |
| `client/app/crm/auctions/[auctionId]/ManageLotImages.button.tsx` | T-003 Modify | Yes | OK |
| `client/app/crm/auctions/[auctionId]/LotsList.table.tsx` | T-003 implied | Yes | isLocked prop pass-through — reasonable extension |
| `server/src/modules/lots/lots.controller.ts` | T-002 "Read for context" | Yes (both committed + unstaged) | Out-of-contract modification — see S-1 for why this matters |
| Test scaffold files (*.test.tsx, *.spec.ts) | All tasks — "Test files exist" DoD | Yes | Expected |

---

## Findings

### Significant

#### S-1 — Guard refactored to controller layer, violating T-002's explicit architectural principle
**Where:** `server/src/modules/lots/lots.controller.ts:89,114,127,141` (unstaged state)
**What:** The in-progress unstaged refactoring removes `assertAuctionEditable()` from `lots.service.ts` and introduces `checkEditableStatus()` in `auctions.service.ts`, called from the controller before each mutating handler. This means `lotsService.updateLot()`, `createPresignedUrls()`, `addImages()`, and `removeImage()` contain no status guard. Any caller that bypasses the controller (a WebSocket handler, another service, a future admin task) can freely mutate lots on a started or finished auction.
**Why Significant:** T-002 Notes explicitly state: _"The guard lives at the service layer so it applies regardless of which controller or future integration path calls these methods."_ `lots.controller.ts` is also listed under "Read for context (no changes expected)" — it is an out-of-contract file. The functional DoD checklist items are satisfied, but the stated design rationale is not.
**Suggested fix:** Reinstate the status check inside the relevant `lots.service.ts` methods. The cleanest option is to call `this.auctionsService.checkEditableStatus(userId, auctionId)` at the top of `updateLot`, `createPresignedUrls`, `addImages`, and `removeImage`. The controller does not need its own pre-call — it can trust the service.

---

#### S-2 — `POST /auctions/:auctionId/lots` (create lot) is unguarded at the backend
**Where:** `server/src/modules/lots/lots.controller.ts:41-48`, `server/src/modules/lots/lots.service.ts:63-79`
**What:** The create-lot endpoint has no `checkEditableStatus` call — neither in the controller handler nor inside `lotsService.createLots()`. A direct API call can create lots on a `STARTED` or `FINISHED` auction, bypassing the frontend button lock added by T-003. `DELETE /lots/:lotId` is intentionally unguarded (lots may be deleted mid-auction by design).
**Why Significant:** T-003 disables the Create Lot button for non-CREATED auctions — the frontend and backend are asymmetric. Without a backend guard, the frontend protection is bypassable by any HTTP client. Though not in T-002's explicit DoD checklist, it is an implied consequence of the feature's stated goal: "corrupted in-progress state" (T-002 §1).
**Suggested fix:** Add `await this.auctionsService.checkEditableStatus(userId, auctionId)` as the first line of `lotsService.createLots()` (per S-1's recommendation of service-layer placement). Add unit tests covering `BadRequestException` when auction status is `STARTED` or `FINISHED`.

---

#### S-3 — Every guarded lot mutation triggers two sequential auction fetches
**Where:** `server/src/modules/lots/lots.controller.ts:89` → `auctions.service.ts:83` then `lots.service.ts:48-50`
**What:** The controller calls `checkEditableStatus(userId, auctionId)` which internally calls `findOne()` — one DB round-trip for the auction. Each subsequent service method (e.g. `updateLot`) calls `findLot()` → `findAuction()` → `auctionsService.findOne()` — a second DB round-trip for the same auction. Every guarded mutation hits the auction table twice. The same pattern exists for `createPresignedUrls`, `addImages`, and `removeImage` in their controller-call path.
**Why Significant:** The double-fetch is unnecessary latency on every write path. It also creates a TOCTOU window: the auction status could change between the guard fetch and the operation fetch (unlikely in practice but architecturally unsound).
**Suggested fix:** (a) Have `checkEditableStatus` return the fetched `Auction` entity and pass it into the service method, avoiding the second lookup. Or (b) add a `findAuctionEditable(userId, auctionId)` helper in `AuctionsService` that checks ownership and status in one query and returns the entity, replacing both `findOne` calls. Per S-1's fix, if the guard moves back to the service, the service can do a single fetch that handles both ownership and status in `findLot`'s already-loaded auction context.

---

#### S-4 — Controller-level guard integration has no test coverage
**Where:** `server/src/modules/lots/lots.service.spec.ts` (82 lines total)
**What:** T-002's test plan specifies: _"lots.service.ts#updateLot — throws `BadRequestException` when parent auction is `STARTED` or `FINISHED`; succeeds when `CREATED`."_ The guard was moved to the controller, so these service-layer tests were never written and no controller-level tests were added to replace them. `lots.service.spec.ts` only covers `updateLot` success and `NotFoundException`. `checkEditableStatus` is tested in isolation in `auctions.service.spec.ts` (lines 320-359), but the integration — controller calling it, rejection propagating to the HTTP response — is untested. There are also no tests for S-2's gap (create lot with non-CREATED auction).
**Why Significant:** The guard behavior for lot mutations is the core correctness claim of T-002. An untested guard that gets silently removed or bypassed in a future refactor would not be caught.
**Suggested fix:** If the guard moves to the service (S-1), add guard tests directly to `lots.service.spec.ts` for `updateLot`, `createLots`, `createPresignedUrls`, `addImages`, and `removeImage`. Each needs two cases: throws `BadRequestException` when `STARTED`, throws when `FINISHED`. The `AuctionsService` mock in `lots.service.spec.ts` currently only mocks `findOne` — also mock `checkEditableStatus` (or configure `findOne` to return the appropriate status). If the guard stays in the controller, add `lots.controller.spec.ts`.

---

### Nits

#### N-1 — Stale `RoomRepository` provider in `auctions.service.spec.ts`
**Where:** `server/src/modules/auctions/auctions.service.spec.ts:71`
**What:** `RoomRepository` is registered as a provider in the test module but `AuctionsService` does not inject it. A comment at lines 141–144 acknowledges this explicitly. The dead provider is harmless but adds confusion when reading or extending the test.
**Suggested fix:** Remove the `{ provide: RoomRepository, useValue: { clearRoom: jest.fn() } }` block and the `RoomRepository` import at line 10.

---

#### N-2 — Stale `preload` mock in the auction repository mock
**Where:** `server/src/modules/auctions/auctions.service.spec.ts:63`
**What:** The repository mock includes `preload: jest.fn()` but this diff replaced the `preload` call in `auctions.service.ts#updateOne` with a direct `findOne` call. The mock method is never invoked and its presence implies `preload` is still used.
**Suggested fix:** Remove the `preload: jest.fn()` entry from the repository mock object.

---

## Alignment with task files

No ADR or Feature Spec exists for FEAT-004. Alignment is checked against the three task files only.

- ✅ T-001 implementation plan followed step-by-step (DTO → client type → badge → finishedAt conditional).
- ✅ T-001 reference to `Auction.status.tsx` badge used correctly — imported and rendered.
- ⚠️ T-002 implementation plan says guard in `lots.service.ts` (S-1). Controller is listed as read-only context.
- ⚠️ T-002 test plan specifies `lots.service.ts#updateLot` guard tests — not written (S-4).
- ✅ T-003 `isLocked` computed as `auction.status !== AuctionStatus.CREATED` — matches plan exactly.
- ✅ T-003 `disabled` prop wired to shadcn `<Button disabled>` on all three components — no custom CSS, correct.
- ✅ T-003 buttons stay rendered in both states — confirmed, no conditional mount/unmount.

---

## Test scaffold coverage

| Scaffold file | Task Plan entry | Shape |
|---|---|---|
| `page.test.tsx` (6 `.todo()`) | T-001: page renders status badge for each status; hides/shows finishedAt | Correct placeholder; needs RTL fill |
| `CreateLot.button.test.tsx` (2 `.todo()`) | T-003: disabled/enabled assertions | Correct placeholder |
| `DeleteLot.button.test.tsx` (2 `.todo()`) | T-003: disabled/enabled assertions | Correct placeholder |
| `ManageLotImages.button.test.tsx` (2 `.todo()`) | T-003: disabled/enabled assertions | Correct placeholder |
| `auctions.service.spec.ts` — `findOne` describe | T-001: finishedAt cases | Filled (unstaged) — correct |
| `auctions.service.spec.ts` — `updateOne` describe | T-002: guard cases | Filled (unstaged) — correct |
| `auctions.service.spec.ts` — `checkEditableStatus` describe | T-002: guard unit test | Filled (unstaged) — correct |
| `lots.service.spec.ts` — `updateLot` describe | T-002: guard for updateLot | Missing guard cases — see S-4 |

---

## Open questions for the user

- **Q1:** Is the guard-at-controller pattern (S-1) a deliberate departure from T-002, or is the plan still to move it back to the service before the PR lands? If controller-layer is the final intent, T-002 Notes should be updated to reflect the new rationale.
- **Q2:** For S-3 (double fetch): Is the extra round-trip acceptable given typical auction load, or should it be addressed before merge?

---

## Out of scope for this review

- Deep security audit (OWASP pass on auth, token validation) → `sdlc-security`.
- Test logic correctness (filling `.todo()` scaffolds, asserting exact DOM output) → `sdlc-tests`.
- Diagram updates (no new container or actor was introduced) → not required.
