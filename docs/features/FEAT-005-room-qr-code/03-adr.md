---
ADR ID: ADR-FEAT-005-01
Status: Proposed
Date: 2026-05-19
Feature: FEAT-005-room-qr-code
Decision makers: sdlc-adr
Supersedes: —
---

# ADR-FEAT-005-01: QR Code Generation Strategy for Room Display Page

## 1. Context

The public room display page (`/room/:auctionId`) shows a static SVG placeholder in a
"Join auction" card. This must be replaced with a real, scannable QR code that encodes the
invite registration URL: `<origin>/room/<auctionId>/invite`.

When scanned, this URL takes an attendee to the invite form (name + email). The existing
invite flow (FEAT-002) then sends an email with a confirm link
(`/room/<auctionId>/invite/confirm?token=…`) that authenticates the member.

The `auctionId` is already available on the page via the `useAuctionId()` hook. No new
data-fetching is required — the QR input is a deterministic URL derived from a value
already in scope.

No feature spec exists for FEAT-005; this ADR is written from a thin brief. The invite URL
shape is treated as settled by FEAT-002's implementation.

## 2. Decision Drivers

1. **Minimal implementation surface** — the change is a single component swap; the solution
   should not introduce server changes or new API endpoints.
2. **No external service dependencies** — the QR must render without calling a third-party
   API, both for privacy (the invite URL contains the auctionId) and offline resilience.
3. **Visual fidelity** — the output must be a real, scannable QR code (not decorative).
   Styling should respect the existing Tailwind + shadcn/ui conventions (SVG preferred so
   `currentColor` theming applies).
4. **Dependency footprint** — bundle size impact should be negligible (<10 kB gzipped).
5. **Maintenance** — the chosen library should be actively maintained and widely adopted.

## 3. Options Considered

### Option A — Client-side React QR library (`react-qr-code`)

A lightweight React component that renders a real QR code as inline SVG directly in the
browser. Drop-in replacement for `QrPlaceholder`:
`<QRCode value={inviteUrl} size={140} />`.

- **Pros:** Zero server changes; renders synchronously (no loading state); SVG output
  inherits text color and scales cleanly; works offline; ~3 kB gzipped.
- **Cons:** Adds one npm dependency to the client workspace.
- **Estimated effort:** ~30 min (install, swap component, verify scanability).

---

### Option B — Server-side NestJS QR endpoint

Add a new `GET /room/:auctionId/qr` endpoint that generates a QR PNG/SVG using a
server-side library (e.g., `qrcode`) and returns it as an image. The client renders
`<img src="/api/room/{auctionId}/qr" />`.

- **Pros:** QR generation logic lives server-side; response could be cached at the CDN layer.
- **Cons:** Requires a new controller route, a new server dependency, an async image load
  (introduces a loading state), and meaningfully more code — all for a URL that is
  completely static and already known on the client. No practical benefit over Option A for
  this use case.
- **Estimated effort:** ~3–4 h (endpoint, dto, test, client fetch wiring).

---

### Option C — External QR code API (e.g., `api.qrserver.com`)

Render `<img src="https://api.qrserver.com/v1/create-qr-code/?data=<encodedUrl>&size=140x140" />`
with zero code beyond a URL construction.

- **Pros:** No library or server code needed.
- **Cons:** Sends the invite URL to a third-party server on every page render (privacy
  concern); fails offline or if the service is unavailable; introduces an external runtime
  dependency that is outside the project's control.
- **Estimated effort:** ~10 min, but violates driver #2.

## 4. Comparison

| Criterion                       | A — Client library | B — Server endpoint | C — External API |
|---------------------------------|--------------------|---------------------|------------------|
| Server changes required         | None               | New route + test    | None             |
| New npm dependency              | 1 client pkg       | 1 server pkg        | None             |
| Renders offline                 | Yes                | Yes (once served)   | No               |
| Privacy (no 3rd-party)          | Yes                | Yes                 | **No**           |
| Bundle size impact              | ~3 kB gzipped      | 0 client            | 0 client         |
| Implementation effort           | Low                | High                | Trivial but rejected |
| SVG / `currentColor` theming    | Yes                | Depends on format   | No (PNG img tag) |

## 5. Decision

**Chosen: Option A — client-side React QR library (`react-qr-code`).**

Drivers #1 (minimal surface) and #2 (no external service) eliminate Options B and C
respectively. Option A satisfies all five drivers: no server changes, no third-party
calls, SVG output that integrates with the existing Tailwind theme, negligible bundle
cost, and an active library with strong adoption.

The single tradeoff — adding one npm package — is accepted; the client workspace already
depends on multiple third-party libraries and a ~3 kB addition is within acceptable bounds.

## 6. Tradeoffs

| Gained                                              | Sacrificed                                    |
|-----------------------------------------------------|-----------------------------------------------|
| Real, scannable QR with no server or network dep    | One additional client dependency              |
| SVG output — scales to any size, respects theme     | Server-side cacheability (not needed here)    |
| Synchronous render — no loading state needed        | —                                             |

## 7. Known Limitations

- This decision covers only the display of a static invite URL. If the invite flow ever
  moves to pre-generated tokens embedded in QR codes (rather than token-per-email), the QR
  content strategy must be revisited (content changes, this library still applies).
- The QR code size is fixed at 140 px max in the current layout. Accessibility at small
  print sizes was not evaluated; this is a display-only screen constraint.
- Error correction level defaults to `L` (low) in most libraries. If a logo is ever
  overlaid on the QR code, level must be raised to `H`; that is a one-line config change.

## 8. Future Optimization Opportunities

- **Logo overlay**: When branding requirements arrive, switch `react-qr-code`'s
  `bgColor`/`fgColor` and add a centered logo via absolute positioning — no library change
  needed.
- **Token-embedded QR**: If the invite flow adds pre-auth tokens (bypass email step),
  replace the static URL with a signed short-lived URL. The rendering approach is unchanged;
  only the `value` prop changes.
- **Print support**: The SVG output is already print-friendly. A `window.print()`
  button can be added without touching the QR implementation.

## 9. Consequences

- **Client dependency**: `react-qr-code` added to `client/package.json`.
- **Code change**: `QrPlaceholder` (inline SVG, ~70 lines) replaced by a `<QRCode>`
  wrapper component in `client/app/room/[auctionId]/page.tsx`.
- **URL construction**: `inviteUrl` derived as
  `${window.location.origin}/room/${auctionId}/invite` using the existing `useAuctionId()`
  hook.
- **No server changes**, no new API routes, no migration, no Redis changes.
- **Testing**: Visual/scanability test on the public room page. No unit test needed for a
  pure prop-driven library component.

## 10. References

- Invite flow implementation: FEAT-002-room-identity-refactor
  (`docs/features/FEAT-002-room-identity-refactor/03-adr.md`)
- Usage site: `client/app/room/[auctionId]/page.tsx` (lines 14–77, `QrPlaceholder`)
- Invite registration page: `client/app/room/[auctionId]/invite/page.tsx`
- `react-qr-code` npm package (model knowledge; no WebSearch performed)
