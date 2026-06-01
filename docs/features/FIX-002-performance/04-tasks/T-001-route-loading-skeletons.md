# Task T-001: Add route-level loading skeletons

**Task ID:** T-001
**Feature:** FIX-002-performance
**Status:** Todo
**Priority:** Must-have
**Depends on:** none

---

## 1. Context

The CRM and results routes are `async` Server Components that `await` data from NestJS before
rendering. Without a `loading.tsx` Suspense boundary, the App Router keeps the previous page frozen
until the server finishes — this is the main cause of the "sluggish transitions" symptom. This task
adds streaming skeletons so navigation feels instant.

Related requirements: RF-1 (see `00-performance-review.md`).

## 2. Description

Add a `loading.tsx` to each `await`-ing route segment so Next streams an instant skeleton on
navigation. Skeletons reuse the existing `Skeleton` primitive and mirror the real page layout
(header + table / stats) to minimize layout shift when the content swaps in.

## 3. Files to Touch

**Create:**
- `client/app/crm/auctions/loading.tsx` — skeleton for the auctions list (header + table rows)
- `client/app/crm/auctions/[auctionId]/loading.tsx` — skeleton for auction detail (header + lots table)
- `client/app/results/[auctionId]/loading.tsx` — skeleton for results (header + stats + table)

**Read for context (no changes expected):**
- `client/app/crm/auctions/page.tsx` — layout to mirror
- `client/app/crm/auctions/[auctionId]/page.tsx` — layout to mirror
- `client/app/results/[auctionId]/page.tsx` — layout to mirror
- `client/app/room/[auctionId]/components/CurrentLot.tsx` — example of existing `Skeleton` usage
- `client/src/ui-kit/ui/skeleton.tsx` — the primitive to reuse

## 4. Implementation Plan

1. Inspect each target `page.tsx` to capture its top-level structure (header, controls, table/stats).
2. Create `client/app/crm/auctions/loading.tsx` rendering a header bar + N skeleton table rows, reusing `Skeleton` and the same container classes (`HeadedLayout` already wraps via the segment layout).
3. Create `client/app/crm/auctions/[auctionId]/loading.tsx` mirroring the detail header + lots table skeleton.
4. Create `client/app/results/[auctionId]/loading.tsx` mirroring the stats cards + results table skeleton.
5. Keep each `loading.tsx` a pure Server Component (no `'use client'`), markup only.

## 5. Definition of Done

The task is complete when:

- [ ] All three `loading.tsx` files exist and lint cleanly.
- [ ] No `'use client'` directive in any of them (they are static skeletons).
- [ ] No regressions in existing tests.
- [ ] Code follows existing project conventions and patterns.
- [ ] Navigating into `/crm/auctions`, an auction detail, and a results page shows a skeleton immediately instead of a frozen previous page.
- [ ] Skeleton layout approximates the real layout (no large content jump on swap-in).

## 6. Test Plan

**Unit tests (Vitest):** none (static markup).

**Component tests (RTL):**
- Optional smoke test that each `loading.tsx` renders without crashing and contains skeleton placeholders.

**E2E tests (Playwright):** none required for this task.

**Test data needs:** none.

## 7. Notes & Considerations

- This is the highest-impact, lowest-risk fix — purely additive, no behavior change.
- Do not over-build the skeletons; approximate shapes are enough to remove the perceived stall.

## 8. References

- Source: `00-performance-review.md` (RF-1)
- Related tasks: T-002 (other first-render fix, independent)
