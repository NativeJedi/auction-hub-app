# Task T-005: Auction Detail Page Redesign + Breadcrumbs

**Task ID:** T-005
**Feature:** FEAT-006-crm-navigation-ux
**Status:** Todo
**Priority:** Must-have
**Depends on:** T-001, T-004

---

## 1. Context

The auction detail page (`/crm/auctions/[id]`) currently wraps its auction info in a `Card` component. The prototype specifies a different layout: a `<Breadcrumbs>` element ("`← Auctions`") above an inline H1 + status badge + action buttons row — no Card wrapper. ADR Decision 1 confirms the breadcrumb is placed inline above the H1 in the page body. This task redesigns the detail page to match the prototype and adds the `<Breadcrumbs>` component from T-001. The list page (`/crm/auctions`) requires no breadcrumb (ADR Decision 1: H1 "Auctions" is sufficient context).

Related requirements: FR-1, FR-2, FR-3, AC-2, AC-3

## 2. Description

Redesign `app/crm/auctions/[auctionId]/page.tsx` to replace the Card-wrapped auction header with an inline layout matching the prototype: `<Breadcrumbs>` with a single "Auctions" item (linking to `/crm/auctions`) above a row containing H1 auction name, `<AuctionStatusBadge>`, and action buttons. The description, meta info (dates, ID), and the Lots section with `<CrmPageHeader>` remain structurally unchanged. The `<Breadcrumbs>` component from T-001 is consumed here for the first time.

## 3. Files to Touch

**Modify:**
- `client/app/crm/auctions/[auctionId]/page.tsx` — remove Card wrapper from auction header, add `<Breadcrumbs>`, inline H1 + status + actions

**Read for context (no changes expected):**
- `client/src/components/Breadcrumbs.tsx` — from T-001 (BreadcrumbItem type + component API)
- `docs/features/FEAT-006-crm-navigation-ux/02-prototype.html` — detail page visual: breadcrumb, H1 row, description, meta, divider, Lots section
- `client/app/crm/auctions/[auctionId]/page.test.tsx` — existing test (must not regress)

**Create:**
- `client/app/crm/auctions/[auctionId]/page.test.tsx` — already exists; if the redesign breaks its assertions, update them (do not delete existing coverage)

## 4. Implementation Plan

1. Import `Breadcrumbs` and `BreadcrumbItem` from `@/src/components/Breadcrumbs`.
2. Remove the outer `<Card>/<CardHeader>/<CardContent>` wrapper around the auction header section.
3. In its place, render:
   ```
   <div className="space-y-4">
     <Breadcrumbs items={[{ label: 'Auctions', href: '/crm/auctions' }]} />
     <div className="flex items-center justify-between">
       <div className="flex items-center gap-3">
         <h1 className="text-3xl font-bold tracking-tight">{auction.name}</h1>
         <AuctionStatusBadge status={auction.status} />
       </div>
       <div className="flex items-center gap-2">
         {/* existing action buttons: Results, StartAuction, ResetAuction */}
       </div>
     </div>
     {auction.description && (
       <p className="text-base text-foreground">{auction.description}</p>
     )}
     <div className="text-sm text-muted-foreground">
       {/* existing date + ID meta block */}
     </div>
   </div>
   ```
4. Add a visual divider (`<hr className="border-t" />`) between the auction header block and the Lots section, matching the prototype.
5. Keep the `<CrmPageHeader title="Lots" action={...}>` and `<LotsList>` unchanged below the divider.
6. Run `cd client && npx tsc --noEmit` and `npm run lint` to verify no type errors.

## 5. Definition of Done

- [ ] All code in "Files to Touch" is written and lints cleanly.
- [ ] No regressions in existing tests (existing `page.test.tsx` assertions pass or are updated to reflect the new DOM structure).
- [ ] Code follows existing project conventions and patterns.
- [ ] `<Breadcrumbs items={[{ label: 'Auctions', href: '/crm/auctions' }]}>` renders above the H1 on the detail page (AC-2).
- [ ] Clicking the "Auctions" breadcrumb link navigates to `/crm/auctions` (AC-2).
- [ ] H1 shows auction name; `AuctionStatusBadge` is visible in the same row (prototype fidelity).
- [ ] Action buttons (Start/Reset/Results) remain functional and appear in the header row.
- [ ] No `Card` wrapper around the auction-info section (matches prototype layout).
- [ ] Lots section with `CrmPageHeader` and `LotsList` is unchanged and functional.
- [ ] `/crm/auctions` (list page) has no breadcrumb rendered (ADR Decision 1 — omitted on list page).

## 6. Test Plan

**Component / Page tests (RTL):**
- Detail page renders `<nav aria-label="Breadcrumb">` with "Auctions" link pointing to `/crm/auctions`.
- Detail page does NOT render a Card element wrapping auction info.
- H1 contains auction name; status badge is present.
- Action buttons are present based on auction status (existing coverage — verify no regression).
- Lots section renders `CrmPageHeader` with "Lots" title.

**E2E tests (Playwright):**
- On the detail page, clicking the "Auctions" breadcrumb navigates to `/crm/auctions`.
- Detail page renders correctly for an auction in each status: `CREATED`, `STARTED`, `FINISHED`.

**Test data needs:**
- Mock auction fixture with `status: AuctionStatus.CREATED` (existing — verify still works).
- Mock auction fixture with `status: AuctionStatus.FINISHED` (for Results button visibility check).

## 7. Notes & Considerations

- ADR Decision 1 §5: the list page intentionally omits the breadcrumb — H1 "Auctions" is sufficient. Do NOT add `<Breadcrumbs>` to `auctions/page.tsx`.
- Spec AC-1 conflict: the spec says breadcrumb on the list page but the ADR supersedes it. Follow the ADR. The spec note in ADR Decision 1 §5 should be resolved by the team before or during this task.
- The existing `page.test.tsx` at `[auctionId]/page.test.tsx` tests the page render. The Card removal will change the DOM structure — update those assertions rather than deleting them.
- The `<CrmPageHeader>` import in this file was updated in T-004 (renamed from `CrmHeader`). T-004 must be complete before this task begins.
- Prototype shows description text rendered as `<p>` (not `CardDescription`) — use `text-base text-foreground` class directly.

## 8. References

- Feature Spec: `01-feature-spec.md` — §6 FR-1/FR-2/FR-3, §9 AC-2/AC-3
- ADR: `03-adr.md` — Decision 1 §5 (per-page Breadcrumbs, list page omits), §9 (consequences: `[id]/page.tsx` renders `<Breadcrumbs>` above CrmHeader)
- Prototype: `02-prototype.html` — detail page screen
- Related tasks: T-001 (Breadcrumbs component), T-004 (CrmPageHeader rename prerequisite)
