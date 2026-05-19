import { NextResponse } from 'next/server';
import { withNextErrorResponse } from '@/src/api/core/middlewares';
import { startAuctionServer } from '@/src/api/auctions-api/requests/room';

type Options = { params: Promise<{ auctionId: string }> };

const startAuction = async (_req: Request, { params }: Options) => {
  const { auctionId } = await params;

  const data = await startAuctionServer({ auctionId });

  const response = NextResponse.json(data);

  response.cookies.set(`roomToken:${data.room.auctionId}`, data.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: `/api/room/${data.room.auctionId}`,
  });

  return response;
};

export const POST = withNextErrorResponse(startAuction);
