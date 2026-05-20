# ADR: CRM Navigation UX — Component Architecture Decisions

**Feature:** FEAT-006-crm-navigation-ux
**ADR ID:** ADR-FEAT-006-01
**Status:** Proposed
**Date:** 2026-05-20
**Decision makers:** sdlc-adr

---

This ADR covers three tightly coupled decisions for FEAT-006. All three affect the same CRM header area and share a dependency on the existing `CrmHeader` contract; splitting them into separate files would obscure their interdependency.

> **Spec conflict:** AC-1 in `01-feature-spec.md` requires "a single-segment 'Auctions' breadcrumb visible on `/crm/auctions`." The updated prototype (confirmed with the designer) omits this breadcrumb on the list page — H1 "Auctions" serves as sufficient location context when there is no parent path to link to. Decision 1 §5 follows the prototype. **`01-feature-spec.md` AC-1 should be updated** to remove the list-page breadcrumb requirement before implementation begins.

---

## Decision 1 — Breadcrumb Placement Strategy

### 1. Context

Per FR-1 through FR-3, CRM pages need a breadcrumb. The spec left two questions open: where to place it (inside `CrmHeader` or below it) and whether to show it on the list page. Both were resolved in the design phase via the updated prototype.

The prototype places the breadcrumb inline in each page's body, above the H1. The list page omits it; the detail page shows `← Auctions` (parent link only — current page = H1, no duplication).

The existing `CrmHeader` is minimal — `{ title: string, action: React.ReactNode }` — and NFR-4 requires its prop contract to remain unchanged.

### 2. Decision Drivers

- NFR-4: Must not break the existing `CrmHeader` prop contract.
- Prototype fidelity: breadcrumb renders above the H1 in the page body, not inside the header bar.
- Page ownership of crumb data: the detail page's second segment requires `auction.name`, which is fetched per-page.
- Simplicity: avoid over-engineering for a two-level hierarchy.

### 3. Options Considered

#### Option A: Per-page `<Breadcrumbs>` component, rendered inline

`CrmHeader` stays unchanged. Pages that need a breadcrumb render a standalone `<Breadcrumbs items={...}>` component in their own JSX, directly above `<CrmHeader>`. The list page simply omits the component.

**Pros:**
- Zero change to `CrmHeader` — NFR-4 fully preserved.
- Each page owns its crumb data naturally; the detail page passes `auction.name` from its own server fetch without threading it through a layout.
- Matches prototype placement exactly.
- Simplest data flow: no context, no prop drilling.

**Cons:**
- No automatic enforcement that future CRM pages include a breadcrumb (must be handled by convention or code review).

**Estimated effort:** 0.5 days

#### Option B: Optional `breadcrumbs` prop on `CrmHeader`

`CrmHeader` gains an optional `breadcrumbs?: BreadcrumbItem[]` prop. When present, it renders the breadcrumb above its own title row.

**Pros:**
- Breadcrumb and page H1 live in one component.

**Cons:**
- Extends `CrmHeader`'s interface beyond its current "title + action" responsibility — violates single-responsibility and NFR-4 spirit.
- The prototype renders the breadcrumb above the H1, not inside the same component — placement would differ.
- Requires every detail-page caller to pass the new prop.

**Estimated effort:** 0.5 days

#### Option C: React Context provider + layout slot

A `BreadcrumbContext` in the CRM layout lets each page call `useBreadcrumbs([...items])` to register crumbs imperatively; the layout renders them in a fixed slot.

**Pros:**
- Pages don't need to know where the breadcrumb renders.

**Cons:**
- Clear over-engineering for a two-level, two-page hierarchy.
- `useEffect`-based crumb registration causes a hydration flash in Next.js App Router RSC pages.
- Context + hook for two static crumb sets is a heavy pattern.

**Estimated effort:** 1.5 days

### 4. Comparison

| Criterion | Option A | Option B | Option C |
|-----------|----------|----------|----------|
| CrmHeader contract unchanged | Yes | No | Yes |
| Matches prototype layout | Yes | Partial | Yes |
| Page ownership of crumb data | Simple (per-page fetch) | Medium (prop threading) | Complex (effect + context) |
| SSR / hydration compatibility | Full | Full | Risk (flash) |
| Implementation complexity | Low | Low | High |

