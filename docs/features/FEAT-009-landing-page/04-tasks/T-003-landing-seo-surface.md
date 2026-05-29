# Task T-003: Add the landing SEO surface (sitemap, robots, metadata)

**Task ID:** T-003
**Feature:** FEAT-009-landing-page
**Status:** Todo
**Priority:** Should-have
**Depends on:** T-001

---

## 1. Context

The ADR's SEO/crawlability driver requires the landing at `/` to be discoverable. The app has no SEO surface today — no `sitemap.ts`, no `robots.ts`, no per-route metadata. This task adds that surface so an anonymous crawler (no session cookie) receives the full server-rendered landing with proper title/description/Open Graph and the root is listed for indexing.

Related requirements: FR-1 (public, indexable entry route); NFR-2 (cross-browser rendering of metadata)

## 2. Description

Add `app/sitemap.ts` listing `/` (and other public routes as appropriate), `app/robots.ts` allowing crawl and pointing at the sitemap, and a `generateMetadata` export on the landing route providing title, description, and Open Graph tags. These make the canonical root URL crawlable and shareable per ADR Decision 2 §9.

## 3. Files to Touch

**Create:**
- `client/app/sitemap.ts` — Next.js sitemap listing the public landing root.
- `client/app/robots.ts` — robots policy referencing the sitemap.
- `client/app/sitemap.test.ts` — scaffold: sitemap includes `/`.

**Modify:**
- `client/app/page.tsx` — add a `generateMetadata` (or static `metadata`) export with title/description/Open Graph for the landing.

**Read for context (no changes expected):**
- `client/app/layout.tsx` — existing `viewport` export / metadata conventions.
- `docs/features/FEAT-009-landing-page/02-prototype.html` — product name/positioning for copy.

## 4. Implementation Plan

1. Add `client/app/robots.ts` exporting a default returning `{ rules: { userAgent: '*', allow: '/' }, sitemap: '<origin>/sitemap.xml' }`.
2. Add `client/app/sitemap.ts` exporting a default returning the public entry route(s) with sensible `lastModified`/priority.
3. Add a `generateMetadata` (or static `metadata`) export in `client/app/page.tsx` with the landing title, description, and Open Graph fields, reusing product naming from the prototype.
4. Scaffold `client/app/sitemap.test.ts` per the Test Plan.

## 5. Definition of Done

The task is complete when:

- [ ] All code in "Files to Touch" is written and lints cleanly.
- [ ] Test files exist (scaffolded — actual tests filled in by `sdlc-tests`).
- [ ] No regressions in existing tests.
- [ ] Code follows existing project conventions and patterns.
- [ ] `/sitemap.xml` includes the landing root and `/robots.txt` allows crawling and references the sitemap.
- [ ] The landing route exposes title, description, and Open Graph metadata in the server-rendered HTML.

## 6. Test Plan

**Unit tests (Vitest):**
- `sitemap.ts` returns an entry for `/`.
- `robots.ts` allows `*` and references the sitemap URL.

**Component tests (RTL):**
- None.

**E2E tests (Playwright):**
- None — no Playwright harness in `client/`.

**Test data needs:**
- None.

## 7. Notes & Considerations

- **Compactness exception:** parallelization gate failed (work is effectively a single sequential unit); created on user request as documentation.
- `generateMetadata` lives in `page.tsx`, the same file T-001 rewrites and T-002 leaves intact — sequence after T-001 to avoid a merge conflict on that file.
- Analytics/event tracking on CTAs (spec §10 Open Question) is explicitly deferred per ADR D2 §8 — out of scope here.
- Use the deployment origin for absolute sitemap/OG URLs; fall back to a relative/base URL if no env origin is configured.

## 8. References

- Feature Spec: `01-feature-spec.md` (FR-1; §10 Open Question — analytics deferred)
- ADR: `03-adr.md` (Decision 2 §9 SEO surface; §8 future cache/analytics)
- Related tasks: T-001 (route placement & dynamic render), T-002 (rendered content)
