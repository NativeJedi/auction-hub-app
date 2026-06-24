import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME } from '@/src/services/session/constants';
import { sessionStorage } from '@/src/services/session';

const publicRoutes = ['/crm/auth', '/room', '/results', '/confirm-email'];

// Crawlable, session-less endpoints that must never be gated. Exact-match only:
// the landing owns `/`, and the SEO files must reach anonymous crawlers (ADR-FEAT-009-01 §7).
const alwaysPublicPaths = ['/', '/robots.txt', '/sitemap.xml'];

export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // The slice-based publicRoutes check below uses `path.includes`, so a '/' slice
  // would match every path — these roots must be exact matches instead.
  if (alwaysPublicPaths.includes(path)) return NextResponse.next();

  const isPublicRoute = publicRoutes.some((routeSlice) => path.includes(routeSlice));

  if (isPublicRoute) return NextResponse.next();

  // Single source of truth for auth: validate the ACTUAL session (Redis lookup
  // + token refresh), not just the cookie's presence. Runs on the Node.js
  // runtime (stable since Next 15.5) — the Edge runtime can't use ioredis or
  // the refresh flow.
  const sessionId = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = sessionId ? await sessionStorage.getValidSession(sessionId) : null;

  if (!session) {
    const loginUrl = new URL('/crm/auth', req.url);
    loginUrl.searchParams.set('from', req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  runtime: 'nodejs',
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};
