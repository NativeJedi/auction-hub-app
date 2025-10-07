import { NextResponse } from 'next/server';
import { logoutServer } from '@/src/api/requests/server/auth';
import { withNextErrorResponse } from '@/src/api/core/middlewares';

const logout = async () => {
  const result = await logoutServer();

  const response = NextResponse.json(result);

  response.cookies.delete('accessToken');
  response.cookies.delete('refreshToken');

  return response;
};

export const POST = withNextErrorResponse(logout);
