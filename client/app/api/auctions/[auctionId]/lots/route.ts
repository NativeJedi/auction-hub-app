import { NextResponse } from 'next/server';
import { withNextErrorResponse } from '@/src/api/core/middlewares';
import { createLotServer, fetchLotsServer } from '@/src/api/auctions-api/requests/lots';

type Options = { params: Promise<{ auctionId: string }> };

const getLots = async (req: Request, { params }: Options) => {
  const { auctionId } = await params;

  const lots = await fetchLotsServer(auctionId);

  return NextResponse.json(lots);
};

const createLot = async (req: Request, { params }: Options) => {
  const body = await req.json();
  const { auctionId } = await params;

  const lot = await createLotServer(auctionId, body);

  return NextResponse.json(lot);
};

export const POST = withNextErrorResponse(createLot);
export const GET = withNextErrorResponse(getLots);