### 5. Decision

**Chosen option: A — Per-page `<Breadcrumbs>` component**

The breadcrumb is rendered inline by each page that needs it. The list page omits it; the detail page renders `← Auctions`. This follows the agreed prototype, keeps `CrmHeader` untouched (NFR-4), and avoids unnecessary engineering for a shallow hierarchy.

**Spec resolution:** This decision supersedes spec AC-1. The list page breadcrumb is omitted — H1 "Auctions" is sufficient context when no parent path exists. `01-feature-spec.md` AC-1 should be updated before implementation.

### 6. Tradeoffs

**Gained:**
- `CrmHeader`'s public interface is frozen; zero regression risk for existing callers.
- Detail page uses its own fetched `auction.name` without any layout-level coupling.
- Prototype-accurate placement: breadcrumb above H1, not embedded in the header bar.

**Sacrificed:**
- No automatic enforcement that new CRM pages include a breadcrumb (convention-based).

### 7. Known Limitations

- Does not address breadcrumbs for deeper CRM hierarchies (e.g., lots nested under auctions). A dynamic crumb utility will be needed if depth grows.
- No automated guard that a page is missing its breadcrumb — relies on visual review or integration tests.

### 8. Future Optimization Opportunities

- **`useCrmBreadcrumbs` helper** — if more than four CRM pages adopt breadcrumbs, a small hook that derives crumb items from `useParams()` eliminates the repetitive items arrays.
- **Route-config-driven breadcrumbs** — if CRM depth grows to three or more levels, a route-to-crumbs mapping driven by Next.js route groups becomes worthwhile.

### 9. Consequences

**For the codebase:**
- New file: `client/src/components/Breadcrumbs.tsx` — semantic `<nav aria-label="Breadcrumb"><ol>` (NFR-1), built with shadcn/ui primitives (NFR-3).
- `client/app/crm/auctions/page.tsx` — no `<Breadcrumbs>` rendered.
- `client/app/crm/auctions/[id]/page.tsx` — renders `<Breadcrumbs items={[{ label: 'Auctions', href: '/crm/auctions' }]} />` above `<CrmHeader>`.
- `client/src/layouts/CrmHeader.tsx` — **no changes**.

**For the team:**
- Convention: new CRM pages that have a parent should render `<Breadcrumbs>` above `<CrmHeader>`.

**For testing:**
- Unit test for `<Breadcrumbs>`: correct `<nav aria-label="Breadcrumb">` structure, `aria-current="page"` on the last segment (NFR-1).
- Page-level tests: detail page renders breadcrumbs; list page does not.

---

## Decision 2 — CRM Global Navigation Bar Composition

### 1. Context

FR-4 (Logout button) and FR-6 (language-switcher stub) must appear on every protected CRM page. NFR-4 forbids changing the existing `CrmHeader` prop contract.

The updated prototype shows a distinct sticky top bar (52 px, dark background) containing the "AuctionHub CRM" brand, the language-switcher dropdown, and the logout flow — visually separate from the per-page H1+action row rendered by `CrmHeader`.

### 2. Decision Drivers

- NFR-4: `CrmHeader` prop contract must not change.
- Global availability: logout and language switcher must appear on every protected CRM page without each page opting in.
- Prototype fidelity: global controls live in a sticky top bar that is visually distinct from per-page content.
- No regression: existing pages that render `<CrmHeader title="..." action={...}>` must continue working unchanged.

### 3. Options Considered

#### Option A: New `CrmTopBar` component added to the CRM layout

A `CrmTopBar` component (brand + logout + language switcher) is placed in the CRM layout file. It renders once, above all page content, on every protected CRM page. `CrmHeader` is untouched.

**Pros:**
- Zero change to `CrmHeader` — NFR-4 fully met.
- Global controls appear automatically on every page via the layout, with no per-page opt-in.
- Clean responsibility split: `CrmTopBar` handles session-level controls; `CrmHeader` handles page-level title+action.
- Matches prototype layout exactly.

