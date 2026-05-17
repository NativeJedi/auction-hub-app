import { NextResponse } from 'next/server';
import { withNextErrorResponse } from '@/src/api/core/middlewares';
import { resetAuctionServer } from '@/src/api/auctions-api/requests/room';

type Options = { params: Promise<{ auctionId: string }> };

const resetAuction = async (_req: Request, { params }: Options) => {
  const { auctionId } = await params;

  await resetAuctionServer({ auctionId });

  return new NextResponse(null, { status: 204 });
};

export const POST = withNextErrorResponse(resetAuction);
