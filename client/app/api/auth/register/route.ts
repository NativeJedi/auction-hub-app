import { NextResponse } from 'next/server';
import { withNextErrorResponse } from '@/src/api/core/middlewares';
import { registerServer } from '@/src/api/auctions-api/requests/auth';

const register = async (req: Request) => {
  const body = await req.json();
  const result = await registerServer(body);
  return NextResponse.json(result);
};

export const POST = withNextErrorResponse(register);
