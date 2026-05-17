import { NextResponse } from 'next/server';
import { withNextErrorResponse } from '@/src/api/core/middlewares';
import { cookies } from 'next/headers';
import { finishAuctionServer } from '@/src/api/auctions-api/requests/room';

type Options = { params: Promise<{ auctionId: string }> };

const finishAuction = async (_req: Request, { params }: Options) => {
  const { auctionId } = await params;

  const requestCookie = await cookies();
  const roomToken = requestCookie.get(`roomToken:${auctionId}`)?.value;

  if (!roomToken) {
    return NextResponse.json({}, { status: 401 });
  }

  await finishAuctionServer({ auctionId, token: roomToken });

  return new NextResponse(null, { status: 204 });
};

export const POST = withNextErrorResponse(finishAuction);
