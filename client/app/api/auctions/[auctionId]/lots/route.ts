import { NextResponse } from 'next/server';
import { createLotServer, fetchLotsServer } from '@/src/api/requests/server/lots';
import { withNextErrorResponse } from '@/src/api/core/middlewares';

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
