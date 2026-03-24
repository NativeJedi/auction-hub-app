import { NextResponse } from 'next/server';
import { withNextErrorResponse } from '@/src/api/core/middlewares';
import { addLotImagesServer } from '@/src/api/auctions-api/requests/lots';

type Options = { params: Promise<{ auctionId: string; lotId: string }> };

const addImages = async (req: Request, { params }: Options) => {
  const { auctionId, lotId } = await params;
  const body = await req.json();

  const data = await addLotImagesServer(auctionId, lotId, body);

  return NextResponse.json(data);
};

export const POST = withNextErrorResponse(addImages);
