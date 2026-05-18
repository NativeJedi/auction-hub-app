# Task T-003: Disable Lot Mutation Buttons When Auction Is Started

**Task ID:** T-003
**Feature:** FEAT-004-auction-status-and-edit-guards
**Status:** Todo
**Priority:** Must-have
**Depends on:** T-001

---

## 1. Context

The `/crm/auctions/[auctionId]` detail page lets admins create lots, delete lots, and
manage lot images. Once an auction is started, none of these mutations should be
permitted — the backend (T-002) enforces this at the API layer, but the UI should
reflect the locked state proactively to prevent confusing error flows.

This task wires the auction status (already visible on the page after T-001) into the
three mutation button components so they become visually disabled when the auction is
`STARTED` or `FINISHED`. It depends on T-001 because both tasks modify `page.tsx` and
T-001's changes must land first to avoid a merge conflict.

Related requirements: REQ-3 (frontend disable for lot mutations)

## 2. Description

Compute a boolean `isLocked` flag from the auction status in `page.tsx` and pass it as
a prop to `CreateLotButton`, `DeleteLotButton`, and `ManageLotImagesButton`. Each button
component should render its underlying `<Button>` as `disabled` when `isLocked` is
`true`. Buttons stay rendered (not conditionally removed) so the page layout does not
shift.

## 3. Files to Touch

**Modify:**
- `client/app/crm/auctions/[auctionId]/page.tsx` — compute `isLocked`, pass as prop to the three buttons
- `client/app/crm/auctions/[auctionId]/CreateLot.button.tsx` — accept `disabled` prop and apply it
- `client/app/crm/auctions/[auctionId]/DeleteLot.button.tsx` — accept `disabled` prop and apply it
- `client/app/crm/auctions/[auctionId]/ManageLotImages.button.tsx` — accept `disabled` prop and apply it

**Read for context (no changes expected):**
- `client/src/api/dto/auction.dto.ts` — `AuctionStatus` enum values
- `client/app/crm/auctions/[auctionId]/StartAuction.button.tsx` — reference for existing button prop patterns

## 4. Implementation Plan

1. In `page.tsx`, after the auction fetch, compute:
   ```ts
   const isLocked = auction.status !== AuctionStatus.CREATED;
   ```
   Pass `isLocked` as a prop to `<CreateLotButton>`, `<DeleteLotButton>`, and `<ManageLotImagesButton>`.
2. In `CreateLot.button.tsx`, add `disabled?: boolean` to the component props interface and wire it to the `<Button disabled={disabled}>` (or the trigger of the confirmation modal).
3. In `DeleteLot.button.tsx`, add `disabled?: boolean` and apply it similarly. The button should be disabled before any confirmation modal opens, so the modal itself never fires when locked.
4. In `ManageLotImages.button.tsx`, apply the same `disabled` pattern.
5. Verify that the `disabled` shadcn/ui `<Button>` renders with correct visual treatment (muted/opacity) — no custom CSS needed; shadcn handles this via the `disabled` attribute.

## 5. Definition of Done

- [ ] All code lints cleanly.
- [ ] Test files exist (scaffolded).
- [ ] No regressions in existing tests.
- [ ] Code follows existing project conventions.
- [ ] All three mutation buttons are visually disabled when auction status is `STARTED` or `FINISHED`.
- [ ] All three mutation buttons are fully active when auction status is `CREATED`.
- [ ] Buttons remain rendered in both states (no conditional mount/unmount).
- [ ] No confirmation modals open when a button is in the disabled state.

## 6. Test Plan

**Unit tests (Vitest):**
- None (no pure logic to isolate).

**Component tests (RTL):**
- `CreateLot.button.tsx` — renders a disabled `<button>` element when `disabled={true}`; renders an enabled `<button>` when `disabled={false}`
- `DeleteLot.button.tsx` — same disabled/enabled assertions
- `ManageLotImages.button.tsx` — same disabled/enabled assertions

**E2E tests (Playwright):**
- Happy path: navigate to a started auction's detail page, assert CreateLot button is disabled, assert ManageLotImages button is disabled

**Test data needs:**
- Auction fixture with status `STARTED` for component and e2e tests

## 7. Notes & Considerations

- `StartAuction.button.tsx` can serve as a reference for how existing button components handle conditional rendering and prop patterns in this directory.
- shadcn/ui `<Button>` passes the `disabled` HTML attribute through by default — no custom styling needed.
- If any button component uses a separate trigger element (e.g. inside a `<Dialog>` or `<AlertDialog>`), apply `disabled` on the trigger, not the dialog's action button, so the modal never opens.

## 8. References

- Feature: FEAT-004-auction-status-and-edit-guards
- Related tasks: T-001 (prerequisite — modifies `page.tsx` first), T-002 (backend complement)
