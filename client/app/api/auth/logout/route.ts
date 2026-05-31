import { NextResponse } from 'next/server';
import { withNextErrorResponse } from '@/src/api/core/middlewares';
import { sessionStorage } from '@/src/services/session';
import { logoutServer } from '@/src/api/auctions-api/requests/auth';
import { cookies } from 'next/headers';
import { SESSION_COOKIE_NAME, SESSION_COOKIE_SETTINGS } from '@/src/services/session/constants';
import { UnauthorizedError } from '@/src/utils/errors';

const logout = async () => {
  const requestCookies = await cookies();

  const sessionId = requestCookies.get(SESSION_COOKIE_NAME);

  if (!sessionId?.value) {
    return NextResponse.json(new UnauthorizedError(), { status: 401 });
  }

  const result = await logoutServer();

  const response = NextResponse.json(result);

  // Mirror login's cookie settings (path/httpOnly/sameSite) with maxAge 0 so the
  // browser drops the cookie — otherwise the landing keeps reading it as authenticated.
  response.cookies.set(SESSION_COOKIE_NAME, '', { ...SESSION_COOKIE_SETTINGS, maxAge: 0 });

  await sessionStorage.delete(sessionId.value);

  return response;
};

export const POST = withNextErrorResponse(logout);
