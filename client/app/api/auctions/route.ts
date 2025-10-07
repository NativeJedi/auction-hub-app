import { NextResponse } from 'next/server';
import { createAuctionServer } from '@/src/api/requests/server/auctions';
import { withNextErrorResponse } from '@/src/api/core/middlewares';

const createAuction = async (req: Request) => {
  const body = await req.json();

  const auction = await createAuctionServer(body);

  return NextResponse.json(auction);
};

export const POST = withNextErrorResponse(createAuction);
