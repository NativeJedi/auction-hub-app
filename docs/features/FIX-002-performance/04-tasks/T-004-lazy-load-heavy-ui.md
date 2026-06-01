# Task T-004: Lazy-load modals and carousel

**Task ID:** T-004
**Feature:** FIX-002-performance
**Status:** Todo
**Priority:** Should-have
**Depends on:** none

---

## 1. Context

The client uses no `next/dynamic` at all, so click-only UI (CRM modals) and the heavy embla carousel
are statically imported into the first-load JS of the routes that reference them. Code-splitting these
behind `next/dynamic` removes them from the initial bundle and loads them on demand, cutting parse/
execute time on first render.

Related requirements: RF-4 (see `00-performance-review.md`).

## 2. Description

Convert the lot/auction modals and the carousel to dynamic imports so they are fetched only when
actually needed (modal opened, carousel rendered). Modals load with `ssr: false`; the carousel may
keep SSR off as well since it is client-only. Provide lightweight fallbacks where a visible delay is
possible.

## 3. Files to Touch

**Modify:**
- `client/app/crm/auctions/[auctionId]/CreateLot.modal.tsx` — split modal body via `next/dynamic`
- `client/app/crm/auctions/[auctionId]/LotImages.modal.tsx` — split modal body via `next/dynamic`
- `client/app/room/[auctionId]/components/CurrentLot.tsx` — dynamically import the `Carousel` cluster

**Read for context (no changes expected):**
- `client/src/modules/modals/modalRenderer.tsx` — how modals are mounted/registered
- `client/src/modules/modals/ModalLayout.tsx` — modal shell
- `client/src/ui-kit/ui/carousel.tsx` — embla wrapper being split

## 4. Implementation Plan

1. Identify the heaviest leaf of each modal (the form/content), and wrap its import with `dynamic(() => import('...'), { ssr: false })`, keeping the trigger button static.
2. For `CurrentLot.tsx`, dynamically import the `Carousel`/`CarouselContent`/items so embla loads only when a lot has images; render the existing `ImagePlaceholder`/`Skeleton` as the `loading` fallback.
3. Ensure the modal open/close trigger logic still works (only the rendered content is split, not the open state).
4. Verify no SSR mismatch warnings appear (these are client-only widgets → `ssr: false`).
5. Re-check that `react-qr-code` on the room page is only loaded on that route (already route-scoped); split it too only if it materially helps.

## 5. Definition of Done

The task is complete when:

- [ ] Modals and the carousel are loaded via `next/dynamic` and lint cleanly.
- [ ] Modal triggers still open/close correctly; carousel still renders for lots with images.
- [ ] No hydration/SSR mismatch warnings in the console.
- [ ] No regressions in existing tests.
- [ ] Code follows existing project conventions and patterns.
- [ ] `next build` shows the split chunks no longer in the route's first-load JS (spot-check 1-2 routes).

## 6. Test Plan

**Unit tests (Vitest):** none.

**Component tests (RTL):**
- Modal trigger renders without eagerly mounting the modal content; opening it renders the content (with the async import resolved).
- `CurrentLot` shows the fallback then the carousel for a multi-image lot.

**E2E tests (Playwright):** none required for this task.

**Test data needs:**
- `RoomLot` fixture with multiple images for the carousel test.

## 7. Notes & Considerations

- Keep fallbacks cheap (reuse `Skeleton`/placeholder) so the split doesn't introduce a visible flash.
- Don't dynamic-import tiny components — the overhead isn't worth it. Target only embla + modal bodies.

## 8. References

- Source: `00-performance-review.md` (RF-4)
- Related tasks: T-003 (touches the same `CurrentLot.tsx`; coordinate edits if done in parallel)
