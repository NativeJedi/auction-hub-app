import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SESSION_COOKIE_NAME } from '@/src/services/session/constants';

const publicRoutes = ['/crm/auth', '/room', '/results', '/confirm-email'];

export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // The landing page owns `/` and is reachable by everyone. The slice-based
  // publicRoutes check below uses `path.includes`, so a '/' slice would match
  // every path — the root must be an exact match instead (ADR-FEAT-009-01 §7).
  if (path === '/') return NextResponse.next();

  const isPublicRoute = publicRoutes.some((routeSlice) => path.includes(routeSlice));

  if (isPublicRoute) return NextResponse.next();

  const sessionId = (await cookies()).get(SESSION_COOKIE_NAME)?.value;

  if (!sessionId) {
    const loginUrl = new URL('/crm/auth', req.url);
    loginUrl.searchParams.set('from', req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};
