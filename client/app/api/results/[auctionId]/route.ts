import { NextResponse } from 'next/server';
import { withNextErrorResponse } from '@/src/api/core/middlewares';
import { fetchAuctionResultsServer } from '@/src/api/auctions-api/requests/auctions';

type Options = { params: Promise<{ auctionId: string }> };

const fetchResults = async (req: Request, { params }: Options) => {
  const { auctionId } = await params;

  const results = await fetchAuctionResultsServer(auctionId);

  return NextResponse.json(results);
};

export const GET = withNextErrorResponse(fetchResults);
