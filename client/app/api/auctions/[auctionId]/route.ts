import { NextResponse } from 'next/server';
import { withNextErrorResponse } from '@/src/api/core/middlewares';
import {
  deleteAuctionServer,
  fetchAuctionByIdServer,
} from '@/src/api/auctions-api/requests/auctions';

type Options = { params: Promise<{ auctionId: string }> };

const deleteAuction = async (req: Request, { params }: Options) => {
  const { auctionId } = await params;

  await deleteAuctionServer(auctionId);

  return NextResponse.json({ message: 'Auction deleted successfully' });
};

const fetchAuctionById = async (req: Request, { params }: Options) => {
  const { auctionId } = await params;

  const auction = await fetchAuctionByIdServer(auctionId);

  return NextResponse.json(auction);
};

export const DELETE = withNextErrorResponse(deleteAuction);

export const GET = withNextErrorResponse(fetchAuctionById);
