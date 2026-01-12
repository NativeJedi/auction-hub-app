import { NextResponse } from 'next/server';
import { withNextErrorResponse } from '@/src/api/core/middlewares';
import { sessionStorage } from '@/src/services/session';
import { SESSION_COOKIE_NAME, SESSION_COOKIE_SETTINGS } from '@/src/services/session/constants';
import { loginServer } from '@/src/api/auctions-api/requests/auth';

const login = async (req: Request) => {
  const body = await req.json();

  const { accessToken, refreshToken, user } = await loginServer(body);

  const response = NextResponse.json({ user });

  const { id } = await sessionStorage.create({
    accessToken,
    refreshToken,
  });

  response.cookies.set(SESSION_COOKIE_NAME, id, SESSION_COOKIE_SETTINGS);

  return response;
};

export const POST = withNextErrorResponse(login);
