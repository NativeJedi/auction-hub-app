import { NextResponse } from 'next/server';
import { withNextErrorResponse } from '@/src/api/core/middlewares';
import { presignLotImagesServer } from '@/src/api/auctions-api/requests/lots';

type Options = { params: Promise<{ auctionId: string; lotId: string }> };

const presignImages = async (req: Request, { params }: Options) => {
  const { auctionId, lotId } = await params;
  const body = await req.json();

  const data = await presignLotImagesServer(auctionId, lotId, body.count);

  return NextResponse.json(data);
};

export const POST = withNextErrorResponse(presignImages);
