# Task T-001: Add Reset Auction Button to Admin Room Page

**Task ID:** T-001
**Feature:** FEAT-003-auction-reset-button
**Status:** Todo
**Priority:** Must-have
**Depends on:** none

---

## 1. Context

Admins currently have no way to reset an auction back to its initial state once it has been started or finished. The reset capability lets the admin clear all bids, restore all lots to `CREATED`, remove buyer records, and return the auction to `CREATED` status — allowing the auction to be run again from scratch without leaving the admin room.

The server already contains the full reset logic (`room.service.ts:restartAuction()` → `clearRoom()` + `auctionsService.restartAuction()`) but it is guarded behind a `FINISHED`-only check. That guard must be broadened to allow reset from `STARTED` state as well. All client-side wiring (API request function, engine action, UI button with confirmation) is new.

Related requirements: no formal spec — feature is fully constrained by existing conventions.

## 2. Description

A "Reset Auction" button is added to the admin room page header. Clicking it opens a confirmation modal (using the project-standard `confirmModal.show()`) that explains exactly what data will be erased. On confirmation, the client calls `POST /room/:auctionId/restart`, which clears Redis state and resets the database records in a transaction. After a successful reset, the admin is navigated to the pre-start room page (`/room/:auctionId`) where they can start the auction again.

## 3. Files to Touch

**Create:**
- *(no new files — all changes are modifications)*

**Modify:**
- `server/src/modules/room/room.service.ts` — broaden `restartAuction()` guard from `FINISHED`-only to also allow `STARTED`
- `client/src/api/auctions-api-client/requests/room.ts` — add `restartAuction` request function
- `client/src/modules/room-engine/admin/AdminRoomEngine.ts` — extend `AdminRoomApi` interface and add `resetAuction()` action
- `client/app/room/[auctionId]/admin/page.tsx` — add Reset button to the `RoomHeader`

**Read for context (no changes expected):**
- `server/src/modules/room/room.repository.ts` — verify `clearRoom()` covers all Redis keys
- `client/app/crm/auctions/[auctionId]/StartAuction.button.tsx` — `confirmModal.show()` usage pattern to mirror
- `client/src/modules/modals/ConfirmModal.ts` — confirm modal API shape

## 4. Implementation Plan

1. **Server guard**: In `room.service.ts:restartAuction()`, replace the `status !== AuctionStatus.FINISHED` guard with a check that allows both `FINISHED` and `STARTED` states (i.e. throw only if status is `CREATED`). The downstream `clearRoom()` and `auctionsService.restartAuction()` already handle both states correctly.

2. **API request function**: In `client/src/api/auctions-api-client/requests/room.ts`, add:
   ```ts
   export const restartAuction = ({ auctionId }: { auctionId: string }) =>
     auctionsApiClient.post(`/room/${auctionId}/restart`);
   ```

3. **Engine interface + action**: In `AdminRoomEngine.ts`, add `restartAuction` to `AdminRoomApi`, update `defaultApi`, and add:
   ```ts
   async resetAuction(): Promise<void> {
     await this.api.restartAuction({ auctionId: this.auctionId });
   }
   ```

4. **Admin page button**: In `page.tsx`, import `confirmModal`, `useRouter`, and `useErrorNotification`. Add an async `handleReset` handler that:
   - calls `confirmModal.show({ title: 'Reset Auction?', description: 'This will clear all bids, reset all lots to their initial state, and remove buyer records. The auction will return to CREATED status.' })`
   - returns early if `result === 'closed'`
   - calls `await engine.resetAuction()`
   - navigates to `/room/${auctionId}` via `router.push`
   - calls `onError(error)` on failure
   
   Render a `<Button variant="outline">` with a `RotateCcwIcon` icon in the `RoomHeader` alongside the existing buttons.

## 5. Definition of Done

- [ ] All code in "Files to Touch" is written and lints cleanly.
- [ ] Test files exist (scaffolded — actual tests filled in by `sdlc-tests`).
- [ ] No regressions in existing tests.
- [ ] Code follows existing project conventions and patterns.
- [ ] `POST /room/:id/restart` succeeds when auction is in `STARTED` state (previously 400).
- [ ] `POST /room/:id/restart` still succeeds when auction is in `FINISHED` state.
- [ ] `POST /room/:id/restart` still throws `BadRequestException` when auction is in `CREATED` state (nothing to reset).
- [ ] Reset button is visible in the admin room header.
- [ ] Clicking Reset shows the confirmation modal with the data-loss description.
- [ ] Cancelling the confirmation leaves the auction unchanged.
- [ ] Confirming resets the auction and navigates to `/room/:auctionId`.
- [ ] API errors are surfaced via `useErrorNotification`.

## 6. Test Plan

**Unit tests (Vitest / Jest — server):**
- `room.service.ts:restartAuction()` — verify it succeeds for `STARTED` state, succeeds for `FINISHED` state, and throws for `CREATED` state.

**Unit tests (Vitest — client):**
- `AdminRoomEngine.resetAuction()` — verify it calls `api.restartAuction` with the correct `auctionId`.

**Component tests (RTL):**
- Admin page `handleReset` — mock `engine.resetAuction` and `router.push`; assert confirmation modal is shown; assert navigation happens on confirm; assert no navigation on cancel.

**E2E tests (Playwright):**
- Not required for this task — covered adequately by unit + component tests.

**Test data needs:**
- Server unit test needs a mock auction in each of the three statuses.

## 7. Notes & Considerations

- **CREATED state guard**: Resetting a not-yet-started auction makes no sense. The guard should remain for `CREATED` status — only `STARTED` and `FINISHED` should be resettable.
- **Button icon**: Use `RotateCcwIcon` from `lucide-react` to visually distinguish it from the destructive `PowerIcon` (Finish).
- **Redis state**: `clearRoom()` in `room.repository.ts` purges all keys for the auction. Verify it covers `bids:{auctionId}:{lotId}` keys (wildcard delete) before marking done.
- **Socket-connected clients**: When the admin resets mid-auction, member and public clients will have stale state. They will need to refresh manually. This is acceptable for the initial implementation — a `auctionReset` broadcast event is out of scope.

## 8. References

- Feature Spec: *(none — low-complexity feature, no formal spec)*
- ADR: *(none)*
- Related tasks: none
- Key server file: `server/src/modules/room/room.service.ts:271` (`restartAuction`)
- Key client patterns: `client/app/crm/auctions/[auctionId]/StartAuction.button.tsx` (confirmModal), `client/src/modules/room-engine/admin/AdminRoomEngine.ts:105` (finishAuction action)
