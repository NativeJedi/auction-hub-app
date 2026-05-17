# Task T-003: Next.js BFF Routes + Page Routing

**Task ID:** T-003
**Feature:** FEAT-002-room-identity-refactor
**Status:** Todo
**Priority:** Must-have
**Depends on:** T-002

---

## 1. Context

With the REST API and client engine updated in T-002, this final task surfaces the `auctionId` rename in the Next.js application layer: the BFF API proxy routes (cookie keys, path parameters, header forwarding) and the page routes (dynamic segment `[roomId]` → `[auctionId]`, `useParams`, and navigation links). These are intentionally the last layer to touch because they depend on a stable API contract and client engine interface.

Related requirements: ADR §4 (Option B), ADR §5 (client-side WebSocket channel subscriptions and token storage updated)

## 2. Description

Rename the Next.js dynamic route segment `[roomId]` to `[auctionId]` in both `app/api/room/` and `app/room/`. Update all BFF route handlers to read/write cookies keyed by `auctionId` (`roomToken:${auctionId}`) and to forward the correct `x-room-token` to the NestJS server. Update the `useRoomId` param hook to `useAuctionId`. Update client API request functions in `client/src/api/` to use `:auctionId` path segments. Fix any navigation links or `router.push` calls that construct room URLs using `roomId`.

## 3. Files to Touch

**Modify (rename directory structure):**
- `client/app/api/room/[roomId]/` → `client/app/api/room/[auctionId]/` — rename dynamic segment folder
- `client/app/room/[roomId]/` → `client/app/room/[auctionId]/` — rename dynamic segment folder and all nested folders/files

**Modify (file contents):**
- `client/app/api/room/route.ts` — cookie key `roomToken:${data.room.id}` → `roomToken:${auctionId}` (where `auctionId = data.room.id` after T-001)
- `client/app/api/room/[auctionId]/route.ts` — `params.roomId` → `params.auctionId`; cookie key `roomToken:${auctionId}`
- `client/app/api/room/[auctionId]/admin/route.ts` — `params.roomId` → `params.auctionId`; cookie read uses `auctionId`
- `client/app/api/room/[auctionId]/invite/route.ts` — `params.roomId` → `params.auctionId`; forwarded path segment
- `client/app/api/room/[auctionId]/invite/confirm/route.ts` — cookie write uses `auctionId`
- `client/app/room/[auctionId]/hooks.ts` — rename `useRoomId` to `useAuctionId`; `useParams<{ auctionId: string }>()`
- `client/app/room/[auctionId]/page.tsx` — use `useAuctionId()`; pass `auctionId` to `PublicRoomProvider`
- `client/app/room/[auctionId]/member/page.tsx` — use `useAuctionId()`; pass `auctionId` to `MemberRoomProvider`
- `client/app/room/[auctionId]/admin/page.tsx` — use `useAuctionId()`; pass `auctionId` to `AdminRoomProvider`
- `client/app/room/[auctionId]/invite/page.tsx` — use `useAuctionId()`
- `client/app/room/[auctionId]/invite/confirm/page.tsx` — use `useAuctionId()` or `useMemberEngine`
- `client/src/api/auctions-api-client/requests/room.ts` — endpoint paths from `/room/${roomId}` → `/room/${auctionId}`
- `client/src/api/auctions-api/requests/room.ts` — endpoint paths + `x-room-token` cookie key name in header reads

**Search and fix:**
- Any `router.push('/room/${roomId}/…')` or `href="/room/${roomId}/…"` occurrences in client components — update to use `auctionId`

**Read for context (no changes expected):**
- `client/src/modules/room-engine/*/` — confirm providers accept `auctionId` prop (done in T-002)

## 4. Implementation Plan

1. **Rename dynamic route directories.** Rename `client/app/api/room/[roomId]/` to `client/app/api/room/[auctionId]/` and `client/app/room/[roomId]/` to `client/app/room/[auctionId]/`. In Next.js App Router, the folder name is the param key — renaming is sufficient for routing. All nested subdirectories move with the parent.

2. **Update BFF POST `/api/room` (create room).** In `client/app/api/room/route.ts`, after the NestJS call returns `data.room`, the cookie key changes from `roomToken:${data.room.id}` to `roomToken:${data.room.id}` — this is unchanged in value since `room.id` now equals `auctionId`, but verify the cookie `path` is set to `/api/room/${data.room.id}/admin` (still correct). No field name change needed here as long as the value is the `auctionId`.

