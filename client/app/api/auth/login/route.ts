import { NextResponse } from 'next/server';
import { loginServer } from '@/src/api/requests/server/auth';
import { withNextErrorResponse } from '@/src/api/core/middlewares';
import { ACCESS_TOKEN_COOKIE_OPTIONS, REFRESH_TOKEN_COOKIE_OPTIONS } from '@/src/api/constants';

const login = async (req: Request) => {
  const body = await req.json();

  const { accessToken, refreshToken, user } = await loginServer(body);

  const response = NextResponse.json({ user });

  response.cookies.set('accessToken', accessToken, ACCESS_TOKEN_COOKIE_OPTIONS);

  response.cookies.set('refreshToken', refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);

  return response;
};

export const POST = withNextErrorResponse(login);
