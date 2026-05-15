# Code Review — T-001: Build Auction Results Page

**Feature:** FEAT-001-auction-results-page
**Task:** T-001 — Build Auction Results Page
**Reviewer:** sdlc-review (inline — no ADR for this feature)
**Diff base:** working tree vs HEAD
**Diff scope:** 10 modified tracked files + 8 new untracked files, ~+350 / -25 lines
**Date:** 2026-05-15

---

## Summary

Request changes — 2 blocking findings. The core results endpoint and page are solid: the TypeORM join query is correct, stats computation is accurate, the BFF proxy follows existing patterns, and `StatusBadge` is reused. Two hard gaps block merge: the auction **owner** is absent from the endpoint response and page render despite being an explicit AC-4 / FR-6 requirement, and the new `finishedAt` column has no TypeORM migration so `markAsFinished()` will crash in any non-`synchronize` environment. Several files outside the T-001 Files-to-Touch contract were also modified, implementing out-of-scope redirect logic (FR-2–FR-4); this is called out as Significant for auditability.

**Verdict:** Request changes

**Counts:** Blocking: 2 · Significant: 3 · Nits: 3

---

## Definition-of-Done check

- [~] All code in "Files to Touch" is written and lints cleanly — partial: DTO, service, controller, and middleware are done; the page/component/BFF paths deviate from the contract (see S-2).
- [x] Test files exist (scaffolded) — `auctions.service.spec.ts`, `LotResultsTable.test.tsx`, `ResultsStats.test.tsx` all created as scaffolds. ✅
- [~] No regressions in existing tests — cannot verify from diff alone; no existing tests appear to be modified.
- [x] Code follows existing project conventions — overall yes, minor deviations noted in nits.
- [ ] `GET /api/v1/auctions/:id/results` returns auction metadata, stats, and lot list (status, soldPrice, buyerName — no email) — **fails**: `ownerName` / `ownerEmail` absent from response; see B-1.
- [ ] Page renders at `/auctions/[auctionId]/results` without authentication — **fails**: page is mounted at `/results/[auctionId]`, not the specified path; see S-2.
- [x] `StatusBadge` reused for SOLD/UNSOLD — yes, via `DataTable` columns.
- [x] Summary statistics correct: sold + unsold = total, totalValue = sum of soldPrice for SOLD lots — `auctions.service.ts:155–161` logic is correct. ✅
- [~] Page loads < 2s; endpoint < 500ms on single DB round-trip — single `findOne` with `relations: ['lots', 'lots.buyer']` satisfies the join requirement; runtime performance not verifiable from diff.
- [~] Page renders correctly at 1920×1080 landscape — Tailwind responsive grid in `ResultsStats` and `overflow-x-auto` wrapper in `LotResultsTable` are reasonable; runtime check not verifiable.

---

## Files-to-Touch contract check

| Path | In contract? | In diff? | Notes |
|---|---|---|---|
| `server/src/modules/auctions/dto/auction-results.dto.ts` | Yes (Create) | Yes ✅ | OK |
| `server/src/modules/auctions/auctions.service.ts` | Yes (Modify) | Yes ✅ | OK — also adds `markAsFinished`, see S-1 |
| `server/src/modules/auctions/auctions.controller.ts` | Yes (Modify) | Yes ✅ | OK |
| `client/middleware.ts` | Yes (Modify) | Yes ✅ | OK |
| `client/app/api/auctions/[auctionId]/results/route.ts` | Yes (Create) | No ❌ | Created at `client/app/api/results/[auctionId]/route.ts` instead (see S-2) |
| `client/app/auctions/[auctionId]/results/page.tsx` | Yes (Create) | No ❌ | Created at `client/app/results/[auctionId]/page.tsx` instead (see S-2) |
| `client/app/auctions/[auctionId]/results/components/AuctionResultsHeader.tsx` | Yes (Create) | No ❌ | Created at `client/app/results/…` instead (see S-2) |
| `client/app/auctions/[auctionId]/results/components/ResultsStats.tsx` | Yes (Create) | No ❌ | Created at `client/app/results/…` instead (see S-2) |
| `client/app/auctions/[auctionId]/results/components/LotResultsTable.tsx` | Yes (Create) | No ❌ | Created at `client/app/results/…` instead (see S-2) |
| `client/src/api/dto/auction-results.dto.ts` | No | Yes | New file; reasonable ancillary addition — not a concern |
| `server/src/modules/room/room.service.ts` | No | Yes ⚠️ | Out-of-contract modification (see S-1) |
| `client/src/modules/room-engine/admin/AdminRoomContext.tsx` | No | Yes ⚠️ | Out-of-contract — implements FR-2 (separate task) |
| `client/src/modules/room-engine/member/MemberRoomContext.tsx` | No | Yes ⚠️ | Out-of-contract — implements FR-3 |
| `client/src/modules/room-engine/member/MemberRoomEngine.ts` | No | Yes ⚠️ | Out-of-contract — implements FR-3 |
| `client/src/modules/room-engine/public/PublicRoomContext.tsx` | No | Yes ⚠️ | Out-of-contract — implements FR-4 |
| `client/src/modules/room-engine/public/PublicRoomEngine.ts` | No | Yes ⚠️ | Out-of-contract — implements FR-4 |
| `client/app/crm/auctions/[auctionId]/page.tsx` | No | Yes ⚠️ | Out-of-contract — partial FR-9/FR-10 (see S-3) |
| `client/app/room/[roomId]/page.tsx` | No | Yes | Formatting-only change; negligible |
| `server/src/modules/auctions/dto/auction.dto.ts` | No | Yes | Trailing whitespace fix; negligible |
| `server/src/modules/auth/auth.controller.ts` | No | Yes | Removes unnecessary `!` non-null assertion; negligible |
| `client/tsconfig.json` | No | Yes ⚠️ | Excludes test files from TS compilation (see N-3) |

