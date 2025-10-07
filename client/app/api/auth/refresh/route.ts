import { NextResponse } from 'next/server';
import { refreshTokenServer } from '@/src/api/requests/server/auth';
import { withNextErrorResponse } from '@/src/api/core/middlewares';
import { cookies } from 'next/headers';
import { ACCESS_TOKEN_COOKIE_OPTIONS, REFRESH_TOKEN_COOKIE_OPTIONS } from '@/src/api/constants';

const refreshTokens = async (req: Request) => {
  const requestCookies = await cookies();

  const refreshToken = requestCookies.get('refreshToken')?.value;

  if (!refreshToken) {
    return NextResponse.json(
      {
        message: 'Refresh token not found',
      },
      {
        status: 401,
      }
    );
  }

  const res = await refreshTokenServer({ refreshToken });

  const response = NextResponse.json(res);

  response.cookies.set('accessToken', res.accessToken, ACCESS_TOKEN_COOKIE_OPTIONS);

  response.cookies.set('refreshToken', res.refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);

  return response;
};

export const POST = withNextErrorResponse(refreshTokens);
