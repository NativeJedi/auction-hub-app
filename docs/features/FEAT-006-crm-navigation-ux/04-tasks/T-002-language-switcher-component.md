# Task T-002: LanguageSwitcher Component

**Task ID:** T-002
**Feature:** FEAT-006-crm-navigation-ux
**Status:** Todo
**Priority:** Must-have
**Depends on:** none

---

## 1. Context

FR-6 requires a language-switcher control visible in the CRM header on every protected CRM page. The control is non-functional in v1 — only "EN" is active. ADR Decision 3 resolved how the inactive locales are communicated: non-EN items (FR, DE) appear with muted styling, `aria-disabled="true"`, and a "Coming soon" tooltip on hover/focus. This component is a standalone UI primitive that can be built and tested independently before being mounted in `CrmHeader`.

Related requirements: FR-6, NFR-3, AC-5

## 2. Description

Build a `<LanguageSwitcher>` component using shadcn/ui `DropdownMenu`. The trigger button displays the current locale label ("EN") with a chevron-down icon. The dropdown lists three locale items: EN (active, with a checkmark), FR and DE (both disabled with a "Coming soon" `Tooltip` on hover/focus). Clicking EN does nothing in v1; FR and DE are not interactive. The component receives no props in v1 (locale is hardcoded to "EN").

## 3. Files to Touch

**Create:**
- `client/src/components/LanguageSwitcher.tsx` — dropdown language switcher component
- `client/src/components/LanguageSwitcher.test.tsx` — test scaffold

**Read for context (no changes expected):**
- `docs/features/FEAT-006-crm-navigation-ux/02-prototype.html` — dropdown visual: checkmark on EN, muted + "coming soon" label on FR/DE
- `docs/features/FEAT-006-crm-navigation-ux/03-adr.md` — Decision 3 §9 (exact pattern: `<Tooltip content="Coming soon"><DropdownMenuItem aria-disabled="true">FR</DropdownMenuItem></Tooltip>`)

## 4. Implementation Plan

1. Import `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem` from `@/ui-kit/ui/dropdown-menu` and `Tooltip`, `TooltipTrigger`, `TooltipContent`, `TooltipProvider` from `@/ui-kit/ui/tooltip`.
2. Render the trigger: `<Button variant="ghost" size="sm">EN <ChevronDownIcon /></Button>`.
3. Define a `locales` array: `[{ code: 'EN', label: 'EN', active: true }, { code: 'FR', label: 'FR', active: false }, { code: 'DE', label: 'DE', active: false }]`.
4. Map locales in `DropdownMenuContent`:
   - Active (EN): `<DropdownMenuItem>` with `CheckIcon` prepended.
   - Inactive (FR, DE): wrap `<DropdownMenuItem aria-disabled="true" className="text-muted-foreground cursor-default">` inside `<TooltipProvider><Tooltip><TooltipTrigger asChild>...</TooltipTrigger><TooltipContent>Coming soon</TooltipContent></Tooltip></TooltipProvider>`.
5. Export the component as default.

## 5. Definition of Done

- [ ] All code in "Files to Touch" is written and lints cleanly.
- [ ] Test scaffold file exists.
- [ ] No regressions in existing tests.
- [ ] Code follows existing project conventions and patterns.
- [ ] EN item renders with a checkmark icon (AC-5).
- [ ] FR and DE items have `aria-disabled="true"` and show "Coming soon" tooltip text on hover/focus (Decision 3).
- [ ] Trigger button is labelled "EN" and uses shadcn/ui `Button` primitive (NFR-3).
- [ ] Component renders without errors when mounted in isolation.

## 6. Test Plan

**Component tests (RTL):**
- Trigger button renders with text "EN".
- Opening the dropdown shows three locale items.
- EN item contains a checkmark element.
- FR and DE items have `aria-disabled="true"`.
- "Coming soon" tooltip text is accessible on FR/DE items (check `TooltipContent` content).

**Unit tests (Vitest):** none — no pure logic outside the component.

**E2E tests (Playwright):** none at component level; visual smoke covered by T-004 E2E.

**Test data needs:** none (locale list is hardcoded in v1).

## 7. Notes & Considerations

- `TooltipProvider` may already exist higher in the tree (e.g., root layout). Check before adding a second provider; nesting is fine with shadcn/ui but avoid redundancy.
- ADR Decision 3 §7 known limitation: "Coming soon" is hardcoded English for v1 — do NOT extract it to a translation key yet.
- Prototype shows the "coming soon" as a 10px muted label inline below the locale code, not a tooltip. ADR Decision 3 chose the tooltip variant. Follow the ADR.

## 8. References

- Feature Spec: `01-feature-spec.md` — §6 FR-6, §7 NFR-3, §8 product tradeoff (language switcher stub), §9 AC-5
- ADR: `03-adr.md` — Decision 3 §5 (tooltip approach), §9 (exact component pattern)
- Related tasks: T-004 (mounts this component inside the new CrmHeader)