---

## Findings

### Blocking

#### B-1 — Owner absent from results endpoint and page render

**Where:**
- `server/src/modules/auctions/dto/auction-results.dto.ts` (entire file — no `ownerName` field)
- `client/src/api/dto/auction-results.dto.ts` (entire file — no `ownerName` field)
- `client/app/results/[auctionId]/components/AuctionResultsHeader.tsx` (entire file — owner not in props or JSX)
- `server/src/modules/auctions/auctions.service.ts:130–161` (`getAuctionResults` — owner relation not loaded, not mapped)

**What:** AC-4 and FR-6 both explicitly require the results page to display "auction name, date, **and owner**". None of the three layers (server DTO, client DTO, UI component) include an owner field. The `getAuctionResults` query loads `['lots', 'lots.buyer']` but not `owner`. As a result, no owner name or identifier is surfaced anywhere on the page.

**Why blocking:** Directly violates AC-4 ("The results page displays auction name, date, and owner") and FR-6 ("shall display auction metadata: auction name, date, and owner"), both of which are in T-001's related requirements. The DoD item "returns auction metadata" cannot be considered satisfied without this field.

**Suggested fix:**
```ts
// auctions.service.ts — add 'owner' to relations
const auction = await this.auctionsRepository.findOne({
  where: { id: auctionId },
  relations: ['lots', 'lots.buyer', 'owner'],
});

// In return value:
ownerName: auction.owner.email, // or a display name if User has one
```
Add `ownerName: string` to `AuctionResultsDto`, `AuctionResults` client type, and render it in `AuctionResultsHeader`.

---

#### B-2 — Missing TypeORM migration for `finishedAt` column

**Where:** `server/src/modules/auctions/entities/auction.entity.ts:35–36` (new `finishedAt` column added)

**What:** The `Auction` entity gained a `@Column({ type: 'timestamp', nullable: true }) finishedAt: Date | null` field, but no migration was generated. The existing migration at `server/src/migrations/1774366665437-Auto.ts` creates the `auction` table without a `finishedAt` column. In any environment that does not use `synchronize: true` (all non-local environments), `markAsFinished()` will throw a PostgreSQL error on the UPDATE query because the column does not exist in the schema.

**Why blocking:** The `markAsFinished` call in `room.service.ts:197` is on the hot path of `finishAuction`. A missing column causes a runtime exception that breaks auction completion for all users in any non-synchronize environment. This is a production breakage.

**Suggested fix:**
```bash
cd server && npm run migration:generate -- -n AddFinishedAtToAuction
# Then verify the generated migration adds the nullable timestamp column.
```

---

### Significant

#### S-1 — Out-of-contract server-side hook: `markAsFinished` + `room.service.ts` modification

**Where:**
- `server/src/modules/auctions/auctions.service.ts:119–128` (`markAsFinished` method)
- `server/src/modules/room/room.service.ts:191–200` (calls `markAsFinished`)

