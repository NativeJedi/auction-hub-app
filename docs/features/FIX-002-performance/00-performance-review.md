# FIX-002 — Client Performance

> Source of truth for this fix set. There is **no Feature Spec / ADR** — these tasks come from a
> performance review of the Next.js client (`client/`). Tasks therefore trace to **review findings
> (RF-N)** below instead of FR/NFR/AC IDs.

## Symptoms reported
- Slow first render on some routes.
- Sluggish transitions between pages.

## Findings (RF)

| ID | Finding | Evidence | Severity |
|----|---------|----------|----------|
| RF-1 | No `loading.tsx` anywhere → `async` Server Component routes block navigation with no instant feedback | `find client/app -name loading.tsx` = 0; `client/app/crm/auctions/page.tsx`, `client/app/crm/auctions/[auctionId]/page.tsx` await fetches | High |
| RF-2 | Room engine `connect()` fetches initial data then connects the socket **sequentially** | `client/src/modules/room-engine/core/RoomEngine.ts:65-83` | High |
| RF-3 | Lot images use raw `<img>` (no resize/lazy/dimensions) despite `images.remotePatterns` configured | `client/app/room/[auctionId]/components/CurrentLot.tsx:62`, `client/app/crm/auctions/[auctionId]/LotImages.modal.tsx:94`, `client/next.config.ts:45` | Medium |
| RF-4 | No `next/dynamic` anywhere → modals, carousel, QR statically bundled into route first-load JS | `grep next/dynamic` = 0; modals/carousel imported eagerly | Medium |
| RF-5 | Duplicate / likely-unused UI deps inflate bundle & CSS | `client/package.json`: `daisyui` + `radix-ui` umbrella + individual `@radix-ui/react-*` | Low |

## Out of scope
- SSR-hydrating the realtime room state (larger refactor; only the connect parallelization is in scope here).
- Migrating client data-fetching to a caching layer (e.g. React Query).
- Backend / NestJS changes.
