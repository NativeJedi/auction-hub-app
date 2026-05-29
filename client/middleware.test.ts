import { describe, it } from 'vitest';

// Scaffold — filled in by sdlc-tests.
// middleware() gates non-allowlisted paths. Tests mock next/headers cookies()
// to control session presence and assert NextResponse.next() vs a redirect to
// /crm/auth. The '/' exact-match must not widen the slice-based allowlist.
describe('middleware', () => {
  it.todo("allows '/' through without a session (does not redirect to /crm/auth)");
  it.todo('redirects a protected route (e.g. /crm/auctions) to /crm/auth without a session');
  it.todo('passes a known public slice (e.g. /room) through without a session');
});