**Cons:**
- Two header-level elements in the CRM layout; visual hierarchy must be communicated clearly in CSS (different heights and backgrounds, as in the prototype).

**Estimated effort:** 1 day

#### Option B: Extend `CrmHeader` with `onLogout` and `languageSwitcher` props

`CrmHeader` gains optional `onLogout?: () => void` and `languageSwitcher?: React.ReactNode` props.

**Pros:**
- Single component for all header concerns.

**Cons:**
- Silently breaks NFR-4: existing callers that don't pass the new props render without a logout button.
- Mixes session-global concerns (logout, locale) with page-local concerns (title, action) in one component.
- Every existing `<CrmHeader>` call site must be updated to pass the new props, or a default handler must be injected — both approaches are fragile.

**Estimated effort:** 0.5 days (plus hidden cost: touching every CRM page)

#### Option C: Replace `CrmHeader` with a new all-in-one component

`CrmHeader` is removed and replaced by a richer `CrmPageHeader` that integrates brand, global controls, and per-page title+action.

**Pros:**
- Single component to reason about.

**Cons:**
- Explicitly violates NFR-4 — all existing callers break.
- The prototype clearly separates the sticky top bar from the per-page H1; collapsing them is counter to the agreed design.

**Estimated effort:** 1.5 days + regression risk across all CRM pages

### 4. Comparison

| Criterion | Option A | Option B | Option C |
|-----------|----------|----------|----------|
| CrmHeader contract unchanged | Yes | No | No |
| Global availability via layout | Yes (automatic) | No (per-page opt-in) | Yes |
| Matches prototype | Yes | Partial | No |
| Regression risk | None | Low–Medium | High |
| Implementation complexity | Low | Low | Medium |

### 5. Decision

**Chosen option: A — New `CrmTopBar` in the CRM layout**

A dedicated `CrmTopBar` component handles brand, logout, and language switcher. It lives in the CRM layout and renders automatically on every protected page. `CrmHeader` is not touched.

### 6. Tradeoffs

**Gained:**
- Zero regression risk on existing CRM pages.
- Logout and language switcher are globally available without touching individual pages.
- Prototype-accurate visual separation between the session-level top bar and the per-page header.

**Sacrificed:**
- Two distinct header-level elements in the CRM layout; the visual hierarchy must be enforced via CSS (as in the prototype: different heights, background colors).

### 7. Known Limitations

- If a CRM section ever needs custom top-bar content (e.g., different branding), `CrmTopBar` would require per-section customization. Not a current requirement.

### 8. Future Optimization Opportunities

- **User profile in `CrmTopBar`** — when user account settings are added (currently backlogged), they slot naturally alongside the logout button with no structural change.
- **Mobile `CrmTopBar` variant** — if a mobile CRM pass is done, the top bar can be swapped for a hamburger pattern in the layout without touching individual pages.

### 9. Consequences

**For the codebase:**
- New file: `client/src/layouts/CrmTopBar.tsx` — sticky bar with brand, `<LanguageSwitcher>`, and `<LogoutButton>`.
- CRM layout file (`client/app/crm/layout.tsx`) updated to render `<CrmTopBar />` above `{children}`.
- `client/src/layouts/CrmHeader.tsx` — **no changes**.
- Logout calls the existing `POST /api/auth/logout` route (`client/app/api/auth/logout/route.ts`), then clears `localStorage` room tokens and redirects to `/crm/auth` (FR-5).

**For testing:**
- Unit test for `CrmTopBar`: logout button present, language switcher present.
- Integration test: clicking logout issues POST, clears state, redirects.

---

## Decision 3 — Language-Switcher Disabled-State UX

### 1. Context

FR-6 requires the language switcher to be visible but non-functional in v1 — only "EN" is active. The spec §11 open question ("tooltip 'Coming soon' vs visually disabled") was resolved in the updated prototype: non-EN items in the DropdownMenu display a "Coming soon" tooltip on hover/focus while appearing muted.

### 2. Decision Drivers

