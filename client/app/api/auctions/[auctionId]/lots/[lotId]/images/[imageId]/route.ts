import { NextResponse } from 'next/server';
import { withNextErrorResponse } from '@/src/api/core/middlewares';
import { deleteLotImageServer } from '@/src/api/auctions-api/requests/lots';

type Options = {
  params: Promise<{ auctionId: string; lotId: string; imageId: string }>;
};

const deleteImage = async (req: Request, { params }: Options) => {
  const { auctionId, lotId, imageId } = await params;

  await deleteLotImageServer(auctionId, lotId, imageId);

  return NextResponse.json({ message: 'Image deleted successfully' });
};

export const DELETE = withNextErrorResponse(deleteImage);