3. **Update BFF GET handlers.** In each of `[auctionId]/route.ts` and `[auctionId]/admin/route.ts`, replace `params.roomId` with `params.auctionId`. Update cookie reads from `roomToken:${roomId}` to `roomToken:${auctionId}`. Update the forwarded NestJS API path from `/room/${roomId}/…` to `/room/${auctionId}/…`.

4. **Update BFF POST `/invite/confirm`.** In `[auctionId]/invite/confirm/route.ts`, the cookie set after confirmation changes from `roomToken:${roomId}` to `roomToken:${auctionId}`. Cookie `path` should be `/api/room/${auctionId}`.

5. **Update `hooks.ts` param hook.** Rename `useRoomId` to `useAuctionId`; change `useParams<{ roomId: string }>()` to `useParams<{ auctionId: string }>()`. Update all page files in `app/room/[auctionId]/` that call `useRoomId()` to call `useAuctionId()`.

6. **Update page components.** For each page under `app/room/[auctionId]/`, replace `roomId` variable with `auctionId` and pass `auctionId` to the appropriate provider (`PublicRoomProvider auctionId={auctionId}`, etc.).

7. **Update client API request functions.** In `client/src/api/auctions-api-client/requests/room.ts` and `client/src/api/auctions-api/requests/room.ts`, rename function parameters from `roomId` to `auctionId` and update the URL template strings accordingly.

8. **Search and fix remaining nav links.** Run a grep for `roomId` across `client/app/` and `client/src/` to catch any `router.push`, `href`, or link construction that still uses the old variable name. Fix each occurrence.

## 5. Definition of Done

- [ ] All code in "Files to Touch" is written and lints cleanly (`cd client && npm run lint`).
- [ ] No regressions in existing tests.
- [ ] Code follows existing Next.js App Router conventions.
- [ ] `cd client && npm run build` exits with no TypeScript errors.
- [ ] Navigating to `/room/${auctionId}` loads the public room page.
- [ ] Navigating to `/room/${auctionId}/admin` loads the admin room page with valid token.
- [ ] Navigating to `/room/${auctionId}/member` loads the member room page with valid token.
- [ ] Invite flow end-to-end: POST `/api/room/${auctionId}/invite` sends email; GET `/room/${auctionId}/invite/confirm?token=…` confirms membership and sets cookie.
- [ ] No `roomId` references remain in `client/app/` or `client/src/api/` (verify with grep).

## 6. Test Plan

**Unit tests (Vitest):**
- `useAuctionId()` hook — returns correct param from mock `useParams`

**Component tests (RTL):**
- Not required — BFF route handlers are Next.js server code; page components are thin providers.

**E2E tests (Playwright):**
- Full room flow: create auction → start room → admin joins → invite member → member joins → place bid → finish auction. Verify each page loads at the `[auctionId]`-based URL.
- Reset flow: finish auction → reset → re-start room → admin joins at the same `auctionId` URL.

**Test data needs:**
- A seeded auction with known `auctionId` for E2E fixture

## 7. Notes & Considerations

- **Next.js param key is the folder name.** Renaming `[roomId]` to `[auctionId]` is a filesystem rename, not a code change alone. Ensure git tracks the rename (`git mv`) rather than treating it as delete + create, to preserve history.
- **Cookie path scope.** The current cookie for the admin token is scoped to `/api/room/${roomId}/admin`. After rename, the path becomes `/api/room/${auctionId}/admin`. Since `auctionId === roomId` in value (the UUID is now the auction's id), existing cookies from before the deployment will be under stale paths and will not be read — users will need to re-authenticate. This is acceptable per ADR §5 (maintenance window).
- **`x-room-token` header name unchanged.** The header name stays `x-room-token`; only the cookie key that feeds into it changes.
- **Grep sweep.** Before marking done, run `grep -r "roomId" client/app client/src/api` to confirm no stale references remain.

## 8. References

- ADR: `03-adr.md` — §4 (Option B), §5 (Consequences: client-side token storage and URL-based room identity)
- Related tasks: T-001 (server core), T-002 (REST API + client engine, prerequisite)
