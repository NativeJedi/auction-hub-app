# Task T-003: Migrate lot images to next/image

**Task ID:** T-003
**Feature:** FIX-002-performance
**Status:** Todo
**Priority:** Should-have
**Depends on:** none

---

## 1. Context

Lot images render via raw `<img>` tags even though `next.config.ts` already whitelists the MinIO and
S3 hosts in `images.remotePatterns`. Raw tags mean full-size downloads, no lazy loading, and no
reserved dimensions (layout shift). Switching to `next/image` gives automatic resizing/WebP, lazy
loading, and CLS-free rendering on image-heavy room and lot screens.

Related requirements: RF-3 (see `00-performance-review.md`).

## 2. Description

Replace the raw `<img>` usages for lot images with `next/image`, choosing the right sizing strategy
per context (fill for the carousel/aspect containers, fixed/responsive for the modal thumbnails).
Provide `sizes` so the optimizer picks sensible widths, and ensure containers have defined dimensions.

## 3. Files to Touch

**Modify:**
- `client/app/room/[auctionId]/components/CurrentLot.tsx` — carousel `<img>` → `next/image` (`fill` + `object-contain`, `sizes`)
- `client/app/crm/auctions/[auctionId]/LotImages.modal.tsx` — thumbnail/preview `<img>` → `next/image`

**Read for context (no changes expected):**
- `client/next.config.ts` — confirm `remotePatterns` cover all image origins actually used
- `client/src/ui-kit/ui/carousel.tsx` — carousel slot sizing constraints

## 4. Implementation Plan

1. In `CurrentLot.tsx`, wrap each carousel slide image in a positioned container and use `<Image fill className="object-contain" sizes=... alt=... />`; keep the existing aspect/min-h classes on the container.
2. In `LotImages.modal.tsx`, replace the `<img>` with `<Image>`, using explicit `width`/`height` or a `fill` container matching the current layout.
3. Confirm every image host in use is present in `images.remotePatterns`; add any missing origin (e.g. `*.googleusercontent.com` is only for avatars — not needed here).
4. Verify the CSP `img-src` in `next.config.ts` still permits the optimized image route (`/_next/image`) and the upstream origins.
5. Visually check carousel and modal: no stretched/cropped regressions, no broken images.

## 5. Definition of Done

The task is complete when:

- [ ] No raw `<img>` remains for lot images in the two files; both use `next/image`, lint clean.
- [ ] Images have defined dimensions (`fill` container or `width`/`height`) — no layout shift on load.
- [ ] `sizes` is set for `fill` images so the optimizer requests appropriately sized assets.
- [ ] No regressions in existing tests.
- [ ] Code follows existing project conventions and patterns.
- [ ] Lot images still render correctly in the room carousel and the CRM image modal.

## 6. Test Plan

**Unit tests (Vitest):** none (presentational).

**Component tests (RTL):**
- `CurrentLot` renders an image element when `lot.images` is non-empty and the placeholder when empty.

**E2E tests (Playwright):** none required for this task.

**Test data needs:**
- A `RoomLot` fixture with one and with multiple `images` entries.

## 7. Notes & Considerations

- `next/image` requires either parent `position: relative` for `fill` or explicit `width`/`height`; the existing aspect-ratio containers are good `fill` hosts.
- Double-check MinIO URLs work through `/_next/image` in dev (local http origin must match `remotePatterns`).

## 8. References

- Source: `00-performance-review.md` (RF-3)
- Related tasks: none
