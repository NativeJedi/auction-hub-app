import { NextResponse } from 'next/server';
import { withNextErrorResponse } from '@/src/api/core/middlewares';
import { createAuctionServer } from '@/src/api/auctions-api/requests/auctions';

const createAuction = async (req: Request) => {
  const body = await req.json();

  const auction = await createAuctionServer(body);

  return NextResponse.json(auction);
};

export const POST = withNextErrorResponse(createAuction);
