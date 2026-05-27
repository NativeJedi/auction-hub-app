import { NextResponse } from 'next/server';
import { withNextErrorResponse } from '@/src/api/core/middlewares';
import { confirmEmailServer } from '@/src/api/auctions-api/requests/auth';

const confirmEmail = async (req: Request) => {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token') ?? '';
  const result = await confirmEmailServer(token);
  return NextResponse.json(result);
};

export const GET = withNextErrorResponse(confirmEmail);