- Prototype fidelity: designer explicitly chose the tooltip approach.
- User communication: inform users that other locales are planned, not permanently absent.
- NFR-3: use existing shadcn/ui primitives (DropdownMenu, Tooltip).
- Future extensibility: easy to remove once a locale ships.

### 3. Options Considered

#### Option A: Tooltip "Coming soon" on non-EN items

Non-EN locale items are wrapped in a shadcn/ui `<Tooltip content="Coming soon">`. Items are styled with muted text and `aria-disabled="true"` to signal inactivity, but remain in the tab order so keyboard users receive the tooltip.

**Pros:**
- Explicitly communicates that the feature is planned, not broken.
- Keyboard-accessible (tooltip fires on focus).
- Removing it when a locale ships requires only unwrapping the Tooltip — no structural change.
- shadcn/ui `Tooltip` is already available in the client package.

**Cons:**
- Slightly more markup than a plain disabled attribute.

**Estimated effort:** 0.5 days

#### Option B: `aria-disabled` with muted styling only

Non-EN items rendered with `aria-disabled="true"` and muted color. No tooltip. Users who interact receive no feedback.

**Pros:**
- Minimal markup.

**Cons:**
- No communication of intent — users may assume the feature is permanently unavailable or broken.
- Weaker accessibility: interactive-looking controls with `aria-disabled` but no explanation.

**Estimated effort:** 0.25 days

#### Option C: Hide non-EN locales until supported

DropdownMenu shows only "EN". No trace of other locales.

**Pros:**
- Zero confusion about inactive items.

**Cons:**
- Contradicts spec §8 product tradeoff, which explicitly chose visibility over hiding to establish the UI slot.
- Re-adding items later constitutes a UI change that may affect layout.

**Estimated effort:** 0.25 days

### 4. Comparison

| Criterion | Option A | Option B | Option C |
|-----------|----------|----------|----------|
| Communicates future intent | Yes | No | No |
| Keyboard accessible | Yes | Partial | N/A |
| Matches prototype | Yes | No | No |
| Aligns with spec §8 tradeoff | Yes | Partial | No |
| Markup complexity | Low | Very low | Very low |

### 5. Decision

**Chosen option: A — Tooltip "Coming soon"**

Follows the prototype exactly. The tooltip approach was validated by the designer and satisfies the spec §8 product decision to keep the control visible and communicative rather than hidden.

### 6. Tradeoffs

**Gained:**
- Users understand other locales are planned, reducing confusion and support noise.
- Tooltip is removed by deleting one wrapper when a locale ships — no structural refactor.

**Sacrificed:**
- Tooltip wrapper adds minor markup complexity (acceptable with shadcn/ui composable primitives).

### 7. Known Limitations

- The "Coming soon" tooltip text is hardcoded in English for v1. When i18n ships, this string must be extracted along with the rest of the CRM UI strings.

### 8. Future Optimization Opportunities

- **Locale activation without code changes** — when i18n ships, remove the `<Tooltip>` wrapper and `aria-disabled` attribute for the newly supported locale; no component restructure needed.
- **Dynamic locale list** — if locale support is driven by a config or feature flag, the DropdownMenu items can be generated from a locales config array, removing the hardcoded list.

### 9. Consequences

**For the codebase:**
- `CrmTopBar.tsx` uses `DropdownMenu`, `DropdownMenuItem`, and `Tooltip` from shadcn/ui (all already available).
- Non-EN items pattern: `<Tooltip content="Coming soon"><DropdownMenuItem aria-disabled="true">FR</DropdownMenuItem></Tooltip>`.

**For testing:**
- Unit test: non-EN item shows "Coming soon" tooltip on hover/focus; EN item is selectable and calls no action.

---

## 10. References

- Feature Spec: `docs/features/FEAT-006-crm-navigation-ux/01-feature-spec.md`
- Prototype: `docs/features/FEAT-006-crm-navigation-ux/02-prototype.html`
- Existing `CrmHeader`: `client/src/layouts/CrmHeader.tsx`
- Existing logout route: `client/app/api/auth/logout/route.ts`
- Related ADRs: none with overlapping decisions (FEAT-002 covers Redis key strategy; FEAT-005 covers QR code generation)
