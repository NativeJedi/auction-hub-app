import { NextResponse } from 'next/server';
import { withNextErrorResponse } from '@/src/api/core/middlewares';
import { resendConfirmationServer } from '@/src/api/auctions-api/requests/auth';

const resendConfirmation = async (req: Request) => {
  const { email } = await req.json();
  const result = await resendConfirmationServer(email);
  return NextResponse.json(result);
};

export const POST = withNextErrorResponse(resendConfirmation);
