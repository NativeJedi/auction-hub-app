import { NextResponse } from 'next/server';
import { withNextErrorResponse } from '@/src/api/core/middlewares';
import { googleNonceServer } from '@/src/api/auctions-api/requests/auth';

// Transparent proxy — delegates nonce generation entirely to Nest.
const getNonce = async (_req: Request) => {
  const { nonce } = await googleNonceServer();
  return NextResponse.json({ nonce });
};

export const GET = withNextErrorResponse(getNonce);
