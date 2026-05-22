# Task T-001: Breadcrumbs Component

**Task ID:** T-001
**Feature:** FEAT-006-crm-navigation-ux
**Status:** Todo
**Priority:** Must-have
**Depends on:** none

---

## 1. Context

CRM pages need a breadcrumb navigation bar so users can orient themselves and navigate up the hierarchy in one click. This is a pure presentational component with no page-specific dependencies — it can be built and tested in isolation before any CRM page is touched.

Related requirements: FR-1, FR-2, FR-3, NFR-1, NFR-3, AC-2

## 2. Description

Build a reusable `<Breadcrumbs>` component that accepts an array of items (label + optional href) and renders them as a semantic `<nav aria-label="Breadcrumb"><ol>` list. Items with an `href` are clickable links; the last item (current page) carries `aria-current="page"` and is not a link. The visual style uses a separator (`/` or `›`) between segments and follows shadcn/ui typography conventions.

## 3. Files to Touch

**Create:**
- `client/src/components/Breadcrumbs.tsx` — presentational breadcrumb component
- `client/src/components/Breadcrumbs.test.tsx` — test scaffold

**Read for context (no changes expected):**
- `client/src/layouts/CrmHeader.tsx` — existing page header conventions
- `docs/features/FEAT-006-crm-navigation-ux/02-prototype.html` — visual reference for arrow-left icon + "Auctions" label

## 4. Implementation Plan

1. Define the `BreadcrumbItem` type: `{ label: string; href?: string }`.
2. Implement `<Breadcrumbs items={BreadcrumbItem[]} />`:
   - Outer `<nav aria-label="Breadcrumb">` wrapping `<ol className="flex items-center gap-1.5 text-sm">`.
   - Each item is an `<li>`. If it has `href`, render a `<Link>` with muted-foreground hover style. Last item gets `aria-current="page"` and no link.
   - Add a separator `<span aria-hidden="true">/</span>` between items (not after last).
3. For the detail-page use-case (single parent link), the prototype shows `← Auctions` with a left-arrow icon (`ArrowLeftIcon` from lucide-react) prepended to the first item — handle this via a leading icon slot or by convention in the caller.
4. Export `BreadcrumbItem` type and the default component.

## 5. Definition of Done

- [ ] All code in "Files to Touch" is written and lints cleanly.
- [ ] Test scaffold file exists (actual tests filled by `sdlc-tests`).
- [ ] No regressions in existing tests.
- [ ] Code follows existing project conventions and patterns.
- [ ] Outer element is `<nav aria-label="Breadcrumb">` wrapping `<ol>` with `<li>` items (NFR-1).
- [ ] Last item has `aria-current="page"` and is not wrapped in an `<a>` (NFR-1).
- [ ] Items with `href` render as Next.js `<Link>` components.
- [ ] Component accepts an empty array without errors.

## 6. Test Plan

**Unit / Component tests (Vitest + RTL):**
- Renders correct number of `<li>` elements for a given items array.
- Last item has `aria-current="page"` attribute.
- Items with `href` render as links; items without `href` do not.
- Empty array renders an empty `<ol>` without throwing.
- `<nav aria-label="Breadcrumb">` is present in the DOM.

**E2E tests (Playwright):** none — this is a pure presentational component; E2E coverage comes from T-005 (detail page).

**Test data needs:**
- Sample `BreadcrumbItem[]` with one item (no href), two items (first with href, last without).

## 7. Notes & Considerations

- The prototype shows `← Auctions` using `ArrowLeftIcon` (lucide-react). The component itself does not need to hardcode the icon — the detail page (T-005) can compose `<ArrowLeftIcon>` + text inside the `label` string or the caller can prepend it. Keep the component generic.
- shadcn/ui does ship a `Breadcrumb` primitive (as of shadcn 2.x) — check if it's already installed in the client before writing a custom one. If present, wrap it rather than duplicating. If absent, build the semantic structure directly.
- NFR-3 requires shadcn/ui primitives for consistency; if the shadcn Breadcrumb primitive is not installed, use its Tailwind token palette for colors (e.g. `text-muted-foreground`).

## 8. References

- Feature Spec: `01-feature-spec.md` — §6 FR-1/FR-2/FR-3, §7 NFR-1/NFR-3
- ADR: `03-adr.md` — Decision 1 §5 (chosen: per-page Breadcrumbs component, inline above H1)
- Prototype: `02-prototype.html` — detail page breadcrumb visual
- Related tasks: T-005 (consumes this component on the detail page)