**What:** T-001's Files-to-Touch does not list `server/src/modules/room/room.service.ts` as a modify target. It was modified to call the new `markAsFinished` method. The `markAsFinished` method itself is not part of the results endpoint specification — it is a persistence side-effect of auction completion. The task description explicitly says "Redirect/transition logic (FR-1–FR-4) and CRM status changes (FR-9–FR-10) are separate tasks."

**Why:** Violates the Files-to-Touch contract. While the change is architecturally correct (the `finishedAt` timestamp must be written somewhere), doing it in T-001 silently expands scope. If a future task is assigned to handle the `finishAuction` flow separately, this change will be invisible to that reviewer.

**Suggested fix:** Either (a) scope-acknowledge this in the task notes before merging — "T-001 also wires `markAsFinished` into `room.service.ts` to populate `finishedAt`" — or (b) move this to the redirect/transition task. No code change needed if acknowledged.

---

#### S-2 — URL path deviates from contract; page/BFF files at wrong paths

**Where:**
- `client/app/results/[auctionId]/page.tsx` — created instead of `client/app/auctions/[auctionId]/results/page.tsx`
- `client/app/api/results/[auctionId]/route.ts` — created instead of `client/app/api/auctions/[auctionId]/results/route.ts`
- All component files under `client/app/results/[auctionId]/components/`

**What:** The task description specifies the page at `/auctions/[auctionId]/results` and the BFF route at `client/app/api/auctions/[auctionId]/results/route.ts`. The implementation inverted the segment order — the page is at `/results/[auctionId]` and the BFF is at `client/app/api/results/[auctionId]/route.ts`. The DoD requires the page to be at `/auctions/[auctionId]/results`; this is unmet.

**Why:** Deviates from the Files-to-Touch contract (none of the five specified "Create" paths match what was actually created). The stable URL is part of the user-facing spec (FR-5 references a "stable URL") — any external links or bookmarks built against `/auctions/:id/results` will break.

**Suggested fix:** Move files to the spec'd paths or explicitly propose a URL change via task amendment before merging. If `/results/[auctionId]` is preferred (simpler nesting), update the task description and the middleware comment to document the intentional deviation.

---

#### S-3 — Test scaffold description incorrect for UNSOLD status variant

**Where:** `client/app/results/[auctionId]/components/LotResultsTable.test.tsx:7`

**What:**
```ts
it.todo('uses StatusBadge with draft variant for unsold status');
```
But in `LotResultsTable.tsx:8–11`, the status map is:
```ts
const LOT_STATUS_MAP = { sold: 'success', unsold: 'error', created: 'draft' };
```
`unsold` maps to `'error'`, not `'draft'`. `'draft'` is the variant for `created`. The test description will mislead whoever fills in this scaffold — they will write an assertion for the wrong variant.

**Why:** The Test Plan in T-001 §6 specifies "uses `StatusBadge` with correct variant per status" — the scaffold description contradicts the implementation, so the test cannot be correctly filled without first reading the source. The task spec suggested `'secondary'` (not a valid `Variant`), the implementation chose `'error'`, and the test describes `'draft'`. All three disagree.

**Suggested fix:** Update the todo description to reflect the actual mapping:
```ts
it.todo('uses StatusBadge with error variant for unsold status');
it.todo('uses StatusBadge with draft variant for created status');
```

---

### Nits

#### N-1 — `'error'` variant for UNSOLD has wrong semantic weight

**Where:** `client/app/results/[auctionId]/components/LotResultsTable.tsx:8`

**What:** `unsold: 'error'` renders the UNSOLD badge in error (red) styling. An unsold lot is not an error — it is a neutral outcome. Valid alternatives from `Variant = 'draft' | 'error' | 'info' | 'success' | 'default'` are `'draft'` or `'default'`, both of which communicate "nothing happened" rather than "something went wrong".

**Suggested fix:** Change to `unsold: 'default'` (or `'draft'` if you want the muted styling already used for `created`-state lots elsewhere in the codebase).

---

#### N-2 — `?role=admin` query param is a fragile admin-detection mechanism

**Where:**
- `client/app/results/[auctionId]/page.tsx:8,18` — reads `role` from `searchParams`
- `client/app/crm/auctions/[auctionId]/page.tsx:30` — appends `?role=admin` to the link
- `client/src/modules/room-engine/admin/AdminRoomContext.tsx:36` — appends `?role=admin` on redirect

