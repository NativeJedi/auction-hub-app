import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SESSION_COOKIE_NAME } from '@/src/services/session/constants';

const publicRoutes = ['/crm/auth', '/room'];

export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isPublicRoute = publicRoutes.includes(path);

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