**What:** Any unauthenticated user can navigate to `/results/:id?role=admin` and see the "Back to auction" admin link. The link itself leads to a CRM page that is auth-protected, so there is no security breach. However the presence of an admin-looking UI element for public users is an unintended leak of internal structure.

**Suggested fix:** Since the results page is RSC, consider checking server-side session presence to determine `isAdmin` instead of relying on a URL param — or accept the limitation and document it as a known non-issue since the target of the link is auth-gated.

---

#### N-3 — `totalValue` displayed as a raw integer with no currency formatting

**Where:** `client/app/results/[auctionId]/components/ResultsStats.tsx:27`

**What:** `<StatCard label="Value Raised" value={totalValue} />` renders e.g. `4500` with no currency symbol, separator, or locale formatting. The `Lot` entity has a `currency` field, but it is not included in the results DTO. On a results page shown to venue attendees, a bare integer is ambiguous.

**Suggested fix:** Either include `currency` in the DTO and format with `Intl.NumberFormat`, or at minimum document this as a known gap for v2.

---

## Alignment with the ADR

No ADR exists for FEAT-001 (documented in T-001 §8: "No ADR — feature uses existing patterns throughout"). ADR alignment check is not applicable.

Conventions verified against existing codebase:
- ✅ TypeORM relations query via `findOne({ relations: [...] })` — matches `room.service.ts` pattern.
- ✅ NestJS controller route registered without class-level guard (all other routes then individually guarded) — matches refactored pattern in the diff.
- ✅ `withNextErrorResponse` wrapper in BFF proxy — matches `client/app/api/` existing routes.
- ✅ RSC fetches data using server-side `auctionsAPI` wrapper — matches `client/app/crm/` RSC pages.
- ✅ shadcn/ui `Card`, `Table` primitives used — matches existing CRM page conventions.
- ⚠️ URL path structure deviates from task spec (S-2).
- ⚠️ `'error'` variant for a neutral state deviates from how other neutral states are mapped in the codebase (N-1).

---

## Test scaffold coverage

| Test Plan item | Scaffold present? | Notes |
|---|---|---|
| `getAuctionResults` service: stats computation | ✅ `auctions.service.spec.ts:3` | todo present |
| `getAuctionResults` service: NotFoundException | ✅ `auctions.service.spec.ts:4` | todo present |
| `getAuctionResults` service: buyer email excluded | ✅ `auctions.service.spec.ts:5` | todo present |
| `getAuctionResults` service: null buyerName for unsold | ✅ `auctions.service.spec.ts:6` | todo present |
| `LotResultsTable`: SOLD row with price and buyer name | ✅ `LotResultsTable.test.tsx:4` | todo present |
| `LotResultsTable`: UNSOLD row with em-dash | ✅ `LotResultsTable.test.tsx:5` | todo present |
| `LotResultsTable`: StatusBadge variant per status | ✅ `LotResultsTable.test.tsx:6,7` | ⚠️ Description wrong (see S-3) |
| `ResultsStats`: correct values for four stat cards | ✅ `ResultsStats.test.tsx:4–7` | todo present |
| E2E: navigate without auth session — no redirect | ❌ | No Playwright scaffold created |
| E2E: auction name, stats, lot row visible | ❌ | No Playwright scaffold created |

Two E2E scaffolds from the Test Plan are missing. Given that public-route accessibility (AC-8) is a key DoD item, the Playwright scaffold for the no-auth navigation test would be particularly valuable to have before `sdlc-tests` fills it in.

---

## Open questions for the user

- **OQ-A:** Should the URL be `/results/[auctionId]` (as implemented) or `/auctions/[auctionId]/results` (as specified)? The implemented path avoids conflict with the CRM's `/crm/auctions/[auctionId]` tree, but diverges from the task spec's stated stable URL.
- **OQ-B:** What "owner" field should be displayed — the owner's email, a username, or a separate `displayName` field? The `User` entity appears to have only `email` and `password`. If email is too sensitive for a public page, this needs an explicit decision before B-1 can be fixed.
- **OQ-C:** Should the `finishedAt` timestamp be stored in UTC and displayed in the auction's local timezone, or is UTC display acceptable for the display screen use case?

---

## Out of scope for this review

- Deep security audit of the public endpoint (no auth guard, buyer name exposure) → `sdlc-security`.
- Test logic correctness → `sdlc-tests` (only scaffolds reviewed here).
- Diagram updates for the new `/results` route → `sdlc-docs`.
- Redirect/transition correctness for the out-of-contract room engine changes → separate review once the redirect task is formally created.
